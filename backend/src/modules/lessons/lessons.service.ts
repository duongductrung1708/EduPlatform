import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Lesson, LessonDocument } from '../../models/lesson.model';
import { Classroom, ClassroomDocument } from '../../models/classroom.model';
import { CreateLessonDto, UpdateLessonDto } from './dto/lesson.dto';

@Injectable()
export class LessonsService {
  constructor(
    @InjectModel(Lesson.name) private lessonModel: Model<LessonDocument>,
    @InjectModel(Classroom.name) private classroomModel: Model<ClassroomDocument>,
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
      ...createLessonDto,
      classroomId: new Types.ObjectId(classroomId),
      createdBy: new Types.ObjectId(createdBy),
    });

    return lesson.save();
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

    const updatedLesson = await this.lessonModel
      .findByIdAndUpdate(id, updateLessonDto, { new: true, runValidators: true })
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

    await this.lessonModel.findByIdAndDelete(id);
  }
}
