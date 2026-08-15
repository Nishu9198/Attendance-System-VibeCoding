#!/bin/bash
# ============================================================
# Deploy Script - Cloud-Based Student Attendance System
# ============================================================

set -e

echo "🚀 Deploying AttendCloud..."
echo "================================"

# Check prerequisites
command -v terraform >/dev/null 2>&1 || { echo "❌ Terraform is required. Install with: brew install hashicorp/tap/terraform"; exit 1; }
command -v aws >/dev/null 2>&1 || { echo "❌ AWS CLI is required. Install with: brew install awscli"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required."; exit 1; }

# Step 1: Deploy Infrastructure
echo ""
echo "📦 Step 1: Deploying AWS Infrastructure..."
cd "$(dirname "$0")/../terraform"

terraform init
terraform plan -out=tfplan
terraform apply tfplan

# Get outputs
API_URL=$(terraform output -raw api_url)
COGNITO_POOL_ID=$(terraform output -raw cognito_user_pool_id)
COGNITO_CLIENT_ID=$(terraform output -raw cognito_client_id)
AWS_REGION=$(terraform output -raw aws_region)
FRONTEND_BUCKET=$(terraform output -raw frontend_bucket)
FRONTEND_URL=$(terraform output -raw frontend_url)

echo ""
echo "✅ Infrastructure deployed!"
echo "   API URL: $API_URL"
echo "   Cognito Pool: $COGNITO_POOL_ID"
echo "   Frontend Bucket: $FRONTEND_BUCKET"

# Step 2: Update Terraform with frontend URL for CORS
cd "$(dirname "$0")/../terraform"
terraform apply -var="frontend_domain=http://$FRONTEND_URL" -auto-approve

# Step 3: Build Frontend
echo ""
echo "🔨 Step 2: Building Frontend..."
cd "$(dirname "$0")/../frontend"

# Create .env with Terraform outputs
cat > .env.production << EOF
VITE_API_URL=$API_URL
VITE_COGNITO_USER_POOL_ID=$COGNITO_POOL_ID
VITE_COGNITO_CLIENT_ID=$COGNITO_CLIENT_ID
VITE_AWS_REGION=$AWS_REGION
EOF

npm install
npm run build

echo "✅ Frontend built!"

# Step 4: Upload to S3
echo ""
echo "☁️  Step 3: Uploading to S3..."
aws s3 sync dist/ "s3://$FRONTEND_BUCKET/" --delete \
  --cache-control "public, max-age=31536000" \
  --exclude "index.html" \
  --exclude "*.json"

# Upload index.html with no-cache
aws s3 cp dist/index.html "s3://$FRONTEND_BUCKET/index.html" \
  --cache-control "no-cache, no-store, must-revalidate"

echo "✅ Frontend deployed!"

# Done
echo ""
echo "================================"
echo "🎉 Deployment Complete!"
echo ""
echo "🌐 Frontend URL: http://$FRONTEND_URL"
echo "🔗 API URL: $API_URL"
echo "🔐 Cognito Pool ID: $COGNITO_POOL_ID"
echo "================================"
