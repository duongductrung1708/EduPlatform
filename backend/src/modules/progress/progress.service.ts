import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CourseEnrollment, CourseEnrollmentDocument } from '../../models/course-enrollment.model';
import { UserBadge, UserBadgeDocument } from '../../models/user-badge.model';
import { Badge, BadgeDocument } from '../../models/badge.model';
import { Module, ModuleDocument } from '../../models/module.model';
import { Lesson, LessonDocument } from '../../models/lesson.model';

@Injectable()
export class ProgressService {
  constructor(
    @InjectModel(CourseEnrollment.name)
    private enrollmentModel: Model<CourseEnrollmentDocument>,
    @InjectModel(UserBadge.name)
    private userBadgeModel: Model<UserBadgeDocument>,
    @InjectModel(Badge.name)
    private badgeModel: Model<BadgeDocument>,
    @InjectModel(Module.name)
    private moduleModel: Model<ModuleDocument>,
    @InjectModel(Lesson.name)
    private lessonModel: Model<LessonDocument>,
  ) {}

  async enrollInCourse(studentId: string, courseId: string) {
    const existingEnrollment = await this.enrollmentModel.findOne({
      studentId: new Types.ObjectId(studentId),
      courseId: new Types.ObjectId(courseId),
    });

    if (existingEnrollment) {
      throw new Error('Student is already enrolled in this course');
    }

    // Get course modules and lessons for progress calculation
    const modules = await this.moduleModel.find({ courseId: new Types.ObjectId(courseId) });
    const totalModules = modules.length;
    const totalLessons = await this.lessonModel.countDocuments({
      moduleId: { $in: modules.map(m => m._id) }
    });

    const enrollment = new this.enrollmentModel({
      studentId: new Types.ObjectId(studentId),
      courseId: new Types.ObjectId(courseId),
      progress: {
        completedLessons: [],
        completedModules: [],
        totalLessons,
        totalModules,
        percentage: 0,
      },
    });

    return await enrollment.save();
  }

  async checkEnrollment(studentId: string, courseId: string) {
    const enrollment = await this.enrollmentModel.findOne({
      studentId: new Types.ObjectId(studentId),
      courseId: new Types.ObjectId(courseId),
    });

    if (!enrollment) {
      return { enrolled: false, progress: 0 };
    }

    return {
      enrolled: true,
      progress: enrollment.progress.percentage,
    };
  }

  async completeLesson(studentId: string, lessonId: string) {
    const lesson = await this.lessonModel.findById(lessonId).populate('moduleId');
    if (!lesson) {
      throw new Error('Lesson not found');
    }

    const courseId = (lesson.moduleId as any).courseId;
    const enrollment = await this.enrollmentModel.findOne({
      studentId: new Types.ObjectId(studentId),
      courseId: new Types.ObjectId(courseId),
    });

    if (!enrollment) {
      throw new Error('Student is not enrolled in this course');
    }

    // Check if lesson is already completed
    if (enrollment.progress.completedLessons.includes(new Types.ObjectId(lessonId))) {
      return { message: 'Lesson already completed' };
    }

    // Add lesson to completed lessons
    enrollment.progress.completedLessons.push(new Types.ObjectId(lessonId));

    // Check if module is completed
    const moduleId = lesson.moduleId._id;
    const moduleLessons = await this.lessonModel.find({ moduleId });
    const completedModuleLessons = enrollment.progress.completedLessons.filter(
      completedLessonId => moduleLessons.some(ml => ml._id.equals(completedLessonId))
    );

    if (completedModuleLessons.length === moduleLessons.length) {
      if (!enrollment.progress.completedModules.includes(moduleId)) {
        enrollment.progress.completedModules.push(moduleId);
      }
    }

    // Update progress percentage
    const totalLessons = enrollment.progress.totalLessons;
    const completedLessons = enrollment.progress.completedLessons.length;
    enrollment.progress.percentage = Math.round((completedLessons / totalLessons) * 100);

    // Check if course is completed
    if (enrollment.progress.percentage === 100 && !enrollment.completedAt) {
      enrollment.completedAt = new Date();
      await this.checkAndAwardBadges(studentId, courseId.toString());
    }

    await enrollment.save();
    return { message: 'Lesson completed successfully' };
  }

  async rateCourse(studentId: string, courseId: string, rating: number, review?: string) {
    const enrollment = await this.enrollmentModel.findOne({
      studentId: new Types.ObjectId(studentId),
      courseId: new Types.ObjectId(courseId),
    });

    if (!enrollment) {
      throw new Error('Student is not enrolled in this course');
    }

    enrollment.rating = rating;
    if (review) {
      enrollment.review = review;
    }

    await enrollment.save();
    return { message: 'Course rated successfully' };
  }

  async getStudentProgress(studentId: string) {
    const enrollments = await this.enrollmentModel
      .find({ studentId: new Types.ObjectId(studentId) })
      .populate('courseId', 'title slug thumbnail')
      .sort({ enrolledAt: -1 });

    return enrollments.map(enrollment => ({
      courseId: enrollment.courseId,
      enrolledAt: enrollment.enrolledAt,
      completedAt: enrollment.completedAt,
      progress: enrollment.progress,
      rating: enrollment.rating,
      review: enrollment.review,
    }));
  }

  async getStudentBadges(studentId: string) {
    const userBadges = await this.userBadgeModel
      .find({ userId: new Types.ObjectId(studentId) })
      .populate('badgeId')
      .populate('courseId', 'title slug')
      .sort({ earnedAt: -1 });

    return userBadges.map(userBadge => ({
      badge: userBadge.badgeId,
      earnedAt: userBadge.earnedAt,
      course: userBadge.courseId,
      metadata: userBadge.metadata,
    }));
  }

  private async checkAndAwardBadges(studentId: string, courseId: string) {
    const badges = await this.badgeModel.find({
      'criteria.kind': 'course_completion',
      'criteria.courseId': new Types.ObjectId(courseId),
      isActive: true,
    });

    for (const badge of badges) {
      // Check if student already has this badge
      const existingBadge = await this.userBadgeModel.findOne({
        userId: new Types.ObjectId(studentId),
        badgeId: badge._id,
      });

      if (!existingBadge) {
        // Award the badge
        const userBadge = new this.userBadgeModel({
          userId: new Types.ObjectId(studentId),
          badgeId: badge._id,
          courseId: new Types.ObjectId(courseId),
          earnedAt: new Date(),
          metadata: {
            courseCompleted: true,
            completedAt: new Date(),
          },
        });

        await userBadge.save();
      }
    }
  }

  async createBadge(badgeData: {
    name: string;
    description: string;
    icon: string;
    color: string;
    criteria: {
      kind: 'course_completion' | 'quiz_perfect' | 'streak' | 'custom';
      courseId?: string;
      requiredScore?: number;
      requiredStreak?: number;
      customCondition?: string;
    };
  }) {
    const badge = new this.badgeModel({
      ...badgeData,
      criteria: {
        ...badgeData.criteria,
        courseId: badgeData.criteria.courseId ? new Types.ObjectId(badgeData.criteria.courseId) : undefined,
      },
    });

    return await badge.save();
  }

  async getBadges() {
    return await this.badgeModel.find({ isActive: true }).sort({ createdAt: -1 });
  }
}
