import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OtpService } from './otp.service';
import { Otp, OtpSchema } from '../../models/otp.model';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Otp.name, schema: OtpSchema }]),
    EmailModule,
  ],
  providers: [OtpService],
  exports: [OtpService],
})
export class OtpModule {}
