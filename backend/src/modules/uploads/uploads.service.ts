import { Injectable } from '@nestjs/common';

@Injectable()
export class UploadsService {
  async getPublicUrl(storedFilename: string): Promise<string> {
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    return `${baseUrl}/uploads/${storedFilename}`;
  }
}
