import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

export interface IUser {
  _id: Types.ObjectId;
  email: string;
  passwordHash?: string;
  name: string;
  role: 'admin' | 'teacher' | 'student' | 'parent' | 'guest';
  avatarUrl?: string;
  organization?: string;
  verified: boolean;
  lastLoginAt?: Date;
  settings?: {
    kidMode?: boolean;
    locale?: string;
  };
  parentOf?: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, lowercase: true })
  email!: string;

  @Prop()
  passwordHash?: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, enum: ['admin', 'teacher', 'student', 'parent', 'guest'] })
  role!: string;

  @Prop()
  avatarUrl?: string;

  @Prop()
  organization?: string;

  @Prop({ default: false })
  verified!: boolean;

  @Prop()
  lastLoginAt?: Date;

  @Prop({
    type: {
      kidMode: { type: Boolean, default: false },
      locale: { type: String, default: 'vi' }
    }
  })
  settings?: {
    kidMode?: boolean;
    locale?: string;
  };

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }] })
  parentOf?: Types.ObjectId[];

  @Prop()
  resetPasswordToken?: string;

  @Prop()
  resetPasswordExpires?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Indexes
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1 });
