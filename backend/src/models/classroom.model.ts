import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

export type ClassroomDocument = Classroom & Document;

export interface IClassroom {
  _id: Types.ObjectId;
  title: string;
  courseId?: Types.ObjectId;
  teacherIds: Types.ObjectId[];
  assistantIds: Types.ObjectId[];
  studentIds: Types.ObjectId[];
  inviteCode?: string;
  schedule?: {
    startDate: Date;
    endDate?: Date;
    timezone?: string;
  };
  meta?: any;
  createdAt: Date;
}

@Schema({ timestamps: true })
export class Classroom {
  @Prop({ required: true })
  title!: string;

  @Prop({ type: Types.ObjectId, ref: 'Course' })
  courseId?: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  teacherIds!: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  assistantIds!: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  studentIds!: Types.ObjectId[];

  @Prop({ unique: true, sparse: true })
  inviteCode?: string;

  @Prop({
    type: {
      startDate: { type: Date, required: true },
      endDate: Date,
      timezone: { type: String, default: 'Asia/Ho_Chi_Minh' }
    }
  })
  schedule?: {
    startDate: Date;
    endDate?: Date;
    timezone?: string;
  };

  @Prop({ type: MongooseSchema.Types.Mixed })
  meta?: any;

  @Prop({ default: 'active' })
  status?: string;

  @Prop({ default: 30 })
  maxStudents?: number;
}

export const ClassroomSchema = SchemaFactory.createForClass(Classroom);

// Indexes
ClassroomSchema.index({ inviteCode: 1 }, { unique: true, sparse: true });
ClassroomSchema.index({ courseId: 1 });
ClassroomSchema.index({ teacherIds: 1 });
ClassroomSchema.index({ studentIds: 1 });
