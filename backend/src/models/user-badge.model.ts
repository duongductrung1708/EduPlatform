import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserBadgeDocument = UserBadge & Document;

export interface IUserBadge {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  badgeId: Types.ObjectId;
  earnedAt: Date;
  courseId?: Types.ObjectId; // For course-related badges
  metadata?: any; // Additional data about how the badge was earned
  createdAt: Date;
  updatedAt: Date;
}

@Schema({ timestamps: true })
export class UserBadge {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Badge' })
  badgeId!: Types.ObjectId;

  @Prop({ required: true, default: Date.now })
  earnedAt!: Date;

  @Prop({ type: Types.ObjectId, ref: 'Course' })
  courseId?: Types.ObjectId;

  @Prop({ type: Object })
  metadata?: any;
}

export const UserBadgeSchema = SchemaFactory.createForClass(UserBadge);

// Indexes
UserBadgeSchema.index({ userId: 1, badgeId: 1 }, { unique: true });
UserBadgeSchema.index({ userId: 1 });
UserBadgeSchema.index({ badgeId: 1 });
UserBadgeSchema.index({ courseId: 1 });
