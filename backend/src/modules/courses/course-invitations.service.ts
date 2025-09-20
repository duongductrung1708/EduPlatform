import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CourseInvitation, CourseInvitationDocument } from '../../models/course-invitation.model';
import { Course, CourseDocument } from '../../models/course.model';
import { User, UserDocument } from '../../models/user.model';
import { CourseEnrollment, CourseEnrollmentDocument } from '../../models/course-enrollment.model';
import { EmailService } from '../email/email.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class CourseInvitationsService {
  constructor(
    @InjectModel(CourseInvitation.name) private invitationModel: Model<CourseInvitationDocument>,
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(CourseEnrollment.name) private enrollmentModel: Model<CourseEnrollmentDocument>,
    private emailService: EmailService,
    private realtimeGateway: RealtimeGateway,
  ) {}

  async createInvitation(
    courseId: string,
    studentEmail: string,
    teacherId: string,
    message?: string
  ): Promise<CourseInvitation> {
    // Find course and verify teacher ownership
    const course = await this.courseModel.findById(courseId);
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    if (String(course.createdBy) !== String(teacherId)) {
      throw new ForbiddenException('Not course owner');
    }

    // Find student by email
    const student = await this.userModel.findOne({ 
      email: { $regex: `^${studentEmail}$`, $options: 'i' }, 
      role: 'student' 
    });
    
    if (!student) {
      throw new NotFoundException('Student not found with this email');
    }

    // Check if student is already enrolled (only active enrollments)
    const existingEnrollment = await this.enrollmentModel.findOne({
      courseId: new Types.ObjectId(courseId),
      studentId: student._id,
      isActive: true
    });

    if (existingEnrollment) {
      throw new BadRequestException('Student is already enrolled in this course');
    }

    // Check if there's already a pending invitation
    const existingPendingInvitation = await this.invitationModel.findOne({
      courseId: new Types.ObjectId(courseId),
      studentId: student._id,
      status: 'pending'
    });

    if (existingPendingInvitation) {
      throw new BadRequestException('Student already has a pending invitation for this course');
    }

    // Cancel any old invitations (expired, declined) to allow new invitation
    await this.invitationModel.updateMany(
      {
        courseId: new Types.ObjectId(courseId),
        studentId: student._id,
        status: { $in: ['expired', 'declined'] }
      },
      {
        $set: { 
          status: 'declined',
          declinedAt: new Date()
        }
      }
    );

    // Get teacher info
    const teacher = await this.userModel.findById(teacherId);

    // Create invitation
    const invitation = new this.invitationModel({
      courseId: new Types.ObjectId(courseId),
      studentId: student._id,
      teacherId: new Types.ObjectId(teacherId),
      studentEmail: student.email,
      courseTitle: course.title,
      teacherName: teacher?.name || 'Unknown Teacher',
      message,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    });

    const savedInvitation = await invitation.save();

    // Send invitation email
    if (teacher) {
      try {
        await this.emailService.sendCourseInvitationEmail(
          student.email,
          student.name,
          course.title,
          teacher.name,
          courseId,
          savedInvitation._id.toString()
        );
        console.log(`Course invitation email sent to ${student.email}`);
      } catch (error) {
        console.error('Failed to send course invitation email:', error);
        // Don't throw error, invitation should still be created
      }
    }

    // Emit real-time notification
    this.realtimeGateway.emitCourseInvitationCreated(student._id.toString(), {
      invitationId: savedInvitation._id.toString(),
      courseTitle: course.title,
      teacherName: teacher?.name || 'Unknown Teacher',
      message
    });

    return savedInvitation;
  }

  async getStudentInvitations(studentId: string): Promise<CourseInvitation[]> {
    return this.invitationModel
      .find({ studentId: new Types.ObjectId(studentId), status: 'pending' })
      .populate('courseId', 'title description category level')
      .populate('teacherId', 'name email')
      .sort({ createdAt: -1 });
  }

  async acceptInvitation(invitationId: string, studentId: string): Promise<any> {
    const invitation = await this.invitationModel.findById(invitationId);
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (String(invitation.studentId) !== String(studentId)) {
      throw new ForbiddenException('Not authorized to accept this invitation');
    }

    if (invitation.status !== 'pending') {
      throw new BadRequestException('Invitation is no longer pending');
    }

    if (invitation.expiresAt < new Date()) {
      throw new BadRequestException('Invitation has expired');
    }

    // Check if student is already enrolled (only active enrollments)
    const existingEnrollment = await this.enrollmentModel.findOne({
      courseId: invitation.courseId,
      studentId: invitation.studentId,
      isActive: true
    });

    if (existingEnrollment) {
      throw new BadRequestException('Student is already enrolled in this course');
    }

    // Check if there's an inactive enrollment to reactivate
    const inactiveEnrollment = await this.enrollmentModel.findOne({
      courseId: invitation.courseId,
      studentId: invitation.studentId,
      isActive: false
    });

    let enrollment;
    let shouldIncrementCount = false;
    
    if (inactiveEnrollment) {
      // Reactivate existing enrollment
      inactiveEnrollment.isActive = true;
      inactiveEnrollment.enrolledAt = new Date();
      await inactiveEnrollment.save();
      enrollment = inactiveEnrollment;
      shouldIncrementCount = true; // Need to increment count when reactivating
    } else {
      // Create new enrollment
      enrollment = new this.enrollmentModel({
        courseId: invitation.courseId,
        studentId: invitation.studentId,
        enrolledAt: new Date(),
        progress: 0,
        isActive: true
      });
      await enrollment.save();
      shouldIncrementCount = true; // Need to increment count for new enrollment
    }

    // Increment enrollment count
    if (shouldIncrementCount) {
      await this.courseModel.findByIdAndUpdate(invitation.courseId, { $inc: { enrollmentCount: 1 } });
    }

    // Update invitation status
    invitation.status = 'accepted';
    invitation.acceptedAt = new Date();
    await invitation.save();

    // Emit real-time event
    this.realtimeGateway.emitCourseEnrollmentAdded(invitation.courseId.toString(), {
      studentId: invitation.studentId.toString(),
      courseId: invitation.courseId.toString()
    });

    return {
      message: 'Invitation accepted successfully',
      enrollment: enrollment
    };
  }

  async declineInvitation(invitationId: string, studentId: string): Promise<any> {
    const invitation = await this.invitationModel.findById(invitationId);
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (String(invitation.studentId) !== String(studentId)) {
      throw new ForbiddenException('Not authorized to decline this invitation');
    }

    if (invitation.status !== 'pending') {
      throw new BadRequestException('Invitation is no longer pending');
    }

    // Update invitation status
    invitation.status = 'declined';
    invitation.declinedAt = new Date();
    await invitation.save();

    return {
      message: 'Invitation declined successfully'
    };
  }

  async getTeacherInvitations(teacherId: string): Promise<CourseInvitation[]> {
    return this.invitationModel
      .find({ teacherId: new Types.ObjectId(teacherId) })
      .populate('courseId', 'title description')
      .populate('studentId', 'name email')
      .sort({ createdAt: -1 });
  }

  async cancelInvitation(invitationId: string, teacherId: string): Promise<any> {
    const invitation = await this.invitationModel.findById(invitationId);
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (String(invitation.teacherId) !== String(teacherId)) {
      throw new ForbiddenException('Not authorized to cancel this invitation');
    }

    if (invitation.status !== 'pending') {
      throw new BadRequestException('Invitation is no longer pending');
    }

    // Update invitation status
    invitation.status = 'declined';
    invitation.declinedAt = new Date();
    await invitation.save();

    return {
      message: 'Invitation cancelled successfully'
    };
  }

  async getInvitationById(invitationId: string): Promise<CourseInvitation> {
    const invitation = await this.invitationModel
      .findById(invitationId)
      .populate('courseId', 'title description category level')
      .populate('teacherId', 'name email')
      .populate('studentId', 'name email');
    
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    return invitation;
  }
}
