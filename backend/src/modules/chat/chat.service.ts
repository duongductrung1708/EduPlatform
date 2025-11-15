import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ChatMessage, ChatMessageDocument } from '../../models/chat-message.model';
import { Classroom, ClassroomDocument } from '../../models/classroom.model';
import { Lesson, LessonDocument } from '../../models/lesson.model';
import { User, UserDocument } from '../../models/user.model';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(ChatMessage.name) private chatModel: Model<ChatMessageDocument>,
    @InjectModel(Classroom.name) private classroomModel: Model<ClassroomDocument>,
    @InjectModel(Lesson.name) private lessonModel: Model<LessonDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private realtime: RealtimeGateway,
  ) {}

  async saveClassMessage(classroomId: string, authorId: string, authorName: string, message: string) {
    return this.chatModel.create({ classroomId: new Types.ObjectId(classroomId), authorId: new Types.ObjectId(authorId), authorName, message });
  }

  async saveLessonMessage(lessonId: string, authorId: string, authorName: string, message: string) {
    return this.chatModel.create({ lessonId: new Types.ObjectId(lessonId), authorId: new Types.ObjectId(authorId), authorName, message });
  }

  async listClassMessages(classroomId: string, limit = 50) {
    const messages = await this.chatModel.find({ classroomId: new Types.ObjectId(classroomId) }).sort({ createdAt: -1 }).limit(limit).lean();
    // Populate avatarUrl from User model
    const messagesWithAvatar = await Promise.all(messages.map(async (msg: any) => {
      try {
        if (!msg.authorId) return msg;
        const user = await this.userModel.findById(msg.authorId).select('avatarUrl name email').lean();
        if (!user) {
          // User not found - might have been deleted
          return {
            ...msg,
            authorAvatarUrl: null,
          };
        }
        const avatarUrl = (user as any)?.avatarUrl || null;
        return {
          ...msg,
          authorAvatarUrl: avatarUrl,
        };
      } catch (err) {
        return {
          ...msg,
          authorAvatarUrl: null,
        };
      }
    }));
    return messagesWithAvatar;
  }

  async listLessonMessages(lessonId: string, limit = 50) {
    const messages = await this.chatModel.find({ lessonId: new Types.ObjectId(lessonId) }).sort({ createdAt: -1 }).limit(limit).lean();
    // Populate avatarUrl from User model
    const messagesWithAvatar = await Promise.all(messages.map(async (msg: any) => {
      try {
        if (!msg.authorId) {
          return msg;
        }
        const user = await this.userModel.findById(msg.authorId).select('avatarUrl name email').lean();
        if (!user) {
          // User not found - might have been deleted
          return {
            ...msg,
            authorAvatarUrl: null,
          };
        }
        const avatarUrl = (user as any)?.avatarUrl || null;
        return {
          ...msg,
          authorAvatarUrl: avatarUrl,
        };
      } catch (err) {
        return {
          ...msg,
          authorAvatarUrl: null,
        };
      }
    }));
    return messagesWithAvatar;
  }

  async editMessage(messageId: string, userId: string, message: string) {
    if (!Types.ObjectId.isValid(messageId)) return { success: true };
    const msg = await this.chatModel.findById(messageId);
    if (!msg) throw new Error('Not found');
    const isAuthor = String(msg.authorId) === String(userId);
    if (!isAuthor) throw new Error('Forbidden');
    msg.message = message;
    await msg.save();

    const ts = new Date().toISOString();
    const payload: any = { id: String(msg._id), message: msg.message, user: { id: String(msg.authorId), name: msg.authorName }, timestamp: ts };
    if (msg.classroomId) this.realtime.server.to(`classroom:${String(msg.classroomId)}`).emit('classMessageUpdated', payload);
    if (msg.lessonId) this.realtime.server.to(`lesson:${String(msg.lessonId)}`).emit('lessonMessageUpdated', payload);

    return { success: true };
  }

  private async isTeacherOfMessage(msg: any, userId: string): Promise<boolean> {
    let classroomId: string | null = null;
    if (msg.classroomId) classroomId = String(msg.classroomId);
    if (!classroomId && msg.lessonId) {
      try {
        const lesson = await this.lessonModel.findById(msg.lessonId).lean();
        classroomId = lesson?.classroomId ? String(lesson.classroomId) : null;
      } catch {}
    }
    if (!classroomId) return false;
    const classroom = await this.classroomModel.findById(classroomId).lean();
    if (!classroom) return false;
    const teacherIds = [
      ...(classroom as any).teacherIds || [],
      ...(classroom as any).assistantIds || [],
      (classroom as any).teacherId ? [(classroom as any).teacherId] : [],
    ].map((id: any) => String(id));
    return teacherIds.includes(String(userId));
  }

  async deleteMessage(messageId: string, userId: string) {
    if (!Types.ObjectId.isValid(messageId)) return { success: true };
    const msg = await this.chatModel.findById(messageId).lean();
    if (!msg) return { success: true };
    const isAuthor = String(msg.authorId) === String(userId);
    if (!isAuthor) {
      const allowed = await this.isTeacherOfMessage(msg, userId);
      if (!allowed) throw new Error('Forbidden');
    }
    await this.chatModel.deleteOne({ _id: new Types.ObjectId(messageId) });

    const payload: any = { id: String(messageId) };
    if (msg.classroomId) this.realtime.server.to(`classroom:${String(msg.classroomId)}`).emit('classMessageDeleted', payload);
    if (msg.lessonId) this.realtime.server.to(`lesson:${String(msg.lessonId)}`).emit('lessonMessageDeleted', payload);

    return { success: true };
  }
}


