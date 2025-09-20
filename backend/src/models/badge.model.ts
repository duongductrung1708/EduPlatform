import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BadgeDocument = Badge & Document;

export interface IBadge {
  _id: Types.ObjectId;
  name: string;
  description: string;
  icon: string;
  color: string;
  criteria: {
    kind: 'course_completion' | 'quiz_perfect' | 'streak' | 'custom';
    courseId?: Types.ObjectId;
    requiredScore?: number;
    requiredStreak?: number;
    customCondition?: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Schema({ timestamps: true })
export class Badge {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  description!: string;

  @Prop({ required: true })
  icon!: string;

  @Prop({ required: true })
  color!: string;

  @Prop({
    type: {
      kind: { 
        type: String, 
        enum: ['course_completion', 'quiz_perfect', 'streak', 'custom'],
        required: true 
      },
      courseId: { type: Types.ObjectId, ref: 'Course' },
      requiredScore: { type: Number },
      requiredStreak: { type: Number },
      customCondition: { type: String }
    },
    required: true
  })
  criteria!: {
    kind: string;
    courseId?: Types.ObjectId;
    requiredScore?: number;
    requiredStreak?: number;
    customCondition?: string;
  };

  @Prop({ default: true })
  isActive!: boolean;
}

export const BadgeSchema = SchemaFactory.createForClass(Badge);

// Indexes
BadgeSchema.index({ 'criteria.kind': 1 });
BadgeSchema.index({ 'criteria.courseId': 1 });
