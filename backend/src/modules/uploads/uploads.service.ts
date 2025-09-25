import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class UploadsService {
  async getPublicUrl(storedFilename: string): Promise<string> {
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    return `${baseUrl}/uploads/${storedFilename}`;
  }

  private get useS3(): boolean {
    return String(process.env.USE_S3 || '').toLowerCase() === 'true';
  }

  private get s3(): S3Client | null {
    if (!this.useS3) return null;
    return new S3Client({
      region: process.env.AWS_REGION,
      credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      } as any : undefined,
    });
  }

  async uploadBufferToS3(key: string, buffer: Buffer, contentType?: string): Promise<string> {
    const bucket = process.env.AWS_S3_BUCKET_NAME as string;
    if (!this.useS3 || !this.s3 || !bucket) {
      throw new Error('S3 not configured');
    }
    const maybeAcl = (process.env.AWS_S3_OBJECT_ACL || '').trim();
    const putParams: any = { Bucket: bucket, Key: key, Body: buffer, ContentType: contentType, IfNoneMatch: '*' };
    // Only set ACL if explicitly configured. Many buckets have ACLs disabled (Bucket owner enforced).
    if (maybeAcl) {
      putParams.ACL = maybeAcl as any; // e.g. 'public-read'
    }
    await this.s3.send(new PutObjectCommand(putParams));
    const base = process.env.S3_PUBLIC_BASE || `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com`;
    return `${base}/${encodeURIComponent(key)}`;
  }

  async deleteFromS3(key: string): Promise<void> {
    const bucket = process.env.AWS_S3_BUCKET_NAME as string;
    if (!this.useS3 || !this.s3 || !bucket) return;
    await this.s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  }
}
