import { Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class S3Service {
  private s3: AWS.S3;
  private bucketName: string;
  private region: string;

  constructor(private configService: ConfigService) {
    this.region = this.configService.get('AWS_REGION', 'us-east-1');
    AWS.config.update({
      accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
      region: this.region,
    });
    this.s3 = new AWS.S3();
    this.bucketName = this.configService.get('AWS_S3_BUCKET');
  }

  async uploadFile(file: Express.Multer.File, key: string): Promise<string> {
    const params = {
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    try {
      const result = await this.s3.upload(params).promise();
      return result.Location;
    } catch (error) {
      throw new Error(`Failed to upload file to S3: ${error.message}`);
    }
  }

  async deleteFile(key: string): Promise<void> {
    const params = {
      Bucket: this.bucketName,
      Key: key,
    };

    try {
      await this.s3.deleteObject(params).promise();
    } catch (error) {
      throw new Error(`Failed to delete file from S3: ${error.message}`);
    }
  }

  extractKeyFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      // Remove the bucket name from the path
      return pathname.substring(1);
    } catch {
      return url;
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
