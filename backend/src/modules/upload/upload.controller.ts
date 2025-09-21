import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Body,
  Get,
  Param,
  Delete,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { S3Service } from './s3.service';

@ApiTags('upload')
@Controller('api/upload')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UploadController {
  constructor(private readonly s3Service: S3Service) {}

  @Post('file')
  @UseInterceptors(FileInterceptor('file'))
  @UseGuards(RolesGuard)
  @Roles('teacher', 'admin')
  @ApiOperation({ summary: 'Upload file to S3 (teacher/admin only)' })
  @ApiConsumes('multipart/form-data')
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder: string = 'uploads',
    @Body('customFileName') customFileName?: string,
    @CurrentUser() user: any,
  ) {
    if (!file) {
      throw new Error('No file provided');
    }

    const result = await this.s3Service.uploadFile(file, folder, customFileName);
    
    return {
      message: 'File uploaded successfully',
      data: result,
    };
  }

  @Post('presigned-url')
  @UseGuards(RolesGuard)
  @Roles('teacher', 'admin')
  @ApiOperation({ summary: 'Generate presigned URL for direct upload (teacher/admin only)' })
  async generatePresignedUrl(
    @Body() body: {
      fileName: string;
      contentType: string;
      folder?: string;
    },
    @CurrentUser() user: any,
  ) {
    const { fileName, contentType, folder = 'uploads' } = body;
    
    const result = await this.s3Service.generatePresignedUploadUrl(
      fileName,
      contentType,
      folder,
    );

    return {
      message: 'Presigned URL generated successfully',
      data: result,
    };
  }

  @Delete('file/:key')
  @UseGuards(RolesGuard)
  @Roles('teacher', 'admin')
  @ApiOperation({ summary: 'Delete file from S3 (teacher/admin only)' })
  async deleteFile(
    @Param('key') key: string,
    @CurrentUser() user: any,
  ) {
    await this.s3Service.deleteFile(key);
    
    return {
      message: 'File deleted successfully',
    };
  }

  @Get('signed-url/:key')
  @UseGuards(RolesGuard)
  @Roles('teacher', 'admin', 'student')
  @ApiOperation({ summary: 'Get signed URL for file access' })
  async getSignedUrl(
    @Param('key') key: string,
    @CurrentUser() user: any,
  ) {
    const signedUrl = await this.s3Service.getSignedUrl(key);
    
    return {
      message: 'Signed URL generated successfully',
      data: { signedUrl },
    };
  }
}
