import { Controller, Post, UseInterceptors, UploadedFile, UseGuards, Delete, Param, BadRequestException, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { UploadsService } from './uploads.service';
import * as path from 'path';
import * as fs from 'fs';

@ApiTags('uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('file')
  @ApiOperation({ summary: 'Upload a single file (200MB limit)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', {
    // If USE_S3=true we use memory storage (set at module level). This ensures file.buffer is available.
  }))
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder?: string,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    // If S3 is enabled, prefer S3 URL; otherwise, use local static URL
    try {
      if (String(process.env.USE_S3 || '').toLowerCase() === 'true' && file.buffer) {
        const original = path.basename(file.originalname || 'file');
        const prefix = (folder && String(folder).trim()) || 'uploads';
        const key = `${prefix}/${Date.now()}-${original}`;
        const url = await this.uploadsService.uploadBufferToS3(key, file.buffer, file.mimetype);
        return {
          filename: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          url,
        };
      }
    } catch (e) {
      // If S3 mode is on, do not fallback silently; surface the error
      if (String(process.env.USE_S3 || '').toLowerCase() === 'true') {
        throw new BadRequestException((e as Error).message || 'Upload failed');
      }
    }
    const url = await this.uploadsService.getPublicUrl((file as any).filename);
    return {
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url,
    };
  }

  @Delete('file/:storedFilename')
  @ApiOperation({ summary: 'Delete a stored file by its saved filename' })
  async deleteFile(@Param('storedFilename') storedFilename: string) {
    // Prevent path traversal; only allow basename
    const safeName = path.basename(storedFilename);
    const filePath = path.join(process.cwd(), 'uploads', safeName);
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
      return { message: 'Deleted' };
    } catch (e) {
      // Still return success-like response to avoid leaking FS details
      return { message: 'Delete attempted' };
    }
  }
}
