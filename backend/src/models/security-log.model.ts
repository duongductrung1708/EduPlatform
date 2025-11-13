import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SecurityLogDocument = SecurityLog & Document;

@Schema({ timestamps: true })
export class SecurityLog {
  @Prop({ required: true })
  action!: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId?: Types.ObjectId;

  @Prop()
  userEmail?: string;

  @Prop()
  ipAddress?: string;

  @Prop()
  userAgent?: string;

  @Prop({ required: true, enum: ['success', 'warning', 'danger', 'info'] })
  status!: 'success' | 'warning' | 'danger' | 'info';

  @Prop()
  details?: string;

  @Prop({ type: Object })
  metadata?: any;
}

export const SecurityLogSchema = SchemaFactory.createForClass(SecurityLog);

