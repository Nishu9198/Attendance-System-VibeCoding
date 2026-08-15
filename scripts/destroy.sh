#!/bin/bash
# ============================================================
# Destroy Script - Tear down all AWS resources
# ============================================================

set -e

echo "⚠️  WARNING: This will destroy ALL cloud resources!"
echo "Press Ctrl+C to cancel, or Enter to continue..."
read

cd "$(dirname "$0")/../terraform"

# Empty S3 buckets first (required before deletion)
FRONTEND_BUCKET=$(terraform output -raw frontend_bucket 2>/dev/null || echo "")
PHOTOS_BUCKET=$(terraform output -raw photos_bucket 2>/dev/null || echo "")

if [ -n "$FRONTEND_BUCKET" ]; then
  echo "🗑️  Emptying frontend bucket..."
  aws s3 rm "s3://$FRONTEND_BUCKET" --recursive 2>/dev/null || true
fi

if [ -n "$PHOTOS_BUCKET" ]; then
  echo "🗑️  Emptying photos bucket..."
  aws s3 rm "s3://$PHOTOS_BUCKET" --recursive 2>/dev/null || true
fi

echo "💥 Destroying infrastructure..."
terraform destroy -auto-approve

echo ""
echo "✅ All cloud resources destroyed!"
echo "💰 No more AWS charges will be incurred."
