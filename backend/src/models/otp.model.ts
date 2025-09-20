import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OtpDocument = Otp & Document;

@Schema({ timestamps: true })
export class Otp {
  @Prop({ required: true })
  email!: string;

  @Prop({ required: true })
  otp!: string;

  @Prop({ required: true })
  type!: 'registration' | 'password_reset';

  @Prop({ default: false })
  isUsed!: boolean;

  @Prop({ required: true })
  expiresAt!: Date;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const OtpSchema = SchemaFactory.createForClass(Otp);

// Index for faster queries
OtpSchema.index({ email: 1, type: 1 });
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired OTPs
