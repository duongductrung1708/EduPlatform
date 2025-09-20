import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LessonDocument = Lesson & Document;

export interface ILesson {
  _id: Types.ObjectId;
  title: string;
  description: string;
  moduleId: Types.ObjectId;
  courseId: Types.ObjectId;
  order: number;
  type: 'document' | 'video' | 'interactive' | 'quiz' | 'assignment';
  content: {
    // For document type
    fileUrl?: string;
    fileName?: string;
    fileType?: string;
    
    // For video type
    videoUrl?: string;
    videoDuration?: number;
    transcript?: string;
    
    // For interactive type
    htmlContent?: string;
    images?: string[];
    
    // For quiz type
    questions?: QuizQuestion[];
    
    // For assignment type
    instructions?: string;
    dueDate?: Date;
    maxPoints?: number;
    allowedFileTypes?: string[];
  };
  isPublished: boolean;
  estimatedDuration?: number; // in minutes
  createdAt: Date;
  updatedAt: Date;
}

export interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'drag-drop' | 'fill-blank';
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  points: number;
}

@Schema({ timestamps: true })
export class Lesson {
  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  description!: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Module' })
  moduleId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Course' })
  courseId!: Types.ObjectId;

  @Prop({ required: true, default: 0 })
  order!: number;

  @Prop({ 
    required: true, 
    enum: ['document', 'video', 'interactive', 'quiz', 'assignment'] 
  })
  type!: string;

  @Prop({ type: Object, default: {} })
  content!: any;

  @Prop({ default: true })
  isPublished!: boolean;

  @Prop()
  estimatedDuration?: number;
}

export const LessonSchema = SchemaFactory.createForClass(Lesson);

// Indexes
LessonSchema.index({ moduleId: 1, order: 1 });
LessonSchema.index({ courseId: 1 });
LessonSchema.index({ moduleId: 1 });