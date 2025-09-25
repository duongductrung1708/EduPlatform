import 'dotenv/config';
import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage, memoryStorage } from 'multer';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import * as path from 'path';
import * as fs from 'fs';

@Module({
  imports: [
    MulterModule.register({
      storage: (String(process.env.USE_S3 || '').toLowerCase() === 'true') ? memoryStorage() : diskStorage({
        destination: (_req: any, _file: any, cb: (error: any, destination: string) => void) => {
          const uploadDir = path.join(process.cwd(), 'uploads');
          try {
            if (!fs.existsSync(uploadDir)) {
              fs.mkdirSync(uploadDir, { recursive: true });
            }
          } catch (err) {
            return cb(err, uploadDir);
          }
          cb(null, uploadDir);
        },
        filename: (_req: any, file: any, cb: (error: any, filename: string) => void) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = path.extname(file.originalname);
          cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
      limits: { fileSize: 200 * 1024 * 1024 },
    }),
  ],
  controllers: [UploadsController],
  providers: [UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {}
