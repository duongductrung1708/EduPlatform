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
import { EmailService } from '../email/email.service';
import { User, UserDocument } from '../../models/user.model';
import { NotificationsService } from '../notifications/notifications.service';
import { CourseInvitation, CourseInvitationDocument } from '../../models/course-invitation.model';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class CoursesService {
  /**
   * Helper to resolve courseId (can be ObjectId or slug) to actual ObjectId
   */
  private async resolveCourseId(courseIdOrSlug: string): Promise<Types.ObjectId> {
    // Check if it's a valid ObjectId
    if (/^[0-9a-fA-F]{24}$/.test(courseIdOrSlug)) {
      return new Types.ObjectId(courseIdOrSlug);
    }
    
    // Otherwise, treat as slug and find the course
    const course = await this.courseModel.findOne({ slug: courseIdOrSlug });
    if (!course) {
      throw new NotFoundException(`Course not found: ${courseIdOrSlug}`);
    }
    return course._id;
  }

  constructor(
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    @InjectModel(DocumentFile.name) private documentModel: Model<DocumentFileDocument>,
    @InjectModel(CourseEnrollment.name) private enrollmentModel: Model<CourseEnrollmentDocument>,
    @InjectModel(Lesson.name) private lessonModel: Model<LessonDocument>,
    @InjectModel(CourseModule.name) private moduleModel: Model<ModuleDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(CourseInvitation.name) private invitationModel: Model<CourseInvitationDocument>,
    private realtimeGateway: RealtimeGateway,
    private emailService: EmailService,
    private notifications: NotificationsService,
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
    const resolvedCourseId = await this.resolveCourseId(courseId);
    return this.moduleModel
      .find({ courseId: resolvedCourseId })
      .sort({ order: 1, createdAt: 1 })
      .lean();
  }

  async createModule(courseId: string, userId: string, payload: { title: string; description: string; order?: number; volume?: string; estimatedDuration?: number; isPublished?: boolean; }) {
    const course = await this.courseModel.findById(courseId);
    if (!course) throw new NotFoundException('Course not found');
    if (String(course.createdBy) !== String(userId)) throw new ForbiddenException('Not course owner');

    const moduleDoc = new this.moduleModel({
      title: payload.title,
      description: payload.description,
      courseId: new Types.ObjectId(courseId),
      order: payload.order ?? 0,
      volume: payload.volume,
      estimatedDuration: payload.estimatedDuration,
      isPublished: payload.isPublished ?? true,
    });
    return moduleDoc.save();
  }

  async updateModule(moduleId: string, userId: string, payload: {
    title?: string;
    description?: string;
    order?: number;
    volume?: string;
    estimatedDuration?: number;
    isPublished?: boolean;
  }) {
    // Find module first
    const module = await this.moduleModel.findById(moduleId);
    
    if (!module) {
      throw new NotFoundException('Module not found');
    }
    
    // Check course ownership
    const course = await this.courseModel.findById(module.courseId);
    if (!course) throw new NotFoundException('Course not found');
    if (String(course.createdBy) !== String(userId)) throw new ForbiddenException('Not course owner');

    Object.assign(module, payload);
    return module.save();
  }

  async deleteModule(courseId: string, moduleId: string, userId: string) {
    
    const course = await this.courseModel.findById(courseId);
    if (!course) throw new NotFoundException('Course not found');
    if (String(course.createdBy) !== String(userId)) throw new ForbiddenException('Not course owner');

    // Check if module exists at all
    const moduleExists = await this.moduleModel.findById(moduleId);
    if (moduleExists) {
      // details available if needed
    }
    if (!moduleExists) {
      throw new NotFoundException('Module not found');
    }

    // Check if module belongs to this course
    const module = await this.moduleModel.findOne({ 
      _id: new Types.ObjectId(moduleId), 
      courseId: new Types.ObjectId(courseId) 
    });
    if (!module) {
      throw new NotFoundException('Module not found in this course');
    }

    // Delete all lessons in this module first
    await this.lessonModel.deleteMany({ moduleId: new Types.ObjectId(moduleId) });
    
    // Delete the module
    await this.moduleModel.findByIdAndDelete(moduleId);
    return { message: 'Module and all its lessons deleted successfully' };
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

  async updateLesson(moduleId: string, lessonId: string, userId: string, payload: {
    title?: string;
    description?: string;
    type?: 'document' | 'video' | 'interactive' | 'quiz' | 'assignment';
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

    // Try to find lesson by ID first
    const lesson = await this.lessonModel.findById(lessonId);
    
    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }
    
    // Check if lesson belongs to the module
    if (String(lesson.moduleId) !== String(moduleId)) {
      throw new NotFoundException('Lesson does not belong to this module');
    }

    Object.assign(lesson, payload);
    return lesson.save();
  }

  async deleteLesson(moduleId: string, lessonId: string, userId: string) {
    
    const moduleDoc = await this.moduleModel.findById(moduleId);
    if (!moduleDoc) throw new NotFoundException('Module not found');
    
    const course = await this.courseModel.findById(moduleDoc.courseId);
    if (!course) throw new NotFoundException('Course not found');
    if (String(course.createdBy) !== String(userId)) throw new ForbiddenException('Not course owner');

    // Check if lesson exists at all
    const lessonExists = await this.lessonModel.findById(lessonId);
    if (!lessonExists) {
      throw new NotFoundException('Lesson not found');
    }

    // Check if lesson belongs to this module
    const lesson = await this.lessonModel.findOne({ 
      _id: new Types.ObjectId(lessonId), 
      moduleId: new Types.ObjectId(moduleId) 
    });
    if (!lesson) {
      throw new NotFoundException('Lesson not found in this module');
    }

    await this.lessonModel.findByIdAndDelete(lessonId);
    return { message: 'Lesson deleted successfully' };
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

    // Update enrollment counts and ratings for all courses
    for (const course of courses) {
      const actualEnrollmentCount = await this.enrollmentModel.countDocuments({
        courseId: course._id,
        isActive: true
      });
      
      // Calculate averageRating and totalRatings from enrollments
      const enrollmentsWithRatings = await this.enrollmentModel.find({
        courseId: course._id,
        isActive: true,
        rating: { $exists: true, $ne: null }
      }).select('rating').lean();
      
      const totalRatings = enrollmentsWithRatings.length;
      let averageRating = 0;
      if (totalRatings > 0) {
        const sumRatings = enrollmentsWithRatings.reduce((sum, e) => sum + (e.rating || 0), 0);
        averageRating = Number((sumRatings / totalRatings).toFixed(2));
      }
      
      // Update course with correct values if different
      let needsUpdate = false;
      if (course.enrollmentCount !== actualEnrollmentCount) {
        course.enrollmentCount = actualEnrollmentCount;
        needsUpdate = true;
      }
      if (course.totalRatings !== totalRatings) {
        course.totalRatings = totalRatings;
        needsUpdate = true;
      }
      if (Math.abs((course.averageRating || 0) - averageRating) > 0.01) {
        course.averageRating = averageRating;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await course.save();
      }
    }

    return {
      courses,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<CourseDocument> {
    // Check if id is a valid ObjectId (24 hex characters)
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    
    let course: CourseDocument | null = null;
    
    if (isObjectId) {
      // Try to find by ObjectId first
      course = await this.courseModel.findById(id).populate('createdBy', 'name email');
    }
    
    // If not found by ObjectId or id is not ObjectId format, try slug
    if (!course) {
      course = await this.courseModel.findOne({ slug: id }).populate('createdBy', 'name email');
    }
    
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    
    // Calculate actual enrollment count
    const actualEnrollmentCount = await this.enrollmentModel.countDocuments({
      courseId: course._id,
      isActive: true
    });
    
    // Calculate averageRating and totalRatings from enrollments
    const enrollmentsWithRatings = await this.enrollmentModel.find({
      courseId: course._id,
      isActive: true,
      rating: { $exists: true, $ne: null }
    }).select('rating').lean();
    
    const totalRatings = enrollmentsWithRatings.length;
    let averageRating = 0;
    if (totalRatings > 0) {
      const sumRatings = enrollmentsWithRatings.reduce((sum, e) => sum + (e.rating || 0), 0);
      averageRating = Number((sumRatings / totalRatings).toFixed(2));
    }
    
    // Update course with correct values if different
    let needsUpdate = false;
    if (course.enrollmentCount !== actualEnrollmentCount) {
      course.enrollmentCount = actualEnrollmentCount;
      needsUpdate = true;
    }
    if (course.totalRatings !== totalRatings) {
      course.totalRatings = totalRatings;
      needsUpdate = true;
    }
    if (Math.abs((course.averageRating || 0) - averageRating) > 0.01) {
      course.averageRating = averageRating;
      needsUpdate = true;
    }
    
    if (needsUpdate) {
      await course.save();
    }
    
    return course;
  }

  async findBySlug(slug: string): Promise<CourseDocument> {
    const course = await this.courseModel.findOne({ slug }).populate('createdBy', 'name email');
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    
    // Calculate actual enrollment count
    const actualEnrollmentCount = await this.enrollmentModel.countDocuments({
      courseId: course._id,
      isActive: true
    });
    
    // Update course with correct count if different
    if (course.enrollmentCount !== actualEnrollmentCount) {
      course.enrollmentCount = actualEnrollmentCount;
      await course.save();
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
    // Delete invitations
    await this.invitationModel.deleteMany({ courseId: new Types.ObjectId(id) });
    // Delete enrollments
    await this.enrollmentModel.deleteMany({ courseId: new Types.ObjectId(id) });
    // Find lessons belonging to this course (across modules)
    const lessons = await this.lessonModel.find({ courseId: new Types.ObjectId(id) }).lean();
    // Delete attachments files for lessons (S3 and local)
    for (const l of lessons) {
      const attachments: Array<{ url: string }> = (l.content?.attachments || []) as any;
      for (const a of attachments) {
        try {
          const url = a.url || '';
          if (/\.s3[.-].*\.amazonaws\.com\//.test(url)) {
            const parsed = new URL(url);
            const key = decodeURIComponent((parsed.pathname || '').replace(/^\//, ''));
            // Use runtime import to avoid circular dep issues
            const { UploadsService } = await import('../uploads/uploads.service');
            const uploadsService = new (UploadsService as any)();
            await uploadsService.deleteFromS3(key);
          } else {
            const u = new URL(url, process.env.BACKEND_URL || 'http://localhost:3000');
            const parts = (u.pathname || '').split('/');
            const idx = parts.findIndex((p) => p === 'uploads');
            const stored = idx >= 0 ? parts[parts.length - 1] : '';
            if (stored) {
              const filePath = path.join(process.cwd(), 'uploads', stored);
              if (fs.existsSync(filePath)) await fs.promises.unlink(filePath);
            }
          }
        } catch {}
      }
    }
    // Delete lessons and modules
    await this.lessonModel.deleteMany({ courseId: new Types.ObjectId(id) });
    await this.moduleModel.deleteMany({ courseId: new Types.ObjectId(id) });
    // Delete course documents/materials
    await this.documentModel.deleteMany({ courseId: new Types.ObjectId(id) });
    // Finally delete the course
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
    // Best-effort delete underlying file
    try {
      const url = (doc as any).fileUrl || '';
      if (/\.s3[.-].*\.amazonaws\.com\//.test(url)) {
        const parsed = new URL(url);
        const key = decodeURIComponent((parsed.pathname || '').replace(/^\//, ''));
        const { UploadsService } = await import('../uploads/uploads.service');
        const uploadsService = new (UploadsService as any)();
        await uploadsService.deleteFromS3(key);
      } else {
        const u = new URL(url, process.env.BACKEND_URL || 'http://localhost:3000');
        const parts = (u.pathname || '').split('/');
        const idx = parts.findIndex((p) => p === 'uploads');
        const stored = idx >= 0 ? parts[parts.length - 1] : '';
        if (stored) {
          const filePath = path.join(process.cwd(), 'uploads', stored);
          if (fs.existsSync(filePath)) await fs.promises.unlink(filePath);
        }
      }
    } catch {}
    await this.documentModel.findByIdAndDelete(id);
  }

  // Enrollment
  async enrollInCourse(courseId: string, studentId: string) {
    const resolvedCourseId = await this.resolveCourseId(courseId);
    const course = await this.courseModel.findById(resolvedCourseId);
    if (!course) throw new NotFoundException('Course not found');

    const exists = await this.enrollmentModel.findOne({ 
      courseId: resolvedCourseId, 
      studentId: new Types.ObjectId(studentId) 
    });
    if (exists) {
      if (!exists.isActive) {
        exists.isActive = true;
        await exists.save();
      }
      return { message: 'Already enrolled' };
    }

    const enrollment = await this.enrollmentModel.create({
      courseId: resolvedCourseId,
      studentId: new Types.ObjectId(studentId),
    });
    // increment enrollment count
    await this.courseModel.findByIdAndUpdate(resolvedCourseId, { $inc: { enrollmentCount: 1 } });

    // Get student and teacher info for email
    const student = await this.userModel.findById(studentId);
    const teacher = await this.userModel.findById(course.createdBy);

    // Send invitation email
    if (student && teacher) {
      try {
        await this.emailService.sendCourseInvitationEmail(
          student.email,
          student.name,
          course.title,
          teacher.name,
          courseId
        );
        console.log(`Course invitation email sent to ${student.email}`);
      } catch (error) {
        console.error('Failed to send course invitation email:', error);
        // Don't throw error, enrollment should still succeed
      }
    }

    // Emit real-time event
    const populatedEnrollment = await this.enrollmentModel
      .findById(enrollment._id)
      .populate('studentId', 'name email avatar')
      .lean();
    
    this.realtimeGateway.emitEnrollmentAdded(resolvedCourseId.toString(), populatedEnrollment);
    // Notify the student directly
    if ((populatedEnrollment as any)?.studentId?._id) {
      this.realtimeGateway.emitUserEvent((populatedEnrollment as any).studentId._id.toString(), 'enrollmentAdded', {
        courseId: resolvedCourseId.toString(),
        enrollment: populatedEnrollment,
      });
      try {
        await this.notifications.create((populatedEnrollment as any).studentId._id.toString(), 'Ghi danh khóa học', `Bạn đã được ghi danh vào ${course.title}`, { link: `/courses/${resolvedCourseId.toString()}` });
      } catch {}
    }
    // Notify the course owner (teacher)
    if (course?.createdBy) {
      this.realtimeGateway.emitUserEvent(course.createdBy.toString(), 'enrollmentAdded', {
        courseId: resolvedCourseId.toString(),
        enrollment: populatedEnrollment,
      });
      try {
        await this.notifications.create(course.createdBy.toString(), 'Học sinh ghi danh', `${(populatedEnrollment as any)?.studentId?.name || 'Học sinh'} đã ghi danh vào ${course.title}`, { link: `/teacher/courses/${resolvedCourseId.toString()}/enrollments` });
      } catch {}
    }

    return { message: 'Enrolled successfully' };
  }

  async getEnrollmentStatus(courseId: string, studentId: string) {
    const resolvedCourseId = await this.resolveCourseId(courseId);
    // Treat course owner (teacher) as enrolled
    const courseDoc = await this.courseModel.findById(resolvedCourseId).lean();
    if (courseDoc && String(courseDoc.createdBy) === String(studentId)) {
      return { enrolled: true, progress: 0, rating: undefined, review: undefined };
    }
    const enrollment = await this.enrollmentModel.findOne({ 
      courseId: resolvedCourseId, 
      studentId: new Types.ObjectId(studentId),
      isActive: true 
    }).lean();
    if (!enrollment) return { enrolled: false, progress: 0, rating: undefined, review: undefined };
    return { 
      enrolled: true, 
      progress: enrollment.progress?.percentage ?? 0,
      rating: enrollment.rating,
      review: enrollment.review
    };
  }

  async getMyEnrolled(studentId: string) {
    console.log('Getting enrolled courses for student:', studentId);
    
    // Find all active enrollments for the student
    const enrollments = await this.enrollmentModel
      .find({ 
        studentId: new Types.ObjectId(studentId),
        isActive: true 
      })
      .populate('courseId')
      .lean();

    console.log('Found enrollments:', enrollments.length);
    
    // Extract courses from enrollments
    const courses = enrollments
      .map(enrollment => enrollment.courseId)
      .filter(course => course && (course as any).status === 'published'); // Only published courses

    console.log('Filtered published courses:', courses.length);
    
    // Calculate and update ratings for each course
    for (const course of courses) {
      if (!course || !(course as any)._id) continue;
      
      const enrollmentsWithRatings = await this.enrollmentModel.find({
        courseId: (course as any)._id,
        isActive: true,
        rating: { $exists: true, $ne: null }
      }).select('rating').lean();
      
      const totalRatings = enrollmentsWithRatings.length;
      let averageRating = 0;
      if (totalRatings > 0) {
        const sumRatings = enrollmentsWithRatings.reduce((sum, e) => sum + (e.rating || 0), 0);
        averageRating = Number((sumRatings / totalRatings).toFixed(2));
      }
      
      // Update course object with calculated values
      (course as any).totalRatings = totalRatings;
      (course as any).averageRating = averageRating;
    }
    
    return { courses };
  }

  async getMyCourses(teacherId: string) {
    console.log('Getting courses created by teacher:', teacherId);
    
    const courses = await this.courseModel
      .find({ createdBy: new Types.ObjectId(teacherId) })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    console.log('Found courses:', courses.length);
    
    // Update enrollment counts and ratings for all courses
    for (const course of courses) {
      const actualEnrollmentCount = await this.enrollmentModel.countDocuments({
        courseId: course._id,
        isActive: true
      });
      
      // Calculate averageRating and totalRatings from enrollments
      const enrollmentsWithRatings = await this.enrollmentModel.find({
        courseId: course._id,
        isActive: true,
        rating: { $exists: true, $ne: null }
      }).select('rating').lean();
      
      const totalRatings = enrollmentsWithRatings.length;
      let averageRating = 0;
      if (totalRatings > 0) {
        const sumRatings = enrollmentsWithRatings.reduce((sum, e) => sum + (e.rating || 0), 0);
        averageRating = Number((sumRatings / totalRatings).toFixed(2));
      }
      
      // Update course with correct values if different
      const updates: any = {};
      if (course.enrollmentCount !== actualEnrollmentCount) {
        updates.enrollmentCount = actualEnrollmentCount;
        course.enrollmentCount = actualEnrollmentCount;
      }
      if (course.totalRatings !== totalRatings) {
        updates.totalRatings = totalRatings;
        course.totalRatings = totalRatings;
      }
      if (Math.abs((course.averageRating || 0) - averageRating) > 0.01) {
        updates.averageRating = averageRating;
        course.averageRating = averageRating;
      }
      
      if (Object.keys(updates).length > 0) {
        await this.courseModel.findByIdAndUpdate(course._id, { $set: updates });
      }
    }
    
    return { courses };
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
    const resolvedCourseId = await this.resolveCourseId(courseId);
    const lessons = await this.lessonModel
      .find({ courseId: resolvedCourseId, isPublished: true })
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
      lastAccessedAt: (enrollment as any).lastAccessedAt,
      rating: enrollment.rating,
      review: enrollment.review,
    }));
  }

  async addStudentToCourse(courseId: string, studentEmail: string, userId: string) {
    
    const course = await this.courseModel.findById(courseId);
    if (!course) throw new NotFoundException('Course not found');
    if (String(course.createdBy) !== String(userId)) throw new ForbiddenException('Not course owner');

    // Debug: Check all users with similar email
    const allUsers = await this.userModel.find({ 
      email: { $regex: studentEmail, $options: 'i' } 
    });
    console.log('🔍 Users with similar email:', allUsers.map(u => ({ 
      id: u._id, 
      email: u.email, 
      name: u.name, 
      role: u.role 
    })));

    // Find student by email (case insensitive)
    const student = await this.userModel.findOne({ 
      email: { $regex: `^${studentEmail}$`, $options: 'i' }, 
      role: 'student' 
    });
    
    console.log('🔍 Found student:', student ? {
      id: student._id,
      email: student.email,
      name: student.name,
      role: student.role
    } : 'null');

    if (!student) {
      // Try to find any user with this email (regardless of role)
      const anyUser = await this.userModel.findOne({ 
        email: { $regex: `^${studentEmail}$`, $options: 'i' } 
      });
      
      if (anyUser) {
        throw new NotFoundException(`User found but has role '${anyUser.role}', not 'student'`);
      } else {
        throw new NotFoundException('Student not found with this email');
      }
    }

    // Check if already enrolled
    const existingEnrollment = await this.enrollmentModel.findOne({
      courseId: new Types.ObjectId(courseId),
      studentId: new Types.ObjectId(student._id),
    });

    if (existingEnrollment) {
      if (existingEnrollment.isActive) {
        throw new ConflictException('Student is already enrolled in this course');
      } else {
        // Reactivate existing enrollment
        existingEnrollment.isActive = true;
        await existingEnrollment.save();
        return { message: 'Student re-enrolled successfully', enrollment: existingEnrollment };
      }
    }

    // Create new enrollment
    const enrollment = await this.enrollmentModel.create({
      courseId: new Types.ObjectId(courseId),
      studentId: new Types.ObjectId(student._id),
    });

    // Increment enrollment count
    await this.courseModel.findByIdAndUpdate(courseId, { $inc: { enrollmentCount: 1 } });

    // Get teacher info for email
    const teacher = await this.userModel.findById(userId);

    // Send invitation email
    if (teacher) {
      try {
        await this.emailService.sendCourseInvitationEmail(
          student.email,
          student.name,
          course.title,
          teacher.name,
          courseId
        );
        console.log(`Course invitation email sent to ${student.email}`);
      } catch (error) {
        console.error('Failed to send course invitation email:', error);
        // Don't throw error, enrollment should still succeed
      }
    }

    // Emit real-time event
    const populatedEnrollment = await this.enrollmentModel
      .findById(enrollment._id)
      .populate('studentId', 'name email avatar')
      .lean();
    
    this.realtimeGateway.emitEnrollmentAdded(courseId, populatedEnrollment);

    return { message: 'Student enrolled successfully', enrollment: populatedEnrollment };
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
    // Notify the student directly
    this.realtimeGateway.emitUserEvent(studentId.toString(), 'enrollmentRemoved', { courseId, studentId });
    // Notify the course owner (teacher)
    if (course?.createdBy) {
      this.realtimeGateway.emitUserEvent(course.createdBy.toString(), 'enrollmentRemoved', { courseId, studentId });
    }
    try {
      await this.notifications.create(studentId.toString(), 'Hủy ghi danh khóa học', `Bạn đã bị hủy ghi danh khỏi ${course.title}`, { link: `/courses/${courseId}` });
      if (course?.createdBy) {
        await this.notifications.create(course.createdBy.toString(), 'Hủy ghi danh', `Một học sinh đã bị hủy ghi danh khỏi ${course.title}`, { link: `/teacher/courses/${courseId}/enrollments` });
      }
    } catch {}

    return { message: 'Student removed from course successfully' };
  }

  async fixEnrollmentCounts(): Promise<any> {
    
    const courses = await this.courseModel.find({});
    const results = [];

    for (const course of courses) {
      console.log(`📚 Processing course: ${course.title} (${course._id})`);
      
      // Count active enrollments for this course
      const activeEnrollmentsCount = await this.enrollmentModel.countDocuments({
        courseId: new Types.ObjectId(course._id.toString()),
        isActive: true
      });

      console.log(`  Current enrollmentCount in DB: ${course.enrollmentCount || 0}`);
      console.log(`  Actual active enrollments: ${activeEnrollmentsCount}`);

      // Update the course with correct count
      if (course.enrollmentCount !== activeEnrollmentsCount) {
        await this.courseModel.findByIdAndUpdate(
          course._id.toString(),
          { $set: { enrollmentCount: activeEnrollmentsCount } }
        );
        console.log(`  ✅ Updated enrollmentCount from ${course.enrollmentCount || 0} to ${activeEnrollmentsCount}`);
        results.push({
          courseId: course._id,
          courseTitle: course.title,
          oldCount: course.enrollmentCount || 0,
          newCount: activeEnrollmentsCount
        });
      } else {
        console.log(`  ✅ Count is already correct`);
      }
    }

    console.log('🎉 All enrollment counts have been fixed!');
    return {
      message: 'Enrollment counts fixed successfully',
      results: results,
      totalCourses: courses.length,
      fixedCourses: results.length
    };
  }
}
