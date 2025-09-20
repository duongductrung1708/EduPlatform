import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document as MongooseDocument, Types } from 'mongoose';

export type DocumentFileDocument = DocumentFile & MongooseDocument;

export interface IDocumentFile {
  _id: Types.ObjectId;
  courseId: Types.ObjectId;
  title: string;
  description?: string;
  fileUrl: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  tags: string[];
  createdBy: Types.ObjectId;
  visibility: 'public' | 'private';
  status: 'draft' | 'published' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

@Schema({ timestamps: true })
export class DocumentFile {
  @Prop({ type: Types.ObjectId, ref: 'Course', required: true })
  courseId!: Types.ObjectId;

  @Prop({ required: true })
  title!: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  fileUrl!: string;

  @Prop()
  fileName?: string;

  @Prop()
  fileSize?: number;

  @Prop()
  mimeType?: string;

  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy!: Types.ObjectId;

  @Prop({ required: true, enum: ['public', 'private'], default: 'private' })
  visibility!: string;

  @Prop({ required: true, enum: ['draft', 'published', 'archived'], default: 'draft' })
  status!: string;
}

export const DocumentFileSchema = SchemaFactory.createForClass(DocumentFile);

DocumentFileSchema.index({ courseId: 1, status: 1, visibility: 1, createdAt: -1 });
DocumentFileSchema.index({ tags: 1 });

