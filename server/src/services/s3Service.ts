import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, S3_BUCKET_NAME, generateS3Key, getS3PublicUrl } from '@/config/s3';
import sharp from 'sharp';

export interface UploadResult {
  key: string;
  url: string;
  thumbnailUrl?: string | undefined;
  width: number;
  height: number;
  fileSizeBytes: number;
  contentType: string;
}

// Upload image to S3 with optional resizing
export const uploadToS3 = async (
  fileBuffer: Buffer,
  originalFilename: string,
  userId: string,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    generateThumbnail?: boolean;
  } = {}
): Promise<UploadResult> => {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 80,
    generateThumbnail = true,
  } = options;

  // Process image with Sharp
  let processedImage = sharp(fileBuffer);
  
  // Get metadata
  const metadata = await processedImage.metadata();
  let width = metadata.width || 0;
  let height = metadata.height || 0;
  
  // Resize if needed
  if (width > maxWidth || height > maxHeight) {
    processedImage = processedImage.resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    });
    const resized = await processedImage.clone().metadata();
    width = resized.width || width;
    height = resized.height || height;
  }
  
  // Convert to JPEG for consistency
  const optimizedBuffer = await processedImage
    .jpeg({ quality, progressive: true })
    .toBuffer();
  
  // Generate unique key
  const key = generateS3Key(userId, originalFilename);
  
  // Upload to S3
  const uploadCommand = new PutObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: key,
    Body: optimizedBuffer,
    ContentType: 'image/jpeg',
    Metadata: {
      'user-id': userId,
      'original-name': originalFilename,
    },
  });
  
  await s3Client.send(uploadCommand);
  
  // Generate thumbnail if requested
  let thumbnailUrl: string | undefined;
  let thumbnailKey: string | undefined;
  
  if (generateThumbnail) {
    const thumbnailBuffer = await sharp(fileBuffer)
      .resize(300, 300, { fit: 'cover' })
      .jpeg({ quality: 70, progressive: true })
      .toBuffer();
    
    thumbnailKey = key.replace('uploads/', 'thumbnails/');
    
    const thumbnailCommand = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: thumbnailKey,
      Body: thumbnailBuffer,
      ContentType: 'image/jpeg',
    });
    
    await s3Client.send(thumbnailCommand);
    thumbnailUrl = getS3PublicUrl(thumbnailKey);
  }
  
  return {
    key,
    url: getS3PublicUrl(key),
    thumbnailUrl,
    width,
    height,
    fileSizeBytes: optimizedBuffer.length,
    contentType: 'image/jpeg',
  };
};

// Delete image from S3
export const deleteFromS3 = async (key: string): Promise<boolean> => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
    });
    
    await s3Client.send(command);
    
    // Also delete thumbnail if exists
    if (key.startsWith('uploads/')) {
      const thumbnailKey = key.replace('uploads/', 'thumbnails/');
      const thumbnailCommand = new DeleteObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: thumbnailKey,
      });
      await s3Client.send(thumbnailCommand).catch(() => {}); // Ignore thumbnail errors
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting from S3:', error);
    return false;
  }
};

// Generate signed URL for temporary access
export const generateSignedUrl = async (key: string, expiresIn: number = 3600): Promise<string> => {
  const command = new GetObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: key,
  });
  
  return getSignedUrl(s3Client, command, { expiresIn });
};

// Check if object exists
export const checkObjectExists = async (key: string): Promise<boolean> => {
  try {
    const command = new HeadObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
    });
    
    await s3Client.send(command);
    return true;
  } catch {
    return false;
  }
};
