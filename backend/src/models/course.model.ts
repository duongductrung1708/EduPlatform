import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CourseDocument = Course & Document;

export interface ICourse {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  detailedDescription?: string;
  thumbnail?: string;
  tags: string[];
  createdBy: Types.ObjectId;
  visibility: 'public' | 'private';
  status: 'draft' | 'published' | 'archived';
  category?: string;
  level?: string;
  enrollmentCount: number;
  averageRating: number;
  totalRatings: number;
  featured: boolean;
  allowComments: boolean;
  estimatedDuration?: number; // in minutes
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  prerequisites?: string[];
  learningObjectives?: string[];
  createdAt: Date;
  updatedAt: Date;
}

@Schema({ timestamps: true })
export class Course {
  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  slug!: string;

  @Prop({ required: true })
  description!: string;

  @Prop()
  detailedDescription?: string;

  @Prop()
  thumbnail?: string;

  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  createdBy!: Types.ObjectId;

  @Prop({ required: true, enum: ['public', 'private'], default: 'private' })
  visibility!: string;

  @Prop({ required: true, enum: ['draft', 'published', 'archived'], default: 'draft' })
  status!: string;

  @Prop()
  category?: string;

  @Prop()
  level?: string;

  @Prop({ default: 0 })
  enrollmentCount!: number;

  @Prop({ default: 0 })
  averageRating!: number;

  @Prop({ default: 0 })
  totalRatings!: number;

  @Prop({ default: false })
  featured!: boolean;

  @Prop({ default: true })
  allowComments!: boolean;

  @Prop()
  estimatedDuration?: number;

  @Prop({ enum: ['beginner', 'intermediate', 'advanced'] })
  difficulty?: string;

  @Prop({ type: [String], default: [] })
  prerequisites!: string[];

  @Prop({ type: [String], default: [] })
  learningObjectives!: string[];
}

export const CourseSchema = SchemaFactory.createForClass(Course);

// Indexes
CourseSchema.index({ slug: 1 }, { unique: true });
CourseSchema.index({ createdBy: 1 });
CourseSchema.index({ visibility: 1 });
CourseSchema.index({ tags: 1 });
