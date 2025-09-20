import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CourseInvitationDocument = CourseInvitation & Document;

@Schema({ timestamps: true })
export class CourseInvitation {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Course' })
  courseId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  studentId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  teacherId: Types.ObjectId;

  @Prop({ required: true })
  studentEmail: string;

  @Prop({ required: true })
  courseTitle: string;

  @Prop({ required: true })
  teacherName: string;

  @Prop({ 
    type: String, 
    enum: ['pending', 'accepted', 'declined', 'expired'], 
    default: 'pending' 
  })
  status: 'pending' | 'accepted' | 'declined' | 'expired';

  @Prop({ default: Date.now })
  expiresAt: Date;

  @Prop()
  acceptedAt?: Date;

  @Prop()
  declinedAt?: Date;

  @Prop()
  message?: string; // Optional message from teacher
}

export const CourseInvitationSchema = SchemaFactory.createForClass(CourseInvitation);

// Index for efficient queries
CourseInvitationSchema.index({ studentId: 1, courseId: 1 });
CourseInvitationSchema.index({ studentEmail: 1, status: 1 });
CourseInvitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired invitations
