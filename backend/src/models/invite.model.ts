import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type InviteDocument = Invite & Document;

export interface IInvite {
  _id: Types.ObjectId;
  token: string;
  classroomId: Types.ObjectId;
  invitedEmail: string;
  expiresAt: Date;
  used: boolean;
  usedBy?: Types.ObjectId;
  createdAt: Date;
}

@Schema({ timestamps: true })
export class Invite {
  @Prop({ required: true, unique: true })
  token: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Classroom' })
  classroomId: Types.ObjectId;

  @Prop({ required: true })
  invitedEmail: string;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ default: false })
  used: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  usedBy?: Types.ObjectId;
}

export const InviteSchema = SchemaFactory.createForClass(Invite);

// Indexes
InviteSchema.index({ token: 1 }, { unique: true });
InviteSchema.index({ classroomId: 1 });
InviteSchema.index({ invitedEmail: 1 });
InviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
