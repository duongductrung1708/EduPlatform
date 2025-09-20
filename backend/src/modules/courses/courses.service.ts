import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Course, CourseDocument } from '../../models/course.model';
import { DocumentFile, DocumentFileDocument } from '../../models/document.model';
import { CreateCourseDto, UpdateCourseDto, CreateDocumentDto, UpdateDocumentDto } from './dto/course.dto';
import { CourseEnrollment, CourseEnrollmentDocument } from '../../models/course-enrollment.model';
import { Lesson, LessonDocument } from '../../models/lesson.model';
import { Module as CourseModule, ModuleDocument } from '../../models/module.model';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class CoursesService {
  constructor(
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    @InjectModel(DocumentFile.name) private documentModel: Model<DocumentFileDocument>,
    @InjectModel(CourseEnrollment.name) private enrollmentModel: Model<CourseEnrollmentDocument>,
    @InjectModel(Lesson.name) private lessonModel: Model<LessonDocument>,
    @InjectModel(CourseModule.name) private moduleModel: Model<ModuleDocument>,
    private realtimeGateway: RealtimeGateway,
  ) {}

  async create(createCourseDto: CreateCourseDto, createdBy: string): Promise<CourseDocument> {
    // Check if slug already exists
    const existingCourse = await this.courseModel.findOne({ slug: createCourseDto.slug });
    if (existingCourse) {
      throw new ConflictException('Course slug already exists');
    }

    const course = new this.courseModel({
      ...createCourseDto,
      createdBy,
    });

    return course.save();
  }

  // Course modules (teacher content management)
  async listModules(courseId: string) {
    return this.moduleModel
      .find({ courseId: new Types.ObjectId(courseId) })
      .sort({ order: 1, createdAt: 1 })
      .lean();
  }

  async createModule(courseId: string, userId: string, payload: { title: string; description: string; order?: number; estimatedDuration?: number; isPublished?: boolean; }) {
    const course = await this.courseModel.findById(courseId);
    if (!course) throw new NotFoundException('Course not found');
    if (String(course.createdBy) !== String(userId)) throw new ForbiddenException('Not course owner');

    const moduleDoc = new this.moduleModel({
      title: payload.title,
      description: payload.description,
      courseId: new Types.ObjectId(courseId),
      order: payload.order ?? 0,
      estimatedDuration: payload.estimatedDuration,
      isPublished: payload.isPublished ?? true,
    });
    return moduleDoc.save();
  }

  // Lessons under a module
  async listLessonsByModule(moduleId: string) {
    return this.lessonModel
      .find({ moduleId: new Types.ObjectId(moduleId) })
      .sort({ order: 1, createdAt: 1 })
      .lean();
  }

  async createLessonUnderModule(moduleId: string, userId: string, payload: {
    title: string;
    description: string;
    type: 'document' | 'video' | 'interactive' | 'quiz' | 'assignment';
    order?: number;
    content?: any;
    estimatedDuration?: number;
    isPublished?: boolean;
  }) {
    const moduleDoc = await this.moduleModel.findById(moduleId);
    if (!moduleDoc) throw new NotFoundException('Module not found');
    const course = await this.courseModel.findById(moduleDoc.courseId);
    if (!course) throw new NotFoundException('Course not found');
    if (String(course.createdBy) !== String(userId)) throw new ForbiddenException('Not course owner');

    const lesson = new this.lessonModel({
      title: payload.title,
      description: payload.description,
      type: payload.type,
      moduleId: moduleDoc._id,
      courseId: moduleDoc.courseId,
      order: payload.order ?? 0,
      content: payload.content ?? {},
      estimatedDuration: payload.estimatedDuration,
      isPublished: payload.isPublished ?? true,
    });
    return lesson.save();
  }

  async findAll(page = 1, limit = 10, search?: string, tags?: string[], visibility?: string) {
    const query: any = {};
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    
    if (tags && tags.length > 0) {
      query.tags = { $in: tags };
    }
    
    if (visibility) {
      query.visibility = visibility;
    }

    const skip = (page - 1) * limit;

    const [courses, total] = await Promise.all([
      this.courseModel.find(query).skip(skip).limit(limit).populate('createdBy', 'name email').exec(),
      this.courseModel.countDocuments(query),
    ]);

    return {
      courses,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<CourseDocument> {
    const course = await this.courseModel.findById(id).populate('createdBy', 'name email');
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    return course;
  }

  async findBySlug(slug: string): Promise<CourseDocument> {
    const course = await this.courseModel.findOne({ slug }).populate('createdBy', 'name email');
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    return course;
  }

  async update(id: string, updateCourseDto: UpdateCourseDto, userId: string): Promise<CourseDocument> {
    const course = await this.courseModel.findOne({ _id: id, createdBy: userId });
    if (!course) {
      throw new NotFoundException('Course not found or access denied');
    }

    const updatedCourse = await this.courseModel.findByIdAndUpdate(
      id,
      updateCourseDto,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    return updatedCourse!;
  }

  async remove(id: string, userId: string): Promise<void> {
    const course = await this.courseModel.findOne({ _id: id, createdBy: userId });
    if (!course) {
      throw new NotFoundException('Course not found or access denied');
    }

    await this.courseModel.findByIdAndDelete(id);
  }

  // Documents (materials)
  async addDocument(createDto: CreateDocumentDto, userId: string) {
    // validate course exists and belongs to user if private; allow teachers to attach materials to their courses
    const course = await this.courseModel.findById(createDto.courseId);
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    if (String(course.createdBy) !== userId) {
      // Could allow assistants/admin; for now only owner or admin via controller roles
    }
    const doc = new this.documentModel({
      ...createDto,
      courseId: new Types.ObjectId(createDto.courseId),
      createdBy: new Types.ObjectId(userId),
    });
    return doc.save();
  }

  async listCourseDocuments(courseId: string, onlyPublic = false) {
    const query: any = { courseId: new Types.ObjectId(courseId) };
    if (onlyPublic) {
      query.visibility = 'public';
      query.status = 'published';
    }
    return this.documentModel.find(query).sort({ createdAt: -1 }).lean();
  }

  async updateDocument(id: string, updateDto: UpdateDocumentDto, userId: string) {
    const doc = await this.documentModel.findOne({ _id: id, createdBy: userId });
    if (!doc) throw new NotFoundException('Document not found or access denied');
    return this.documentModel.findByIdAndUpdate(id, updateDto, { new: true, runValidators: true });
  }

  async removeDocument(id: string, userId: string) {
    const doc = await this.documentModel.findOne({ _id: id, createdBy: userId });
    if (!doc) throw new NotFoundException('Document not found or access denied');
    await this.documentModel.findByIdAndDelete(id);
  }

  // Enrollment
  async enrollInCourse(courseId: string, studentId: string) {
    console.log('Enrolling student:', studentId, 'in course:', courseId);
    const course = await this.courseModel.findById(courseId);
    if (!course) throw new NotFoundException('Course not found');

    const exists = await this.enrollmentModel.findOne({ 
      courseId: new Types.ObjectId(courseId), 
      studentId: new Types.ObjectId(studentId) 
    });
    console.log('Existing enrollment:', exists);
    if (exists) {
      if (!exists.isActive) {
        exists.isActive = true;
        await exists.save();
        console.log('Reactivated existing enrollment');
      }
      return { message: 'Already enrolled' };
    }

    const enrollment = await this.enrollmentModel.create({
      courseId: new Types.ObjectId(courseId),
      studentId: new Types.ObjectId(studentId),
    });
    console.log('Created new enrollment:', enrollment);

    // increment enrollment count
    await this.courseModel.findByIdAndUpdate(courseId, { $inc: { enrollmentCount: 1 } });

    // Emit real-time event
    const populatedEnrollment = await this.enrollmentModel
      .findById(enrollment._id)
      .populate('studentId', 'name email avatar')
      .lean();
    
    this.realtimeGateway.emitEnrollmentAdded(courseId, populatedEnrollment);

    return { message: 'Enrolled successfully' };
  }

  async getEnrollmentStatus(courseId: string, studentId: string) {
    console.log('Checking enrollment status for course:', courseId, 'student:', studentId);
    const enrollment = await this.enrollmentModel.findOne({ 
      courseId: new Types.ObjectId(courseId), 
      studentId: new Types.ObjectId(studentId),
      isActive: true 
    }).lean();
    console.log('Found enrollment:', enrollment);
    if (!enrollment) return { enrolled: false, progress: 0 };
    return { enrolled: true, progress: enrollment.progress?.percentage ?? 0 };
  }

  // Ratings
  async rateCourse(courseId: string, studentId: string, rating: number, review?: string) {
    if (rating < 1 || rating > 5) throw new ForbiddenException('Rating must be between 1 and 5');

    const course = await this.courseModel.findById(courseId);
    if (!course) throw new NotFoundException('Course not found');

    const enrollment = await this.enrollmentModel.findOne({ courseId, studentId });
    if (!enrollment) throw new ForbiddenException('Enroll before rating');

    // If previously rated, adjust averages; for simplicity, only allow one rating update per enrollment
    const hadPrevious = typeof enrollment.rating === 'number';
    const prev = enrollment.rating ?? 0;

    // Update enrollment rating/review
    enrollment.rating = rating;
    if (review !== undefined) enrollment.review = review;
    await enrollment.save();

    // Update course aggregates
    if (!hadPrevious) {
      const newTotal = (course.totalRatings ?? 0) + 1;
      const newAvg = (((course.averageRating ?? 0) * (course.totalRatings ?? 0)) + rating) / newTotal;
      course.totalRatings = newTotal;
      course.averageRating = Number(newAvg.toFixed(2));
    } else {
      // replace previous rating
      const total = course.totalRatings ?? 0;
      const sum = (course.averageRating ?? 0) * total;
      const newAvg = total > 0 ? (sum - prev + rating) / total : rating;
      course.averageRating = Number(newAvg.toFixed(2));
    }
    await course.save();

    return { message: 'Rating submitted' };
  }

  // Lessons grouped by module for a course (merge-friendly)
  async listLessonsByCourse(courseId: string) {
    const lessons = await this.lessonModel
      .find({ courseId: new Types.ObjectId(courseId), isPublished: true })
      .sort({ moduleId: 1, order: 1 })
      .lean();
    // group by moduleId
    const map = new Map<string, { moduleId: string; lessons: any[] }>();
    for (const l of lessons) {
      const key = String(l.moduleId);
      if (!map.has(key)) map.set(key, { moduleId: key, lessons: [] });
      map.get(key)!.lessons.push(l);
    }
    return Array.from(map.values());
  }

  // Enrollment management
  async getCourseEnrollments(courseId: string, userId: string) {
    const course = await this.courseModel.findById(courseId);
    if (!course) throw new NotFoundException('Course not found');
    if (String(course.createdBy) !== String(userId)) throw new ForbiddenException('Not course owner');

    const enrollments = await this.enrollmentModel
      .find({ courseId: new Types.ObjectId(courseId), isActive: true })
      .populate('studentId', 'name email avatar')
      .sort({ enrolledAt: -1 })
      .lean();

    return enrollments.map(enrollment => ({
      _id: enrollment._id,
      student: enrollment.studentId,
      enrolledAt: enrollment.enrolledAt,
      progress: enrollment.progress?.percentage || 0,
      lastAccessedAt: enrollment.lastAccessedAt,
      rating: enrollment.rating,
      review: enrollment.review,
    }));
  }

  async removeStudentFromCourse(courseId: string, studentId: string, userId: string) {
    const course = await this.courseModel.findById(courseId);
    if (!course) throw new NotFoundException('Course not found');
    if (String(course.createdBy) !== String(userId)) throw new ForbiddenException('Not course owner');

    const enrollment = await this.enrollmentModel.findOne({ 
      courseId: new Types.ObjectId(courseId), 
      studentId: new Types.ObjectId(studentId) 
    });
    
    if (!enrollment) throw new NotFoundException('Enrollment not found');

    // Deactivate enrollment instead of deleting to preserve history
    enrollment.isActive = false;
    await enrollment.save();

    // Decrement enrollment count
    await this.courseModel.findByIdAndUpdate(courseId, { $inc: { enrollmentCount: -1 } });

    // Emit real-time event
    this.realtimeGateway.emitEnrollmentRemoved(courseId, studentId);

    return { message: 'Student removed from course successfully' };
  }
}
