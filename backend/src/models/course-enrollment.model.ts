import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CourseEnrollmentDocument = CourseEnrollment & Document;

export interface ICourseEnrollment {
  _id: Types.ObjectId;
  studentId: Types.ObjectId;
  courseId: Types.ObjectId;
  enrolledAt: Date;
  completedAt?: Date;
  progress: {
    completedLessons: Types.ObjectId[];
    completedModules: Types.ObjectId[];
    totalLessons: number;
    totalModules: number;
    percentage: number;
  };
  rating?: number;
  review?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Schema({ timestamps: true })
export class CourseEnrollment {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  studentId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Course' })
  courseId!: Types.ObjectId;

  @Prop({ required: true, default: Date.now })
  enrolledAt!: Date;

  @Prop()
  completedAt?: Date;

  @Prop({
    type: {
      completedLessons: [{ type: Types.ObjectId, ref: 'Lesson' }],
      completedModules: [{ type: Types.ObjectId, ref: 'Module' }],
      totalLessons: { type: Number, default: 0 },
      totalModules: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 }
    },
    default: {
      completedLessons: [],
      completedModules: [],
      totalLessons: 0,
      totalModules: 0,
      percentage: 0
    }
  })
  progress!: {
    completedLessons: Types.ObjectId[];
    completedModules: Types.ObjectId[];
    totalLessons: number;
    totalModules: number;
    percentage: number;
  };

  @Prop({ min: 1, max: 5 })
  rating?: number;

  @Prop()
  review?: string;

  @Prop({ default: true })
  isActive!: boolean;
}

export const CourseEnrollmentSchema = SchemaFactory.createForClass(CourseEnrollment);

// Indexes
CourseEnrollmentSchema.index({ studentId: 1, courseId: 1 }, { unique: true });
CourseEnrollmentSchema.index({ courseId: 1 });
CourseEnrollmentSchema.index({ studentId: 1 });
