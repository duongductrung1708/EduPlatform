import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Assignment, AssignmentDocument } from '../../models/assignment.model';
import { Submission, SubmissionDocument } from '../../models/assignment.model';
import { Classroom, ClassroomDocument } from '../../models/classroom.model';
import { CreateAssignmentDto, UpdateAssignmentDto, CreateSubmissionDto, GradeSubmissionDto } from './dto/assignment.dto';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AssignmentsService {
  constructor(
    @InjectModel(Assignment.name) private assignmentModel: Model<AssignmentDocument>,
    @InjectModel(Submission.name) private submissionModel: Model<SubmissionDocument>,
    @InjectModel(Classroom.name) private classroomModel: Model<ClassroomDocument>,
    private realtimeGateway: RealtimeGateway,
    private notifications: NotificationsService,
  ) {}

  async create(classroomId: string, createAssignmentDto: CreateAssignmentDto, createdBy: string): Promise<AssignmentDocument> {
    // Check if classroom exists and user has access
    const classroom = await this.classroomModel.findOne({
      _id: classroomId,
      $or: [
        { teacherIds: new Types.ObjectId(createdBy) },
        { assistantIds: new Types.ObjectId(createdBy) },
        // Legacy support
        { teacherId: new Types.ObjectId(createdBy) },
      ],
    });

    if (!classroom) {
      throw new ForbiddenException('Access denied to this classroom');
    }

    const assignment = new this.assignmentModel({
      ...createAssignmentDto,
      classroomId: new Types.ObjectId(classroomId),
      createdBy: new Types.ObjectId(createdBy),
      dueDate: createAssignmentDto.dueDate ? new Date(createAssignmentDto.dueDate) : undefined,
    });

    return assignment.save();
  }

  async findAll(classroomId: string, userId: string) {
    // Check if user has access to classroom
    const classroom = await this.classroomModel.findOne({
      _id: classroomId,
      $or: [
        { teacherIds: new Types.ObjectId(userId) },
        { assistantIds: new Types.ObjectId(userId) },
        { studentIds: new Types.ObjectId(userId) },
        // Legacy support
        { teacherId: new Types.ObjectId(userId) },
        { students: new Types.ObjectId(userId) },
      ],
    });

    if (!classroom) {
      throw new ForbiddenException('Access denied to this classroom');
    }

    return this.assignmentModel
      .find({ classroomId: new Types.ObjectId(classroomId) })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email')
      .exec();
  }

  async findOne(id: string, userId: string): Promise<AssignmentDocument> {
    const assignment = await this.assignmentModel
      .findById(id)
      .populate('createdBy', 'name email')
      .populate('classroomId', 'title');

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    // Check if user has access to the classroom
    const classroom = await this.classroomModel.findOne({
      _id: assignment.classroomId,
      $or: [
        { teacherIds: new Types.ObjectId(userId) },
        { assistantIds: new Types.ObjectId(userId) },
        { studentIds: new Types.ObjectId(userId) },
        // Legacy support
        { teacherId: new Types.ObjectId(userId) },
        { students: new Types.ObjectId(userId) },
      ],
    });

    if (!classroom) {
      throw new ForbiddenException('Access denied to this assignment');
    }

    return assignment;
  }

  async update(id: string, updateAssignmentDto: UpdateAssignmentDto, userId: string): Promise<AssignmentDocument> {
    const assignment = await this.assignmentModel.findById(id);
    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    // Check if user is teacher/assistant of the classroom
    const classroom = await this.classroomModel.findOne({
      _id: assignment.classroomId,
      $or: [
        { teacherIds: new Types.ObjectId(userId) },
        { assistantIds: new Types.ObjectId(userId) },
        // Legacy support
        { teacherId: new Types.ObjectId(userId) },
      ],
    });

    if (!classroom) {
      throw new ForbiddenException('Access denied to update this assignment');
    }

    const updateData: any = { ...updateAssignmentDto };
    if (updateAssignmentDto.dueDate) {
      updateData.dueDate = new Date(updateAssignmentDto.dueDate);
    }

    const updatedAssignment = await this.assignmentModel
      .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .populate('createdBy', 'name email');

    return updatedAssignment!;
  }

  async remove(id: string, userId: string): Promise<void> {
    const assignment = await this.assignmentModel.findById(id);
    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    // Check if user is teacher/assistant of the classroom
    const classroom = await this.classroomModel.findOne({
      _id: assignment.classroomId,
      $or: [
        { teacherIds: new Types.ObjectId(userId) },
        { assistantIds: new Types.ObjectId(userId) },
      ],
    });

    if (!classroom) {
      throw new ForbiddenException('Access denied to delete this assignment');
    }

    await this.assignmentModel.findByIdAndDelete(id);
  }

  // Submission methods
  async createSubmission(assignmentId: string, createSubmissionDto: CreateSubmissionDto, studentId: string): Promise<SubmissionDocument> {
    const assignment = await this.assignmentModel.findById(assignmentId);
    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    // Check if student is in the classroom
    const classroom = await this.classroomModel.findOne({
      _id: assignment.classroomId,
      $or: [
        { studentIds: new Types.ObjectId(studentId) },
        // Legacy support
        { students: new Types.ObjectId(studentId) },
      ],
    });

    if (!classroom) {
      throw new ForbiddenException('Access denied to submit this assignment');
    }

    // Check if submission already exists
    const existingSubmission = await this.submissionModel.findOne({
      assignmentId: new Types.ObjectId(assignmentId),
      studentId: new Types.ObjectId(studentId),
    });

    if (existingSubmission) {
      throw new ConflictException('Submission already exists');
    }

    const submission = new this.submissionModel({
      ...createSubmissionDto,
      assignmentId: new Types.ObjectId(assignmentId),
      studentId: new Types.ObjectId(studentId),
    });

    const saved = await submission.save();
    // Emit realtime event for teachers in this classroom
    try {
      this.realtimeGateway.server
        .to(`classroom:${(assignment.classroomId as any).toString()}`)
        .emit('submissionCreated', {
          assignmentId: (assignment._id as any).toString(),
          classroomId: (assignment.classroomId as any).toString(),
          studentId,
          submittedAt: saved.submittedAt || new Date().toISOString(),
        });
    } catch {}
    return saved;
  }

  async getSubmissions(assignmentId: string, userId: string) {
    const assignment = await this.assignmentModel.findById(assignmentId);
    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    // Check if user is teacher/assistant of the classroom
    const classroom = await this.classroomModel.findOne({
      _id: assignment.classroomId,
      $or: [
        { teacherIds: new Types.ObjectId(userId) },
        { assistantIds: new Types.ObjectId(userId) },
        // Legacy support
        { teacherId: new Types.ObjectId(userId) },
      ],
    });

    if (!classroom) {
      throw new ForbiddenException('Access denied to view submissions');
    }

    return this.submissionModel
      .find({ assignmentId: new Types.ObjectId(assignmentId) })
      .populate('studentId', 'name email')
      .sort({ submittedAt: -1 })
      .exec();
  }

  async getMySubmission(assignmentId: string, studentId: string): Promise<SubmissionDocument | null> {
    return this.submissionModel
      .findOne({
        assignmentId: new Types.ObjectId(assignmentId),
        studentId: new Types.ObjectId(studentId),
      })
      .exec();
  }

  async gradeSubmission(submissionId: string, gradeSubmissionDto: GradeSubmissionDto, userId: string): Promise<SubmissionDocument> {
    const submission = await this.submissionModel.findById(submissionId);
    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    const assignment = await this.assignmentModel.findById(submission.assignmentId);
    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    // Check if user is teacher/assistant of the classroom
    const classroom = await this.classroomModel.findOne({
      _id: assignment.classroomId,
      $or: [
        { teacherIds: new Types.ObjectId(userId) },
        { assistantIds: new Types.ObjectId(userId) },
      ],
    });

    if (!classroom) {
      throw new ForbiddenException('Access denied to grade this submission');
    }

    const updatedSubmission = await this.submissionModel
      .findByIdAndUpdate(
        submissionId,
        {
          ...gradeSubmissionDto,
          graded: true,
        },
        { new: true, runValidators: true }
      )
      .populate('studentId', 'name email');

    // Emit realtime event to classroom room so student(s) get updates immediately
    try {
      this.realtimeGateway.server
        .to(`classroom:${(assignment.classroomId as any).toString()}`)
        .emit('submissionGraded', {
          assignmentId: (assignment._id as any).toString(),
          submissionId,
          studentId: (updatedSubmission!.studentId as any)._id || updatedSubmission!.studentId,
          grade: updatedSubmission!.grade,
          feedback: updatedSubmission!.feedback,
          graded: true,
        });
      // Persist notification for the student
      try {
        const studentId = String((updatedSubmission!.studentId as any)._id || updatedSubmission!.studentId);
        await this.notifications.create(
          studentId,
          'Bài tập đã được chấm',
          `Bạn đã được chấm điểm cho một bài tập` ,
          { link: `/classrooms/${(assignment.classroomId as any).toString()}/assignments/${(assignment._id as any).toString()}` }
        );
      } catch {}
    } catch {}

    return updatedSubmission!;
  }
}
