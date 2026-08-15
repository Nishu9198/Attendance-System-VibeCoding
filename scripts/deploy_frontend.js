import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { CloudFrontClient, CreateInvalidationCommand } from '@aws-sdk/client-cloudfront';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const csvPath = path.resolve(__dirname, '../Sahil_accessKeys.csv');
let credentials = undefined;
if (fs.existsSync(csvPath)) {
  const content = fs.readFileSync(csvPath, 'utf8');
  const lines = content.trim().split('\n');
  if (lines.length >= 2) {
    const parts = lines[1].split(',');
    if (parts.length >= 2) {
      credentials = {
        accessKeyId: parts[0].trim(),
        secretAccessKey: parts[1].trim(),
      };
      console.log(`🔑 Loaded AWS credentials for Access Key ID: ${credentials.accessKeyId}`);
    }
  }
}

const s3 = new S3Client({ region: 'ap-south-1', credentials });
const cloudfront = new CloudFrontClient({ region: 'ap-south-1', credentials });
const BUCKET = 'attendance-system-frontend-5c2c7946';
const DISTRIBUTION_ID = 'E33Z5TXIXB7GTR';
const DIST_DIR = path.resolve(__dirname, '../frontend/dist');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

async function uploadDirectory(dir, baseDir = dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      await uploadDirectory(fullPath, baseDir);
    } else {
      const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
      const ext = path.extname(fullPath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      const fileBuffer = fs.readFileSync(fullPath);

      console.log(`Uploading ${relPath} (${contentType})...`);
      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: relPath,
          Body: fileBuffer,
          ContentType: contentType,
        })
      );
    }
  }
}

async function main() {
  console.log(`🚀 Deploying frontend to S3 (s3://${BUCKET})...`);
  await uploadDirectory(DIST_DIR);
  console.log('✅ Upload to S3 complete!');

  try {
    console.log(`🔄 Creating CloudFront cache invalidation for ${DISTRIBUTION_ID}...`);
    const inv = await cloudfront.send(
      new CreateInvalidationCommand({
        DistributionId: DISTRIBUTION_ID,
        InvalidationBatch: {
          CallerReference: `deploy-${Date.now()}`,
          Paths: {
            Quantity: 1,
            Items: ['/*'],
          },
        },
      })
    );
    console.log(`✅ CloudFront invalidation created: ${inv.Invalidation?.Id}`);
  } catch (cfErr) {
    console.warn('⚠️ CloudFront invalidation note:', cfErr.message);
  }
  console.log('🎉 Production Deployment Live!');
}

main().catch(err => {
  console.error('Deployment failed:', err);
  process.exit(1);
});
