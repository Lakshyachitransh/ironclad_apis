import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand } from '@aws-sdk/client-s3';

// AWS SigV4 enforces a 7-day maximum expiration for presigned URLs
const MAX_PRESIGNED_URL_EXPIRY = 604800; // 7 days in seconds

@Injectable()
export class S3Service {
  private s3: S3Client;
  private bucketName: string;
  private region: string;

  constructor(private configService: ConfigService) {
    this.region = this.configService.get('AWS_REGION', 'us-east-1');
    this.bucketName = this.configService.get('AWS_S3_BUCKET');

    // Initialize S3Client with credentials from environment
    this.s3 = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
      },
    });
  }

  async uploadFile(file: Express.Multer.File, key: string): Promise<string> {
    // Ensure proper content type for videos
    let contentType = file.mimetype;
    if (key.includes('videos/') && !contentType.startsWith('video/')) {
      // Default to mp4 if mimetype is not properly detected
      contentType = 'video/mp4';
      console.warn(`[S3Service] Warning: Detected non-video mimetype "${file.mimetype}" for video file. Defaulting to video/mp4`);
    }

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: contentType,
      CacheControl: 'max-age=31536000', // Cache for 1 year (correct parameter)
      Metadata: {
        'original-filename': file.originalname,
        'upload-timestamp': new Date().toISOString(),
      },
    });

    try {
      await this.s3.send(command);
      console.log(`[S3Service] File uploaded successfully: ${key} with Content-Type: ${contentType}`);
      
      // Return the base S3 URL (not presigned) to store in database
      // This URL can be used to generate fresh presigned URLs anytime
      const s3Url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
      console.log(`[S3Service] Returning S3 URL for storage: ${s3Url.split('?')[0]}`);
      return s3Url;
    } catch (error) {
      throw new Error(`Failed to upload file to S3: ${error.message}`);
    }
  }

  /**
   * Generate a pre-signed URL for accessing S3 objects
   * Pre-signed URLs are temporary and more secure than public URLs
   * Note: AWS SigV4 requires max expiration of 1 week (604800 seconds)
   * @param key - S3 object key
   * @param expiresIn - Expiration time in seconds (default: 7 days, max: 604800 seconds)
   * @returns Pre-signed URL
   */
  async generatePresignedUrl(key: string, expiresIn: number = 604800): Promise<string> {
    try {
      // AWS SigV4 requires presigned URLs to expire within 1 week (604800 seconds)
      const maxExpiration = MAX_PRESIGNED_URL_EXPIRY;
      const actualExpiration = Math.min(expiresIn, maxExpiration);

      console.log('[S3Service] Generating presigned URL with params:', {
        bucket: this.bucketName,
        key: key,
        expiresIn: actualExpiration,
        region: this.region
      });

      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const url = await getSignedUrl(this.s3, command, { expiresIn: actualExpiration });
      console.log('[S3Service] Generated presigned URL successfully');
      return url;
    } catch (error) {
      console.error('[S3Service] Error generating presigned URL:', {
        error: error?.message,
        bucket: this.bucketName,
        key: key
      });
      throw new Error(`Failed to generate pre-signed URL: ${error?.message}`);
    }
  }

  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    try {
      await this.s3.send(command);
    } catch (error) {
      throw new Error(`Failed to delete file from S3: ${error.message}`);
    }
  }

  extractKeyFromUrl(url: string): string {
    if (!url) {
      throw new Error('URL is empty');
    }

    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      
      // Extract just the key/path part after the bucket name
      // URL format: https://bucket.s3.region.amazonaws.com/key/path
      // pathname will be: /key/path
      const key = pathname.substring(1); // Remove leading slash
      
      if (!key) {
        throw new Error(`Could not extract key from URL: ${url}`);
      }
      
      console.log(`[S3Service] Extracted S3 key from URL: ${key}`);
      return key;
    } catch (error) {
      console.error(`[S3Service] Error extracting key from URL: ${url}`, error);
      throw error;
    }
  }

  /**
   * Normalize S3 URL to use the current configured region
   * Fixes URLs that may have been generated with a different region
   */
  normalizeS3Url(url: string): string {
    if (!url) return url;
    
    try {
      // Extract the key from any S3 URL format
      let key: string;
      
      if (url.startsWith('s3://')) {
        // s3://bucket/key format
        key = url.replace(`s3://${this.bucketName}/`, '');
      } else if (url.includes('.amazonaws.com')) {
        // https://bucket.s3.region.amazonaws.com/key or https://bucket.s3.amazonaws.com/key format
        const urlObj = new URL(url);
        key = urlObj.pathname.substring(1); // Remove leading slash
      } else {
        return url; // Return as-is if format is unclear
      }
      
      // Generate URL with current region
      return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
    } catch (error) {
      console.error('Error normalizing S3 URL:', error);
      return url;
    }
  }
}
