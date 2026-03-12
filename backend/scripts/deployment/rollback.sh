#!/bin/bash
# ============================================================
# SmartBankAI — Deployment Rollback Script
# Usage: bash scripts/deployment/rollback.sh [dev|staging|prod]
# ============================================================
set -euo pipefail

ENVIRONMENT="${1:-dev}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

if [ -f "$ROOT_DIR/.env" ]; then
  export $(grep -v '^#' "$ROOT_DIR/.env" | xargs)
fi

: "${AWS_REGION:?AWS_REGION is required}"
: "${CF_STACK_NAME:?CF_STACK_NAME is required}"
: "${S3_DEPLOYMENT_BUCKET:?S3_DEPLOYMENT_BUCKET is required}"

STACK_NAME="$CF_STACK_NAME-$ENVIRONMENT"

echo "================================================================"
echo "  SmartBankAI ROLLBACK — Environment: $ENVIRONMENT"
echo "  Stack: $STACK_NAME"
echo "  Started: $(date)"
echo "================================================================"

# ─── Get Previous Lambda Key ─────────────────────────────────────────────────
echo "[1/4] Fetching previous deployment version from SSM..."
PREV_LAMBDA_KEY=$(aws ssm get-parameter \
  --name "/smartbankai/$ENVIRONMENT/prev-lambda-key" \
  --query "Parameter.Value" --output text \
  --region "$AWS_REGION" 2>/dev/null || echo "")

if [ -z "$PREV_LAMBDA_KEY" ]; then
  echo "WARNING: No previous version found in SSM. Cannot rollback."
  echo "Checking CloudFormation stack status..."
  aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$AWS_REGION" \
    --query "Stacks[0].StackStatus"

  # Try CloudFormation continue-update-rollback
  echo "Attempting CloudFormation rollback..."
  aws cloudformation continue-update-rollback \
    --stack-name "$STACK_NAME" \
    --region "$AWS_REGION" \
    --resources-to-skip [] 2>/dev/null || true
  exit 0
fi

echo "      Previous version: $PREV_LAMBDA_KEY"

# ─── Verify Previous Package Exists ─────────────────────────────────────────
echo "[2/4] Verifying previous package in S3..."
aws s3 ls "s3://$S3_DEPLOYMENT_BUCKET/$PREV_LAMBDA_KEY" --region "$AWS_REGION" || {
  echo "FAILED: Previous Lambda package not found in S3. Cannot rollback."
  exit 1
}

# ─── Re-deploy with Previous Lambda Key ─────────────────────────────────────
echo "[3/4] Redeploying previous version..."
aws cloudformation deploy \
  --template-file "$ROOT_DIR/infrastructure/cloudformation/master.yaml" \
  --stack-name "$STACK_NAME" \
  --parameter-overrides \
      Environment="$ENVIRONMENT" \
      MongoDBUri="${MONGODB_URI}" \
      SesFromEmail="${SES_FROM_EMAIL:-noreply@smartbankai.com}" \
      DeploymentBucket="$S3_DEPLOYMENT_BUCKET" \
      LambdaS3Key="$PREV_LAMBDA_KEY" \
  --capabilities CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND \
  --region "$AWS_REGION" \
  --no-fail-on-empty-changeset

# ─── Update SSM (swap current ← previous) ────────────────────────────────────
echo "[4/4] Updating SSM version pointers..."
CURRENT_KEY=$(aws ssm get-parameter \
  --name "/smartbankai/$ENVIRONMENT/last-lambda-key" \
  --query "Parameter.Value" --output text \
  --region "$AWS_REGION" 2>/dev/null || echo "")

if [ -n "$CURRENT_KEY" ]; then
  aws ssm put-parameter \
    --name "/smartbankai/$ENVIRONMENT/last-lambda-key" \
    --value "$PREV_LAMBDA_KEY" \
    --type String --overwrite \
    --region "$AWS_REGION"
fi

echo ""
echo "================================================================"
echo "  ROLLBACK COMPLETE"
echo "  Reverted to: $PREV_LAMBDA_KEY"
echo "  Completed  : $(date)"
echo "================================================================"
