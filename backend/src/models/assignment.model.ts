import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
// import { IAttachment } from './lesson.model';

export type AssignmentDocument = Assignment & Document;
export type SubmissionDocument = Submission & Document;

export interface IAssignment {
  _id: Types.ObjectId;
  classroomId: Types.ObjectId;
  title: string;
  description?: string;
  attachments?: any[];
  dueDate?: Date;
  totalPoints?: number;
  createdBy: Types.ObjectId;
  createdAt: Date;
}

export interface ISubmission {
  _id: Types.ObjectId;
  assignmentId: Types.ObjectId;
  studentId: Types.ObjectId;
  contentText?: string;
  attachments?: any[];
  submittedAt: Date;
  graded?: boolean;
  grade?: number;
  feedback?: string;
}

@Schema({ timestamps: true })
export class Assignment {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Classroom' })
  classroomId!: Types.ObjectId;

  @Prop({ required: true })
  title!: string;

  @Prop()
  description?: string;

  @Prop({
    type: [{
      url: { type: String, required: true },
      type: { type: String, required: true },
      size: Number,
      name: String
    }],
    default: []
  })
  attachments?: any[];

  @Prop()
  dueDate?: Date;

  @Prop({ default: 100 })
  totalPoints?: number;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  createdBy!: Types.ObjectId;
}

@Schema({ timestamps: true })
export class Submission {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Assignment' })
  assignmentId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  studentId!: Types.ObjectId;

  @Prop()
  contentText?: string;

  @Prop({
    type: [{
      url: { type: String, required: true },
      type: { type: String, required: true },
      size: Number,
      name: String
    }],
    default: []
  })
  attachments?: any[];

  @Prop({ default: Date.now })
  submittedAt!: Date;

  @Prop({ default: false })
  graded?: boolean;

  @Prop()
  grade?: number;

  @Prop()
  feedback?: string;
}

export const AssignmentSchema = SchemaFactory.createForClass(Assignment);
export const SubmissionSchema = SchemaFactory.createForClass(Submission);

// Indexes
AssignmentSchema.index({ classroomId: 1, createdAt: -1 });
AssignmentSchema.index({ createdBy: 1 });
SubmissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });
SubmissionSchema.index({ studentId: 1 });
