import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Lesson, LessonDocument } from '../../models/lesson.model';
import { Classroom, ClassroomDocument } from '../../models/classroom.model';
import { CreateLessonDto, UpdateLessonDto } from './dto/lesson.dto';
import * as path from 'path';
import * as fs from 'fs';
import { Optional } from '@nestjs/common';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class LessonsService {
  constructor(
    @InjectModel(Lesson.name) private lessonModel: Model<LessonDocument>,
    @InjectModel(Classroom.name) private classroomModel: Model<ClassroomDocument>,
    @Optional() private realtime?: RealtimeGateway,
  ) {}

  async create(classroomId: string, createLessonDto: CreateLessonDto, createdBy: string): Promise<LessonDocument> {
    // Check if classroom exists and user has access (support legacy fields)
    const classroom = await this.classroomModel.findOne({
      _id: classroomId,
      $or: [
        { teacherIds: new Types.ObjectId(createdBy) },
        { assistantIds: new Types.ObjectId(createdBy) },
        // legacy
        { teacherId: new Types.ObjectId(createdBy) },
      ],
    });

    if (!classroom) {
      throw new ForbiddenException('Access denied to this classroom');
    }

    const lesson = new this.lessonModel({
      title: createLessonDto.title,
      description: (createLessonDto as any).description,
      type: (createLessonDto as any).type || 'discussion',
      classroomId: new Types.ObjectId(classroomId),
      order: createLessonDto.order ?? 0,
      topic: (createLessonDto as any).topic,
      week: (createLessonDto as any).week,
      tags: (createLessonDto as any).tags,
      content: {
        htmlContent: createLessonDto.contentHtml,
        attachments: (createLessonDto as any).attachments,
      },
      isPublished: true,
      createdBy: new Types.ObjectId(createdBy),
    } as any);

    return lesson.save();
  }

  async findById(lessonId: string) {
    const lesson = await this.lessonModel.findById(lessonId).lean();
    if (!lesson) throw new NotFoundException('Lesson not found');
    return lesson;
  }

  async findAll(classroomId: string, userId: string) {
    // Check if user has access to classroom (support legacy fields)
    const classroom = await this.classroomModel.findOne({
      _id: classroomId,
      $or: [
        { teacherIds: new Types.ObjectId(userId) },
        { assistantIds: new Types.ObjectId(userId) },
        { studentIds: new Types.ObjectId(userId) },
        // legacy
        { teacherId: new Types.ObjectId(userId) },
        { students: new Types.ObjectId(userId) },
      ],
    });

    if (!classroom) {
      throw new ForbiddenException('Access denied to this classroom');
    }

    return this.lessonModel
      .find({ classroomId: new Types.ObjectId(classroomId) })
      .sort({ order: 1, createdAt: 1 })
      .populate('createdBy', 'name email')
      .exec();
  }

  async findOne(id: string, userId: string): Promise<LessonDocument> {
    const lesson = await this.lessonModel
      .findById(id)
      .populate('createdBy', 'name email')
      .populate('classroomId', 'title');

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    // Check if user has access to the classroom (support legacy fields)
    const classroom = await this.classroomModel.findOne({
      _id: (lesson as any).classroomId,
      $or: [
        { teacherIds: new Types.ObjectId(userId) },
        { assistantIds: new Types.ObjectId(userId) },
        { studentIds: new Types.ObjectId(userId) },
        // legacy
        { teacherId: new Types.ObjectId(userId) },
        { students: new Types.ObjectId(userId) },
      ],
    });

    if (!classroom) {
      throw new ForbiddenException('Access denied to this lesson');
    }

    return lesson;
  }

  async update(id: string, updateLessonDto: UpdateLessonDto, userId: string): Promise<LessonDocument> {
    const lesson = await this.lessonModel.findById(id);
    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    // Check if user is teacher/assistant of the classroom (support legacy fields)
    const classroom = await this.classroomModel.findOne({
      _id: (lesson as any).classroomId,
      $or: [
        { teacherIds: new Types.ObjectId(userId) },
        { assistantIds: new Types.ObjectId(userId) },
        // legacy
        { teacherId: new Types.ObjectId(userId) },
      ],
    });

    if (!classroom) {
      throw new ForbiddenException('Access denied to update this lesson');
    }

    // Build update payload to handle nested content fields
    const updatePayload: any = { ...updateLessonDto };
    if (typeof (updateLessonDto as any).contentHtml !== 'undefined' || typeof (updateLessonDto as any).attachments !== 'undefined') {
      updatePayload.content = {
        ...(lesson.toObject().content || {}),
        ...(typeof (updateLessonDto as any).contentHtml !== 'undefined' ? { htmlContent: (updateLessonDto as any).contentHtml } : {}),
        ...(typeof (updateLessonDto as any).attachments !== 'undefined' ? { attachments: (updateLessonDto as any).attachments } : {}),
      };
      delete (updatePayload as any).contentHtml;
      delete (updatePayload as any).attachments;
    }

    const updatedLesson = await this.lessonModel
      .findByIdAndUpdate(id, updatePayload, { new: true, runValidators: true })
      .populate('createdBy', 'name email');

    return updatedLesson!;
  }

  async remove(id: string, userId: string): Promise<void> {
    const lesson = await this.lessonModel.findById(id);
    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    // Check if user is teacher/assistant of the classroom (support legacy fields)
    const classroom = await this.classroomModel.findOne({
      _id: (lesson as any).classroomId,
      $or: [
        { teacherIds: new Types.ObjectId(userId) },
        { assistantIds: new Types.ObjectId(userId) },
        // legacy
        { teacherId: new Types.ObjectId(userId) },
      ],
    });

    if (!classroom) {
      throw new ForbiddenException('Access denied to delete this lesson');
    }

    // Collect attachments to delete files
    const attachments: Array<{ url: string }> = ((lesson as any).content?.attachments || []) as any;
    // Delete lesson
    await this.lessonModel.findByIdAndDelete(id);
    // Best-effort: delete chat messages under this lesson
    try {
      const ChatMessageModel = (this.lessonModel as any).db.model('ChatMessage');
      await ChatMessageModel.deleteMany({ lessonId: new Types.ObjectId(id) });
      if (this.realtime) {
        this.realtime.server.to(`lesson:${id}`).emit('lessonDeleted', { id });
      }
    } catch {}
    // Delete uploaded files stored locally (only for /uploads/<filename> URLs)
    try {
      for (const a of attachments) {
        try {
          const u = new URL(a.url, process.env.BACKEND_URL || 'http://localhost:3000');
          const parts = (u.pathname || '').split('/');
          const idx = parts.findIndex((p) => p === 'uploads');
          const stored = idx >= 0 ? parts[parts.length - 1] : '';
          if (stored) {
            const filePath = path.join(process.cwd(), 'uploads', stored);
            if (fs.existsSync(filePath)) await fs.promises.unlink(filePath);
          }
        } catch {}
      }
    } catch {}
  }
}
