import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Otp, OtpDocument } from '../../models/otp.model';
import { EmailService } from '../email/email.service';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    @InjectModel(Otp.name) private otpModel: Model<OtpDocument>,
    private emailService: EmailService,
  ) {}

  async generateOtp(email: string, type: 'registration' | 'password_reset'): Promise<string> {
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiration time (10 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Delete any existing OTPs for this email and type
    await this.otpModel.deleteMany({ email, type });

    // Create new OTP record
    const otpRecord = new this.otpModel({
      email,
      otp,
      type,
      expiresAt,
    });

    await otpRecord.save();
    this.logger.log(`OTP generated for ${email} (${type}): ${otp}`);

    return otp;
  }

  async sendOtpEmail(email: string, type: 'registration' | 'password_reset'): Promise<boolean> {
    try {
      const otp = await this.generateOtp(email, type);
      const success = await this.emailService.sendOtpEmail(email, otp, type);
      
      if (success) {
        this.logger.log(`OTP email sent successfully to ${email}`);
        return true;
      } else {
        this.logger.error(`Failed to send OTP email to ${email}`);
        return false;
      }
    } catch (error) {
      this.logger.error(`Error sending OTP email to ${email}:`, error);
      return false;
    }
  }

  async verifyOtp(email: string, otp: string, type: 'registration' | 'password_reset'): Promise<boolean> {
    try {
      const otpRecord = await this.otpModel.findOne({
        email,
        otp,
        type,
        isUsed: false,
        expiresAt: { $gt: new Date() }, // Not expired
      });

      if (!otpRecord) {
        this.logger.warn(`Invalid or expired OTP for ${email}`);
        return false;
      }

      // Mark OTP as used
      otpRecord.isUsed = true;
      await otpRecord.save();

      this.logger.log(`OTP verified successfully for ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Error verifying OTP for ${email}:`, error);
      return false;
    }
  }

  async resendOtp(email: string, type: 'registration' | 'password_reset'): Promise<boolean> {
    try {
      // Check if there's a recent OTP (within 1 minute)
      const recentOtp = await this.otpModel.findOne({
        email,
        type,
        createdAt: { $gt: new Date(Date.now() - 60000) }, // 1 minute ago
      });

      if (recentOtp) {
        throw new BadRequestException('Vui lòng đợi 1 phút trước khi yêu cầu mã OTP mới');
      }

      return await this.sendOtpEmail(email, type);
    } catch (error) {
      this.logger.error(`Error resending OTP to ${email}:`, error);
      throw error;
    }
  }

  async cleanupExpiredOtps(): Promise<number> {
    try {
      const result = await this.otpModel.deleteMany({
        expiresAt: { $lt: new Date() },
      });
      
      this.logger.log(`Cleaned up ${result.deletedCount} expired OTPs`);
      return result.deletedCount;
    } catch (error) {
      this.logger.error('Error cleaning up expired OTPs:', error);
      return 0;
    }
  }
}
