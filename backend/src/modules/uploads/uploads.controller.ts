import { Controller, Post, UseInterceptors, UploadedFile, UseGuards, Delete, Param } from '@nestjs/common';
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
  @UseInterceptors(FileInterceptor('file'))
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
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const url = await this.uploadsService.getPublicUrl(file.filename);
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
