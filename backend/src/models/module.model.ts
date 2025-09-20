import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ModuleDocument = Module & Document;

export interface IModule {
  _id: Types.ObjectId;
  title: string;
  description: string;
  courseId: Types.ObjectId;
  order: number;
  isPublished: boolean;
  estimatedDuration?: number; // in minutes
  createdAt: Date;
  updatedAt: Date;
}

@Schema({ timestamps: true })
export class Module {
  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  description!: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Course' })
  courseId!: Types.ObjectId;

  @Prop({ required: true, default: 0 })
  order!: number;

  @Prop({ default: true })
  isPublished!: boolean;

  @Prop()
  estimatedDuration?: number;
}

export const ModuleSchema = SchemaFactory.createForClass(Module);

// Indexes
ModuleSchema.index({ courseId: 1, order: 1 });
ModuleSchema.index({ courseId: 1 });
