/**
 * Storage Service
 * Handles audio file uploads to S3/LocalStack
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { InternalError } from '../utils/errors.js';
import { Readable } from 'stream';

export class StorageService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    this.bucketName = env.S3_BUCKET_NAME;

    // Configure S3 client (works with both AWS S3 and LocalStack)
    this.s3Client = new S3Client({
      region: env.AWS_REGION,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      },
      ...(env.AWS_ENDPOINT && {
        endpoint: env.AWS_ENDPOINT,
        forcePathStyle: true, // Required for LocalStack
      }),
    });
  }

  /**
   * Upload audio file to S3
   */
  async uploadAudio(
    buffer: Buffer,
    memoId: string,
    contentType: string = 'audio/mpeg'
  ): Promise<{ url: string; key: string }> {
    const key = `memos/${memoId}/audio-${Date.now()}.mp3`;

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: buffer,
          ContentType: contentType,
        })
      );

      const url = env.AWS_ENDPOINT
        ? `${env.AWS_ENDPOINT}/${this.bucketName}/${key}` // LocalStack
        : `https://${this.bucketName}.s3.${env.AWS_REGION}.amazonaws.com/${key}`; // AWS

      logger.info({ memoId, key }, 'Audio file uploaded successfully');

      return { url, key };
    } catch (error) {
      logger.error({ error, memoId }, 'Failed to upload audio file');
      throw new InternalError('Failed to upload audio file');
    }
  }

  /**
   * Generate presigned URL for direct upload from client
   */
  async getPresignedUploadUrl(
    memoId: string,
    contentType: string = 'audio/mpeg',
    expiresIn: number = 3600 // 1 hour
  ): Promise<{ uploadUrl: string; key: string }> {
    const key = `memos/${memoId}/audio-${Date.now()}.mp3`;

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: contentType,
      });

      const uploadUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn,
      });

      return { uploadUrl, key };
    } catch (error) {
      logger.error({ error, memoId }, 'Failed to generate presigned URL');
      throw new InternalError('Failed to generate upload URL');
    }
  }

  /**
   * Get audio file URL
   */
  async getAudioUrl(key: string): Promise<string> {
    if (env.AWS_ENDPOINT) {
      // LocalStack - return direct URL
      return `${env.AWS_ENDPOINT}/${this.bucketName}/${key}`;
    }

    // AWS - return S3 URL
    return `https://${this.bucketName}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
  }

  /**
   * Generate presigned URL for downloading audio
   */
  async getPresignedDownloadUrl(
    key: string,
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn });
      return url;
    } catch (error) {
      logger.error({ error, key }, 'Failed to generate download URL');
      throw new InternalError('Failed to generate download URL');
    }
  }

  /**
   * Download audio file from S3
   */
  async downloadAudio(key: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(command);

      if (!response.Body) {
        throw new InternalError('Empty response body');
      }

      // Convert stream to buffer
      const stream = response.Body as Readable;
      const chunks: Buffer[] = [];

      return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks)));
      });
    } catch (error) {
      logger.error({ error, key }, 'Failed to download audio file');
      throw new InternalError('Failed to download audio file');
    }
  }

  /**
   * Delete audio file from S3
   */
  async deleteAudio(key: string): Promise<void> {
    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        })
      );

      logger.info({ key }, 'Audio file deleted successfully');
    } catch (error) {
      logger.error({ error, key }, 'Failed to delete audio file');
      throw new InternalError('Failed to delete audio file');
    }
  }

  /**
   * Check if bucket exists and create if needed (for LocalStack)
   */
  async ensureBucketExists(): Promise<void> {
    if (env.NODE_ENV !== 'development') {
      return; // Only auto-create in development
    }

    try {
      const { CreateBucketCommand, HeadBucketCommand } = await import('@aws-sdk/client-s3');

      // Check if bucket exists
      try {
        await this.s3Client.send(new HeadBucketCommand({ Bucket: this.bucketName }));
        logger.info({ bucket: this.bucketName }, 'S3 bucket exists');
      } catch {
        // Bucket doesn't exist, create it
        await this.s3Client.send(
          new CreateBucketCommand({ Bucket: this.bucketName })
        );
        logger.info({ bucket: this.bucketName }, 'S3 bucket created');
      }
    } catch (error) {
      logger.error({ error }, 'Failed to ensure bucket exists');
    }
  }
}
