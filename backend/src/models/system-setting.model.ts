import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SystemSettingDocument = SystemSetting & Document;

@Schema({ timestamps: true })
export class SystemSetting {
  @Prop({ required: true, unique: true, default: 'main' })
  key!: string;

  @Prop({ type: Object, required: true })
  value!: {
    organizationName?: string;
    contactEmail?: string;
    language?: string;
    timezone?: string;
    weeklyReport?: boolean;
    notifyTeacher?: boolean;
    notifyStudent?: boolean;
    themeColor?: string;
  };
}

export const SystemSettingSchema = SchemaFactory.createForClass(SystemSetting);

