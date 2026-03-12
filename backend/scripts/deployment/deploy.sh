#!/bin/bash
# ============================================================
# SmartBankAI — Production Deployment Script
# Usage: bash scripts/deployment/deploy.sh [dev|staging|prod]
# ============================================================
set -euo pipefail

ENVIRONMENT="${1:-dev}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DEPLOY_LOG="/tmp/smartbankai_deploy_${TIMESTAMP}.log"

# Load env
if [ -f "$ROOT_DIR/.env" ]; then
  export $(grep -v '^#' "$ROOT_DIR/.env" | xargs)
fi

: "${AWS_REGION:?AWS_REGION is required}"
: "${CF_STACK_NAME:?CF_STACK_NAME is required}"
: "${S3_DEPLOYMENT_BUCKET:?S3_DEPLOYMENT_BUCKET is required}"
: "${MONGODB_URI:?MONGODB_URI is required}"

echo "================================================================"
echo "  SmartBankAI Deployment — Environment: $ENVIRONMENT"
echo "  Stack: $CF_STACK_NAME"
echo "  Region: $AWS_REGION"
echo "  Started: $(date)"
echo "================================================================"

# ─── Step 1: Precondition Checks ────────────────────────────────────────────
echo ""
echo "[1/8] Running precondition checks..."
bash "$SCRIPT_DIR/../precondition-check/check.sh" || {
  echo "FAILED: Precondition checks failed. Aborting deployment."
  exit 1
}
echo "      Precondition checks passed."

# ─── Step 2: Validate GraphQL Schema ────────────────────────────────────────
echo ""
echo "[2/8] Validating GraphQL schema..."
node "$ROOT_DIR/scripts/validateSchema.js" || {
  echo "FAILED: GraphQL schema validation failed."
  exit 1
}
echo "      Schema validation passed."

# ─── Step 3: Run Tests ───────────────────────────────────────────────────────
echo ""
echo "[3/8] Running test suite..."
cd "$ROOT_DIR"
npm test -- --passWithNoTests 2>&1 | tee -a "$DEPLOY_LOG" || {
  echo "FAILED: Tests failed. Aborting deployment."
  exit 1
}
echo "      Tests passed."

# ─── Step 4: Build Lambda Package ───────────────────────────────────────────
echo ""
echo "[4/8] Building Lambda deployment package..."
cd "$ROOT_DIR"
mkdir -p dist

# Install production dependencies only
npm ci --omit=dev 2>&1 | tee -a "$DEPLOY_LOG"

# Create ZIP excluding dev files
zip -r dist/smartbankai-backend.zip \
  core/ functions/ graphql/ models/ services/ utils/ config/ \
  node_modules/ \
  -x "**/.git*" \
  -x "**/test*" \
  -x "**/*.test.js" \
  -x "**/node_modules/.bin/*" \
  2>&1 | tee -a "$DEPLOY_LOG"

echo "      Lambda package created: dist/smartbankai-backend.zip"

# ─── Step 5: Upload to S3 ────────────────────────────────────────────────────
echo ""
echo "[5/8] Uploading artifacts to S3..."
LAMBDA_KEY="lambda/smartbankai-backend-${TIMESTAMP}.zip"
aws s3 cp dist/smartbankai-backend.zip \
  "s3://$S3_DEPLOYMENT_BUCKET/$LAMBDA_KEY" \
  --region "$AWS_REGION" \
  --metadata "environment=$ENVIRONMENT,timestamp=$TIMESTAMP"

# Upload CloudFormation templates
aws s3 sync \
  "$ROOT_DIR/infrastructure/cloudformation/" \
  "s3://$S3_DEPLOYMENT_BUCKET/cloudformation/" \
  --region "$AWS_REGION"

echo "      Artifacts uploaded."

# ─── Step 6: Save Previous Version to SSM (for rollback) ────────────────────
echo ""
echo "[6/8] Saving deployment version to SSM..."
PREV_VERSION=$(aws ssm get-parameter \
  --name "/smartbankai/$ENVIRONMENT/last-lambda-key" \
  --query "Parameter.Value" --output text 2>/dev/null || echo "")

if [ -n "$PREV_VERSION" ]; then
  aws ssm put-parameter \
    --name "/smartbankai/$ENVIRONMENT/prev-lambda-key" \
    --value "$PREV_VERSION" \
    --type String --overwrite \
    --region "$AWS_REGION"
fi

aws ssm put-parameter \
  --name "/smartbankai/$ENVIRONMENT/last-lambda-key" \
  --value "$LAMBDA_KEY" \
  --type String --overwrite \
  --region "$AWS_REGION"
echo "      Version saved: $LAMBDA_KEY"

# ─── Step 7: Deploy CloudFormation ──────────────────────────────────────────
echo ""
echo "[7/8] Deploying CloudFormation master stack..."
aws cloudformation deploy \
  --template-file "$ROOT_DIR/infrastructure/cloudformation/master.yaml" \
  --stack-name "$CF_STACK_NAME-$ENVIRONMENT" \
  --parameter-overrides \
      Environment="$ENVIRONMENT" \
      MongoDBUri="$MONGODB_URI" \
      DeploymentBucket="$S3_DEPLOYMENT_BUCKET" \
      LambdaS3Key="$LAMBDA_KEY" \
  --capabilities CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND \
  --region "$AWS_REGION" \
  --no-fail-on-empty-changeset \
  2>&1 | tee -a "$DEPLOY_LOG" || {
    echo "FAILED: CloudFormation deployment failed. Triggering rollback..."
    bash "$SCRIPT_DIR/rollback.sh" "$ENVIRONMENT"
    exit 1
  }

# ─── Step 8: Output Stack Results ────────────────────────────────────────────
echo ""
echo "[8/8] Fetching stack outputs..."
aws cloudformation describe-stacks \
  --stack-name "$CF_STACK_NAME-$ENVIRONMENT" \
  --region "$AWS_REGION" \
  --query "Stacks[0].Outputs[*].{Key:OutputKey,Value:OutputValue}" \
  --output table

echo ""
echo "================================================================"
echo "  DEPLOYMENT COMPLETE"
echo "  Environment : $ENVIRONMENT"
echo "  Stack       : $CF_STACK_NAME-$ENVIRONMENT"
echo "  Completed   : $(date)"
echo "  Log         : $DEPLOY_LOG"
echo "================================================================"
