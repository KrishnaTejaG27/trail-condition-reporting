import { S3Client } from '@aws-sdk/client-s3';

// AWS S3 Configuration
export const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'trailwatch-photos-group8';
export const S3_BASE_URL = `https://${S3_BUCKET_NAME}.s3.amazonaws.com`;

// Generate unique filename
export const generateS3Key = (userId: string, filename: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const extension = filename.split('.').pop()?.toLowerCase() || 'jpg';
  return `uploads/${userId}/${timestamp}-${random}.${extension}`;
};

// Get public URL for S3 object
export const getS3PublicUrl = (key: string): string => {
  return `${S3_BASE_URL}/${key}`;
};
