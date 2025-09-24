import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Classroom, ClassroomDocument } from '../../models/classroom.model';
import * as path from 'path';
import * as fs from 'fs';
import { Course, CourseDocument } from '../../models/course.model';
import { Assignment, AssignmentDocument } from '../../models/assignment.model';
import { User, UserDocument } from '../../models/user.model';
import { CreateClassroomDto, UpdateClassroomDto, JoinClassroomDto } from './dto/classroom.dto';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ClassroomsService {
  constructor(
    @InjectModel(Classroom.name) private classroomModel: Model<ClassroomDocument>,
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Assignment.name) private assignmentModel: Model<AssignmentDocument>,
    private realtimeGateway: RealtimeGateway,
    private emailService: EmailService,
    private notifications: NotificationsService,
  ) {}

  async create(createClassroomDto: CreateClassroomDto, createdBy: string): Promise<ClassroomDocument> {
    const { courseId, teacherIds = [], assistantIds = [], startDate, endDate, timezone, ...rest } = createClassroomDto;

    // Validate course if provided
    if (courseId) {
      const course = await this.courseModel.findById(courseId);
      if (!course) {
        throw new NotFoundException('Course not found');
      }
    }

    // Validate teachers and assistants
    const allUserIds = [...teacherIds, ...assistantIds];
    if (allUserIds.length > 0) {
      const users = await this.userModel.find({ _id: { $in: allUserIds } });
      if (users.length !== allUserIds.length) {
        throw new BadRequestException('Some users not found');
      }
    }

    // Generate unique invite code
    const inviteCode = await this.generateUniqueInviteCode();

    // Ensure the creator is included as a teacher by default
    const finalTeacherIds = (teacherIds && teacherIds.length > 0)
      ? teacherIds
      : [createdBy];

    const classroom = new this.classroomModel({
      ...rest,
      courseId: courseId ? new Types.ObjectId(courseId) : undefined,
      teacherIds: finalTeacherIds.map(id => new Types.ObjectId(id)),
      assistantIds: assistantIds.map(id => new Types.ObjectId(id)),
      inviteCode,
      schedule: startDate ? {
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : undefined,
        timezone: timezone || 'Asia/Ho_Chi_Minh',
      } : undefined,
    });

    return classroom.save();
  }

  async findAll(page = 1, limit = 10, userId?: string) {
    const query: any = {};
    
    if (userId) {
      // Support both current schema (teacherIds/assistantIds/studentIds) and legacy schema (teacherId/students)
      query.$or = [
        { teacherIds: new Types.ObjectId(userId) },
        { assistantIds: new Types.ObjectId(userId) },
        { studentIds: new Types.ObjectId(userId) },
        // Legacy fields fallback
        { teacherId: new Types.ObjectId(userId) },
        { students: new Types.ObjectId(userId) },
      ];
    }

    const skip = (page - 1) * limit;

    const [classrooms, total] = await Promise.all([
      this.classroomModel
        .find(query)
        .skip(skip)
        .limit(limit)
        .populate('courseId', 'title slug')
        .populate('teacherIds', 'name email')
        .populate('assistantIds', 'name email')
        .populate('studentIds', 'name email')
        .lean()
        .exec(),
      this.classroomModel.countDocuments(query),
    ]);

    // compute assignments count
    const countsMap: Record<string, number> = {};
    await Promise.all(
      classrooms.map(async (c) => {
        const cid = (c._id as any).toString();
        try {
          countsMap[cid] = await this.assignmentModel.countDocuments({ classroomId: c._id });
        } catch {
          countsMap[cid] = 0;
        }
      })
    );

    // compute students count with legacy fallback using aggregation for accuracy
    const studentCountsAgg = await this.classroomModel.aggregate([
      { $match: { _id: { $in: classrooms.map((c) => c._id) } } },
      {
        $project: {
          _id: 1,
          studentsCount: {
            $cond: [
              { $gt: [{ $size: { $ifNull: ['$studentIds', []] } }, 0] },
              { $size: { $ifNull: ['$studentIds', []] } },
              { $size: { $ifNull: ['$students', []] } },
            ],
          },
        },
      },
    ]);
    const studentsCountsMap: Record<string, number> = {};
    for (const row of studentCountsAgg) {
      studentsCountsMap[(row._id as any).toString()] = row.studentsCount || 0;
    }

    // Gather teacher user lookups needed (legacy teacherId and any unpopulated teacherIds)
    const teacherIdSet = new Set<string>();
    classrooms.forEach((c: any) => {
      if (c.teacherId) teacherIdSet.add(String(c.teacherId));
      if (Array.isArray(c.teacherIds)) {
        c.teacherIds.forEach((tid: any) => {
          if (typeof tid === 'string' || (tid && typeof tid === 'object' && !('name' in tid))) {
            teacherIdSet.add(String(tid));
          }
        });
      }
    });
    const teacherUsers = teacherIdSet.size
      ? await this.userModel.find({ _id: { $in: Array.from(teacherIdSet) } }).select('name email').lean()
      : [];
    const teacherUserMap = new Map<string, any>(teacherUsers.map((u: any) => [String(u._id), { _id: String(u._id), name: u.name, email: u.email }]));

    return {
      classrooms: classrooms.map((base: any) => {
        // Normalize title
        base.title = base.title || base.name || '';
        // Inject legacy teacher into teacherIds if empty
        // Ensure teacherIds is an array of user objects
        if (!Array.isArray(base.teacherIds)) base.teacherIds = [];
        base.teacherIds = base.teacherIds.map((tid: any) => {
          if (tid && typeof tid === 'object' && ('name' in tid)) return tid;
          const t = teacherUserMap.get(String(tid));
          return t || tid;
        });
        if (base.teacherIds.length === 0 && base.teacherId) {
          const t = teacherUserMap.get(String(base.teacherId));
          if (t) base.teacherIds = [t];
        }
        // Build teacherNames for simpler frontend rendering
        const teacherNames = Array.isArray(base.teacherIds)
          ? base.teacherIds.map((u: any) => (u && typeof u === 'object' ? (u.name || '') : '')).filter(Boolean).join(', ')
          : '';
        return {
          ...base,
          assignmentsCount: countsMap[(base._id as any).toString()] || 0,
          studentsCount: studentsCountsMap[(base._id as any).toString()] ?? 0,
          teacherNames,
        };
      }),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async delete(classroomId: string, userId: string): Promise<void> {
    const classroom = await this.classroomModel.findById(classroomId);
    if (!classroom) throw new NotFoundException('Classroom not found');
    const isOwner = (classroom.teacherIds || []).some((id: any) => String(id) === String(userId));
    if (!isOwner) throw new ForbiddenException('Not allowed to delete this classroom');
    // Cascade deletions
    const db = (this.classroomModel as any).db;
    const LessonModel = db.model('Lesson');
    const ChatMessageModel = db.model('ChatMessage');
    const AssignmentModel = db.models['Assignment'] ? db.model('Assignment') : null;

    // Find and cleanup lessons
    const lessons = await LessonModel.find({ classroomId: new Types.ObjectId(classroomId) }).lean();
    // Delete files for attachments
    for (const l of lessons) {
      const attachments: Array<{ url: string }> = (l.content?.attachments || []) as any;
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
    }
    // Delete chats for lessons and classroom
    await ChatMessageModel.deleteMany({ lessonId: { $in: lessons.map((l: any) => l._id) } });
    await ChatMessageModel.deleteMany({ classroomId: new Types.ObjectId(classroomId) });
    // Delete lessons
    await LessonModel.deleteMany({ classroomId: new Types.ObjectId(classroomId) });
    // Delete assignments under classroom if model exists
    if (AssignmentModel) {
      await AssignmentModel.deleteMany({ classroomId: new Types.ObjectId(classroomId) });
    }
    // Finally remove classroom
    await this.classroomModel.deleteOne({ _id: classroomId });
  }

  async findOne(id: string): Promise<ClassroomDocument> {
    const classroom = await this.classroomModel
      .findById(id)
      .populate('courseId', 'title slug description')
      .populate('teacherIds', 'name email avatarUrl')
      .populate('assistantIds', 'name email avatarUrl')
      .populate('studentIds', 'name email avatarUrl');
    
    if (!classroom) {
      throw new NotFoundException('Classroom not found');
    }
    
    // Migrate legacy data if needed
    await this.migrateClassroomData(classroom);
    
    // Re-populate after migration
    const migratedClassroom = await this.classroomModel
      .findById(id)
      .populate('courseId', 'title slug description')
      .populate('teacherIds', 'name email avatarUrl')
      .populate('assistantIds', 'name email avatarUrl')
      .populate('studentIds', 'name email avatarUrl');
    
    // If students are still ObjectIds, try to populate manually
    if (migratedClassroom?.studentIds && migratedClassroom.studentIds.length > 0 && typeof migratedClassroom.studentIds[0] === 'string') {
      const populatedStudents = await this.userModel.find({
        _id: { $in: migratedClassroom.studentIds }
      }).select('name email avatarUrl');
      
      migratedClassroom.studentIds = populatedStudents.map(s => s._id) as any;
    }
    
    return migratedClassroom || classroom;
  }

  async update(id: string, updateClassroomDto: UpdateClassroomDto, userId: string): Promise<ClassroomDocument> {
    const classroom = await this.classroomModel.findOne({
      _id: id,
      teacherIds: new Types.ObjectId(userId),
    });
    
    if (!classroom) {
      throw new NotFoundException('Classroom not found or access denied');
    }

    const { teacherIds, assistantIds, startDate, endDate, timezone, ...rest } = updateClassroomDto;

    const updateData: any = { ...rest };

    if (teacherIds) {
      updateData.teacherIds = teacherIds.map(id => new Types.ObjectId(id));
    }
    if (assistantIds) {
      updateData.assistantIds = assistantIds.map(id => new Types.ObjectId(id));
    }
    if (startDate) {
      updateData.schedule = {
        ...classroom.schedule,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : classroom.schedule?.endDate,
        timezone: timezone || classroom.schedule?.timezone || 'Asia/Ho_Chi_Minh',
      };
    }

    const updatedClassroom = await this.classroomModel
      .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .populate('courseId', 'title slug')
      .populate('teacherIds', 'name email')
      .populate('assistantIds', 'name email')
      .populate('studentIds', 'name email');

    return updatedClassroom!;
  }

  async joinClassroom(joinClassroomDto: JoinClassroomDto, userId: string): Promise<ClassroomDocument> {
    const { inviteCode } = joinClassroomDto;

    const classroom = await this.classroomModel.findOne({ inviteCode });
    if (!classroom) {
      throw new NotFoundException('Invalid invite code');
    }

    // Check if user is already in the classroom
    const isAlreadyMember = classroom.studentIds.some(id => id.toString() === userId) ||
                           classroom.teacherIds.some(id => id.toString() === userId) ||
                           classroom.assistantIds.some(id => id.toString() === userId);

    if (isAlreadyMember) {
      throw new ConflictException('User is already a member of this classroom');
    }

    // Add user to students
    classroom.studentIds.push(new Types.ObjectId(userId));
    await classroom.save();

    return this.findOne((classroom._id as any).toString());
  }

  async addStudent(classroomId: string, studentId: string, userId: string): Promise<any> {
    const classroom = await this.classroomModel.findOne({
      _id: classroomId,
      teacherIds: new Types.ObjectId(userId),
    });
    
    if (!classroom) {
      throw new NotFoundException('Classroom not found or access denied');
    }

    // Check if student exists
    const student = await this.userModel.findById(studentId);
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Check if student is already in the classroom
    const isAlreadyMember = classroom.studentIds.some(id => id.toString() === studentId);
    if (isAlreadyMember) {
      throw new ConflictException('Student is already in this classroom');
    }

    // Add student to classroom
    classroom.studentIds.push(new Types.ObjectId(studentId));
    await classroom.save();

    // Get teacher info for email
    const teacher = await this.userModel.findById(userId);

    // Send invitation email
    if (teacher) {
      try {
        await this.emailService.sendClassroomInvitationEmail(
          student.email,
          student.name,
          classroom.title,
          teacher.name,
          classroom.inviteCode
        );
        console.log(`Classroom invitation email sent to ${student.email}`);
      } catch (error) {
        console.error('Failed to send classroom invitation email:', error);
        // Don't throw error, adding student should still succeed
      }
    }

    // Emit real-time event to classroom room
    this.realtimeGateway.emitClassroomStudentAdded(classroomId, student);
    // Notify the student directly
    this.realtimeGateway.emitUserEvent(student._id.toString(), 'classroomStudentAdded', { classroomId, student });
    // Notify all teachers of this classroom
    if (classroom.teacherIds && classroom.teacherIds.length > 0) {
      for (const tId of classroom.teacherIds) {
        this.realtimeGateway.emitUserEvent(tId.toString(), 'classroomStudentAdded', { classroomId, student });
      }
    }

    try {
      await this.notifications.create(student._id.toString(), 'Thêm vào lớp học', `Bạn được thêm vào lớp: ${classroom.title || classroom.name}`, { link: `/classrooms/${classroomId}` });
      if (classroom.teacherIds && classroom.teacherIds.length > 0) {
        for (const tId of classroom.teacherIds) {
          await this.notifications.create(tId.toString(), 'Thêm học sinh', `${student.name} đã được thêm vào lớp: ${classroom.title || classroom.name}`, { link: `/teacher/classrooms/${classroomId}` });
        }
      }
    } catch {}

    // Return updated classroom with populated students
    return this.findOne(classroomId);
  }

  async getClassroomStudents(classroomId: string, userId: string): Promise<any[]> {
    const classroom = await this.classroomModel.findOne({
      _id: classroomId,
      teacherIds: new Types.ObjectId(userId),
    });
    
    if (!classroom) {
      throw new NotFoundException('Classroom not found or access denied');
    }

    // If studentIds are ObjectIds, populate them
    if (classroom.studentIds && classroom.studentIds.length > 0) {
      const populatedStudents = await this.userModel.find({
        _id: { $in: classroom.studentIds }
      }).select('name email avatarUrl');
      
      return populatedStudents;
    }

    return [];
  }

  async listMembers(classroomId: string, userId: string): Promise<Array<{ _id: string; name: string; email: string; avatarUrl?: string }>> {
    // Ensure user is a member (teacher/assistant/student)
    const classroom = await this.classroomModel.findOne({
      _id: classroomId,
      $or: [
        { teacherIds: new Types.ObjectId(userId) },
        { assistantIds: new Types.ObjectId(userId) },
        { studentIds: new Types.ObjectId(userId) },
        { teacherId: new Types.ObjectId(userId) }, // legacy
        { students: new Types.ObjectId(userId) },   // legacy
      ],
    });
    if (!classroom) {
      throw new ForbiddenException('Access denied to this classroom');
    }

    const memberIds = new Set<string>();
    (classroom.teacherIds || []).forEach((id: any) => memberIds.add(String(id)));
    (classroom.assistantIds || []).forEach((id: any) => memberIds.add(String(id)));
    (classroom.studentIds || []).forEach((id: any) => memberIds.add(String(id)));
    // legacy fields
    if ((classroom as any).teacherId) memberIds.add(String((classroom as any).teacherId));
    if (Array.isArray((classroom as any).students)) (classroom as any).students.forEach((id: any) => memberIds.add(String(id)));

    if (memberIds.size === 0) return [];
    const users = await this.userModel
      .find({ _id: { $in: Array.from(memberIds).map((id) => new Types.ObjectId(id)) } })
      .select('name email avatarUrl')
      .lean();
    return users.map((u: any) => ({ _id: String(u._id), name: u.name || '', email: u.email || '', avatarUrl: u.avatarUrl }));
  }

  async findStudentByEmail(email: string): Promise<any> {
    if (!email || !email.trim()) {
      throw new BadRequestException('Email is required');
    }

    const student = await this.userModel
      .findOne({ 
        email: email.trim().toLowerCase(), 
        role: 'student' 
      })
      .select('_id name email')
      .lean();

    if (!student) {
      throw new NotFoundException('Student not found with this email');
    }

    return {
      _id: student._id,
      name: student.name || 'Chưa có tên',
      email: student.email,
    };
  }



  private async migrateClassroomData(classroom: any): Promise<void> {
    let needsUpdate = false;

    // Get fresh data from database
    const freshData = await this.classroomModel.findById(classroom._id).lean();

    // Migrate name to title if needed
    if (!classroom.title && (freshData as any)?.name) {
      classroom.title = (freshData as any).name;
      needsUpdate = true;
    }

    // Migrate students to studentIds if needed
    if ((!classroom.studentIds || classroom.studentIds.length === 0) && (freshData as any)?.students && (freshData as any).students.length > 0) {
      classroom.studentIds = (freshData as any).students;
      needsUpdate = true;
    } else if (!classroom.studentIds) {
      classroom.studentIds = [];
      needsUpdate = true;
    }

    // Migrate teacherId to teacherIds if needed
    if ((!classroom.teacherIds || classroom.teacherIds.length === 0) && (freshData as any)?.teacherId) {
      classroom.teacherIds = [(freshData as any).teacherId];
      needsUpdate = true;
    } else if (!classroom.teacherIds) {
      classroom.teacherIds = [];
      needsUpdate = true;
    }

    // Ensure assistantIds exists
    if (!classroom.assistantIds) {
      classroom.assistantIds = [];
      needsUpdate = true;
    }

    if (needsUpdate) {
      await classroom.save();
    }
  }


  async removeStudent(classroomId: string, studentId: string, userId: string): Promise<void> {
    const classroom = await this.classroomModel.findOne({
      _id: classroomId,
      teacherIds: new Types.ObjectId(userId),
    });
    
    if (!classroom) {
      throw new NotFoundException('Classroom not found or access denied');
    }

    classroom.studentIds = classroom.studentIds.filter(id => id.toString() !== studentId);
    await classroom.save();

    // Emit real-time event to classroom room
    this.realtimeGateway.emitClassroomStudentRemoved(classroomId, studentId);
    // Notify the student directly
    this.realtimeGateway.emitUserEvent(studentId.toString(), 'classroomStudentRemoved', { classroomId, studentId });
    // Notify all teachers of this classroom
    if (classroom.teacherIds && classroom.teacherIds.length > 0) {
      for (const tId of classroom.teacherIds) {
        this.realtimeGateway.emitUserEvent(tId.toString(), 'classroomStudentRemoved', { classroomId, studentId });
      }
    }
    try {
      await this.notifications.create(studentId.toString(), 'Bị xóa khỏi lớp học', `Bạn đã bị xóa khỏi lớp: ${classroom.title || classroom.name}`, { link: `/classrooms/${classroomId}` });
      if (classroom.teacherIds && classroom.teacherIds.length > 0) {
        for (const tId of classroom.teacherIds) {
          await this.notifications.create(tId.toString(), 'Xóa học sinh', `Một học sinh đã bị xóa khỏi lớp: ${classroom.title || classroom.name}`, { link: `/teacher/classrooms/${classroomId}` });
        }
      }
    } catch {}
  }

  private async generateUniqueInviteCode(): Promise<string> {
    let inviteCode: string = '';
    let isUnique = false;

    while (!isUnique) {
      // Generate a random code like "TV1-ABC"
      const prefix = Math.random().toString(36).substring(2, 5).toUpperCase();
      const suffix = Math.random().toString(36).substring(2, 5).toUpperCase();
      inviteCode = `${prefix}-${suffix}`;

      const existing = await this.classroomModel.findOne({ inviteCode });
      isUnique = !existing;
    }

    return inviteCode;
  }
}
