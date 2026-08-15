import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const terraformDir = path.join(rootDir, 'terraform');
const frontendDir = path.join(rootDir, 'frontend');

const env = {
  ...process.env,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_REGION: process.env.AWS_REGION || 'ap-south-1',
};

console.log('🚀 Deploying AttendCloud to AWS...');
console.log('=================================');

// Step 1: Terraform Init & Apply
console.log('\n📦 Step 1: Provisioning AWS Infrastructure via Terraform...');
execSync('terraform init', { cwd: terraformDir, stdio: 'inherit', env });
execSync('terraform apply -auto-approve', { cwd: terraformDir, stdio: 'inherit', env });

// Step 2: Extract Terraform Outputs
console.log('\n📊 Extracting Terraform Outputs...');
const apiUrl = execSync('terraform output -raw api_url', { cwd: terraformDir, env }).toString().trim();
const cognitoPoolId = execSync('terraform output -raw cognito_user_pool_id', { cwd: terraformDir, env }).toString().trim();
const cognitoClientId = execSync('terraform output -raw cognito_client_id', { cwd: terraformDir, env }).toString().trim();
const awsRegion = execSync('terraform output -raw aws_region', { cwd: terraformDir, env }).toString().trim();
const frontendBucket = execSync('terraform output -raw frontend_bucket', { cwd: terraformDir, env }).toString().trim();
const frontendUrl = execSync('terraform output -raw frontend_url', { cwd: terraformDir, env }).toString().trim();
const cloudfrontUrl = execSync('terraform output -raw cloudfront_url', { cwd: terraformDir, env }).toString().trim();

console.log(`✅ Infrastructure Deployed!`);
console.log(`   API Endpoint:   ${apiUrl}`);
console.log(`   Cognito Pool:   ${cognitoPoolId}`);
console.log(`   S3 Bucket:      ${frontendBucket}`);
console.log(`   CloudFront HTTPS: ${cloudfrontUrl}`);

// Step 3: Update Terraform CORS & Redirect URL with CloudFront HTTPS Domain
console.log('\n🔄 Updating Terraform CORS for CloudFront HTTPS Domain...');
execSync(`terraform apply -var="frontend_domain=${cloudfrontUrl}" -auto-approve`, { cwd: terraformDir, stdio: 'inherit', env });

// Step 4: Build Frontend
console.log('\n🔨 Step 2: Building Production Frontend Bundle...');
const envContent = `VITE_API_URL=${apiUrl}
VITE_COGNITO_USER_POOL_ID=${cognitoPoolId}
VITE_COGNITO_CLIENT_ID=${cognitoClientId}
VITE_AWS_REGION=${awsRegion}
VITE_USE_MOCK_DATA=false
`;
fs.writeFileSync(path.join(frontendDir, '.env.production'), envContent);
execSync('npm run build', { cwd: frontendDir, stdio: 'inherit', env });

// Step 5: Upload Dist to S3
console.log('\n☁️ Step 3: Uploading Frontend Assets to S3...');
const s3 = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

function getMimeType(filePath) {
  if (filePath.endsWith('.html')) return 'text/html';
  if (filePath.endsWith('.css')) return 'text/css';
  if (filePath.endsWith('.js')) return 'application/javascript';
  if (filePath.endsWith('.json')) return 'application/json';
  if (filePath.endsWith('.png')) return 'image/png';
  if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) return 'image/jpeg';
  if (filePath.endsWith('.svg')) return 'image/svg+xml';
  return 'application/octet-stream';
}

async function uploadDir(dir, baseDir = '') {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const relPath = path.join(baseDir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      await uploadDir(fullPath, relPath);
    } else {
      const content = fs.readFileSync(fullPath);
      const mimeType = getMimeType(fullPath);
      const isIndexHtml = file === 'index.html';
      const key = relPath.replace(/\\/g, '/');
      await s3.send(new PutObjectCommand({
        Bucket: frontendBucket,
        Key: key,
        Body: content,
        ContentType: mimeType,
        CacheControl: isIndexHtml ? 'no-cache, no-store, must-revalidate' : 'public, max-age=31536000',
      }));
      console.log(`   Uploaded: ${key}`);
    }
  }
}

const distDir = path.join(frontendDir, 'dist');
await uploadDir(distDir);

console.log('\n=================================');
console.log('🎉 DEPLOYMENT TO AWS COMPLETE!');
console.log(`🌐 Secure HTTPS Web App URL: ${cloudfrontUrl}`);
console.log(`🔗 API Gateway Endpoint:     ${apiUrl}`);
console.log(`🔐 Cognito Pool ID:          ${cognitoPoolId}`);
console.log('=================================\n');
