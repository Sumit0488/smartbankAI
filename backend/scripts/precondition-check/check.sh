#!/bin/bash
# ============================================================
# SmartBankAI — Precondition Check Script
# Validates environment before deployment
# ============================================================
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

if [ -f "$ROOT_DIR/.env" ]; then
  export $(grep -v '^#' "$ROOT_DIR/.env" | xargs)
fi

PASS=0
FAIL=0

check() {
  local name="$1"
  local cmd="$2"
  if eval "$cmd" &>/dev/null; then
    echo "  [PASS] $name"
    ((PASS++)) || true
  else
    echo "  [FAIL] $name"
    ((FAIL++)) || true
  fi
}

echo ""
echo "=== SmartBankAI Precondition Checks ==="
echo ""

# ─── Tools ───────────────────────────────────────────────────────────────────
echo "--- CLI Tools ---"
check "AWS CLI installed"       "command -v aws"
check "Node.js >= 18"           "node -e 'if(parseInt(process.version.slice(1))<18) process.exit(1)'"
check "npm installed"           "command -v npm"
check "zip installed"           "command -v zip"

# ─── AWS Credentials ────────────────────────────────────────────────────────
echo ""
echo "--- AWS Credentials ---"
check "AWS credentials valid"   "aws sts get-caller-identity"
check "AWS_REGION set"          "[ -n '${AWS_REGION:-}' ]"
check "AWS_ACCOUNT_ID set"      "[ -n '${AWS_ACCOUNT_ID:-}' ]"

# ─── Required Env Vars ──────────────────────────────────────────────────────
echo ""
echo "--- Environment Variables ---"
check "MONGODB_URI set"             "[ -n '${MONGODB_URI:-}' ]"
check "CF_STACK_NAME set"           "[ -n '${CF_STACK_NAME:-}' ]"
check "S3_DEPLOYMENT_BUCKET set"    "[ -n '${S3_DEPLOYMENT_BUCKET:-}' ]"
check "COGNITO_USER_POOL_ID set"    "[ -n '${COGNITO_USER_POOL_ID:-}' ]"
check "SES_FROM_EMAIL set"          "[ -n '${SES_FROM_EMAIL:-}' ]"
check "EVENT_BUS_NAME set"          "[ -n '${EVENT_BUS_NAME:-}' ]"

# ─── AWS Resources ──────────────────────────────────────────────────────────
echo ""
echo "--- AWS Resources ---"
check "S3 deployment bucket exists" \
  "aws s3 ls 's3://${S3_DEPLOYMENT_BUCKET:-}' --region '${AWS_REGION:-ap-south-1}'"
check "Cognito User Pool exists" \
  "aws cognito-idp describe-user-pool --user-pool-id '${COGNITO_USER_POOL_ID:-NONE}' --region '${AWS_REGION:-ap-south-1}'"

# ─── MongoDB ────────────────────────────────────────────────────────────────
echo ""
echo "--- Database ---"
check "MongoDB connection" \
  "node '$ROOT_DIR/scripts/testDbConnection.js'"

# ─── Report ──────────────────────────────────────────────────────────────────
echo ""
echo "==============================="
echo "  Results: $PASS passed, $FAIL failed"
echo "==============================="

if [ "$FAIL" -gt 0 ]; then
  echo "PRECONDITION CHECKS FAILED. Fix the above issues before deploying."
  exit 1
fi

echo "All precondition checks passed."
exit 0
