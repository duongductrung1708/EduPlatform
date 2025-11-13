import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SecuritySettingDocument = SecuritySetting & Document;

@Schema({ timestamps: true })
export class SecuritySetting {
  @Prop({ required: true, unique: true })
  settingId!: string;

  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  description!: string;

  @Prop({ default: true })
  enabled!: boolean;

  @Prop()
  category?: string; // 'authentication', 'api', 'password', etc.
}

export const SecuritySettingSchema = SchemaFactory.createForClass(SecuritySetting);

