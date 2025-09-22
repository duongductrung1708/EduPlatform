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

@Injectable()
export class CoursesService {
  constructor(
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    @InjectModel(DocumentFile.name) private documentModel: Model<DocumentFileDocument>,
    @InjectModel(CourseEnrollment.name) private enrollmentModel: Model<CourseEnrollmentDocument>,
    @InjectModel(Lesson.name) private lessonModel: Model<LessonDocument>,
    @InjectModel(CourseModule.name) private moduleModel: Model<ModuleDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private realtimeGateway: RealtimeGateway,
    private emailService: EmailService,
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

  async updateModule(courseId: string, moduleId: string, userId: string, payload: {
    title?: string;
    description?: string;
    order?: number;
    volume?: string;
    estimatedDuration?: number;
    isPublished?: boolean;
  }) {
    const course = await this.courseModel.findById(courseId);
    if (!course) throw new NotFoundException('Course not found');
    if (String(course.createdBy) !== String(userId)) throw new ForbiddenException('Not course owner');

    // Try to find module by ID first
    const module = await this.moduleModel.findById(moduleId);
    
    if (!module) {
      throw new NotFoundException('Module not found');
    }
    
    // Check if module belongs to the course
    if (String(module.courseId) !== String(courseId)) {
      throw new NotFoundException('Module does not belong to this course');
    }

    Object.assign(module, payload);
    return module.save();
  }

  async deleteModule(courseId: string, moduleId: string, userId: string) {
    
    const course = await this.courseModel.findById(courseId);
    if (!course) throw new NotFoundException('Course not found');
    if (String(course.createdBy) !== String(userId)) throw new ForbiddenException('Not course owner');

    // Check if module exists at all
    const moduleExists = await this.moduleModel.findById(moduleId);
    console.log('📋 Module exists:', moduleExists ? 'Yes' : 'No');
    if (moduleExists) {
      console.log('📋 Module details:', {
        _id: moduleExists._id,
        title: moduleExists.title,
        courseId: moduleExists.courseId
      });
    }
    if (!moduleExists) {
      console.log('📋 Module not found in database');
      throw new NotFoundException('Module not found');
    }

    // Check if module belongs to this course
    const module = await this.moduleModel.findOne({ 
      _id: new Types.ObjectId(moduleId), 
      courseId: new Types.ObjectId(courseId) 
    });
    console.log('📋 Found module in course:', module ? 'Yes' : 'No', module ? `Title: ${module.title}` : '');
    if (!module) {
      console.log('📋 Module exists but belongs to different course');
      console.log('📋 Expected courseId:', courseId);
      console.log('📋 Actual courseId:', moduleExists.courseId);
      throw new NotFoundException('Module not found in this course');
    }

    // Delete all lessons in this module first
    const deletedLessons = await this.lessonModel.deleteMany({ moduleId: new Types.ObjectId(moduleId) });
    console.log('🗑️ Deleted lessons count:', deletedLessons.deletedCount);
    
    // Delete the module
    const deletedModule = await this.moduleModel.findByIdAndDelete(moduleId);
    console.log('🗑️ Deleted module:', deletedModule ? 'Yes' : 'No');
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
    if (lessonExists) {
      console.log('📄 Lesson details:', {
        _id: lessonExists._id,
        title: lessonExists.title,
        moduleId: lessonExists.moduleId
      });
    }
    if (!lessonExists) {
      console.log('📄 Lesson not found in database');
      throw new NotFoundException('Lesson not found');
    }

    // Check if lesson belongs to this module
    const lesson = await this.lessonModel.findOne({ 
      _id: new Types.ObjectId(lessonId), 
      moduleId: new Types.ObjectId(moduleId) 
    });
    console.log('📄 Found lesson in module:', lesson ? 'Yes' : 'No', lesson ? `Title: ${lesson.title}` : '');
    if (!lesson) {
      console.log('📄 Lesson exists but belongs to different module');
      console.log('📄 Expected moduleId:', moduleId);
      console.log('📄 Actual moduleId:', lessonExists.moduleId);
      throw new NotFoundException('Lesson not found in this module');
    }

    const deletedLesson = await this.lessonModel.findByIdAndDelete(lessonId);
    console.log('🗑️ Deleted lesson:', deletedLesson ? 'Yes' : 'No');
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

    // Update enrollment counts for all courses
    for (const course of courses) {
      const actualEnrollmentCount = await this.enrollmentModel.countDocuments({
        courseId: course._id,
        isActive: true
      });
      
      if (course.enrollmentCount !== actualEnrollmentCount) {
        course.enrollmentCount = actualEnrollmentCount;
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
    const course = await this.courseModel.findById(id).populate('createdBy', 'name email');
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
    
    this.realtimeGateway.emitEnrollmentAdded(courseId, populatedEnrollment);
    // Notify the student directly
    if ((populatedEnrollment as any)?.studentId?._id) {
      this.realtimeGateway.emitUserEvent((populatedEnrollment as any).studentId._id.toString(), 'enrollmentAdded', {
        courseId,
        enrollment: populatedEnrollment,
      });
    }
    // Notify the course owner (teacher)
    if (course?.createdBy) {
      this.realtimeGateway.emitUserEvent(course.createdBy.toString(), 'enrollmentAdded', {
        courseId,
        enrollment: populatedEnrollment,
      });
    }

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
    
    // Update enrollment counts for all courses
    for (const course of courses) {
      const actualEnrollmentCount = await this.enrollmentModel.countDocuments({
        courseId: course._id,
        isActive: true
      });
      
      if (course.enrollmentCount !== actualEnrollmentCount) {
        await this.courseModel.findByIdAndUpdate(course._id, { 
          $set: { enrollmentCount: actualEnrollmentCount } 
        });
        course.enrollmentCount = actualEnrollmentCount;
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
