import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

export type NotificationDocument = Notification & Document;

export interface INotification {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  body: string;
  read: boolean;
  meta?: any;
  createdAt: Date;
}

@Schema({ timestamps: true })
export class Notification {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  body: string;

  @Prop({ default: false })
  read: boolean;

  @Prop({ type: MongooseSchema.Types.Mixed })
  meta?: any;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Indexes
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
