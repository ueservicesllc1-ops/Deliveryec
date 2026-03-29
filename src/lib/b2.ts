import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.B2_REGION || 'us-east-005',
  endpoint: process.env.B2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.B2_KEY_ID || '',
    secretAccessKey: process.env.B2_APPLICATION_KEY || '',
  },
});

export const b2BucketName = process.env.B2_BUCKET_NAME || 'deliveryapp';

// Generate a signed URL for uploading to B2 (direct from browser to B2 avoiding server bottlenecks)
export async function getUploadPresignedUrl(fileName: string, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: b2BucketName,
    Key: fileName,
    ContentType: contentType,
  });

  return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

// Generate a signed URL for reading private files from B2
export async function getDownloadPresignedUrl(fileName: string) {
  const command = new GetObjectCommand({
    Bucket: b2BucketName,
    Key: fileName,
  });

  return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

export { s3Client };
