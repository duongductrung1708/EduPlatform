import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ChatMessage, ChatMessageDocument } from '../../models/chat-message.model';

@WebSocketGateway({ cors: { origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true } })
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;
  private readonly logger = new Logger(RealtimeGateway.name);
  constructor(
    private notifications: NotificationsService,
    private usersService: UsersService,
    @InjectModel(ChatMessage.name) private chatModel: Model<ChatMessageDocument>,
  ) {}

  handleConnection(client: Socket) {
    if (process.env.DEBUG_REALTIME === '1') this.logger.debug(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    if (process.env.DEBUG_REALTIME === '1') this.logger.debug(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('identify')
  handleIdentify(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    const userId = String(data?.userId || '').trim();
    if (userId) {
      client.join(`user:${userId}`);
      if (process.env.DEBUG_REALTIME === '1') this.logger.debug(`Client ${client.id} joined room user:${userId}`);
      client.emit('identified', { userId });
    } else {
      if (process.env.DEBUG_REALTIME === '1') this.logger.warn(`Identify received without userId from client ${client.id}`);
    }
  }

  @SubscribeMessage('joinClassroom')
  handleJoinClassroom(@MessageBody() data: { classroomId: string }, @ConnectedSocket() client: Socket) {
    client.join(`classroom:${data.classroomId}`);
    client.emit('joinedClassroom', { classroomId: data.classroomId });
  }

  @SubscribeMessage('classMessage')
  async handleClassMessage(@MessageBody() data: { classroomId: string; message: string; user: { id: string; name: string } }) {
    // Save first to get id/timestamp
    let saved: any = null;
    try { saved = await this.chatModel.create({ classroomId: new Types.ObjectId(data.classroomId), authorId: new Types.ObjectId(data.user.id), authorName: data.user.name, message: data.message }); } catch {}
    const ts = saved?.createdAt ? new Date(saved.createdAt).toISOString() : new Date().toISOString();
    const payload: any = { ...data, id: saved?._id?.toString?.(), timestamp: ts };
    this.server.to(`classroom:${data.classroomId}`).emit('classMessage', payload);
    try {
      const seen = new Set<string>();
      const idRegex = /@(?:userId|uid):([a-fA-F0-9]{24})/g;
      let m: RegExpExecArray | null;
      while ((m = idRegex.exec(data.message))) { seen.add(m[1]); }
      const emailRegex = /@([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
      const emailMatches: string[] = [];
      while ((m = emailRegex.exec(data.message))) { emailMatches.push(m[1]); }
      if (emailMatches.length) {
        for (const email of emailMatches) {
          try { const u = await this.usersService.findByEmail(email); if (u) seen.add(String((u as any)._id)); } catch {}
        }
      }
      const unameRegex = /@([A-Za-z0-9_]{3,32})/g;
      const unameMatches: string[] = [];
      while ((m = unameRegex.exec(data.message))) { unameMatches.push(m[1]); }
      if (unameMatches.length) {
        for (const uname of unameMatches) {
          try { (await this.usersService.findIdsByExactNameInsensitive(uname)).forEach((id) => seen.add(id)); } catch {}
        }
      }
      for (const uid of Array.from(seen)) {
        try {
          const created = await this.notifications.create(uid, 'Bạn được nhắc đến', `${data.user.name}: ${data.message}`, { link: `/classrooms/${data.classroomId}` });
          // Push realtime notification to the mentioned user
          this.emitUserEvent(uid, 'notificationCreated', {
            id: String((created as any)?._id || ''),
            title: created?.title || 'Bạn được nhắc đến',
            body: created?.body || `${data.user.name}: ${data.message}`,
            link: created?.meta?.link || `/classrooms/${data.classroomId}`,
          });
        } catch {}
      }
    } catch {}
  }

  @SubscribeMessage('joinCourse')
  handleJoinCourse(@MessageBody() data: { courseId: string }, @ConnectedSocket() client: Socket) {
    client.join(`course:${data.courseId}`);
    client.emit('joinedCourse', { courseId: data.courseId });
  }

  @SubscribeMessage('leaveCourse')
  handleLeaveCourse(@MessageBody() data: { courseId: string }, @ConnectedSocket() client: Socket) {
    client.leave(`course:${data.courseId}`);
    client.emit('leftCourse', { courseId: data.courseId });
  }

  @SubscribeMessage('joinLesson')
  handleJoinLesson(@MessageBody() data: { lessonId: string }, @ConnectedSocket() client: Socket) {
    client.join(`lesson:${data.lessonId}`);
    client.emit('joinedLesson', { lessonId: data.lessonId });
  }

  @SubscribeMessage('lessonMessage')
  async handleLessonMessage(@MessageBody() data: { lessonId: string; message: string; user: { id: string; name: string } }) {
    let saved: any = null;
    try { saved = await this.chatModel.create({ lessonId: new Types.ObjectId(data.lessonId), authorId: new Types.ObjectId(data.user.id), authorName: data.user.name, message: data.message }); } catch {}
    const ts = saved?.createdAt ? new Date(saved.createdAt).toISOString() : new Date().toISOString();
    const payload: any = { ...data, id: saved?._id?.toString?.(), timestamp: ts };
    this.server.to(`lesson:${data.lessonId}`).emit('lessonMessage', payload);
    // Mentions
    try {
      const seen = new Set<string>();
      const idRegex = /@(?:userId|uid):([a-fA-F0-9]{24})/g;
      let m: RegExpExecArray | null;
      while ((m = idRegex.exec(data.message))) { seen.add(m[1]); }
      const emailRegex = /@([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
      const emails: string[] = [];
      while ((m = emailRegex.exec(data.message))) { emails.push(m[1]); }
      for (const email of emails) {
        try { const u = await this.usersService.findByEmail(email); if (u) seen.add(String((u as any)._id)); } catch {}
      }
      const unameRegex = /@([A-Za-z0-9_]{3,32})/g;
      const names: string[] = [];
      while ((m = unameRegex.exec(data.message))) { names.push(m[1]); }
      for (const uname of names) {
        try { (await this.usersService.findIdsByExactNameInsensitive(uname)).forEach((id) => seen.add(id)); } catch {}
      }
      for (const uid of Array.from(seen)) {
        try {
          const created = await this.notifications.create(uid, 'Bạn được nhắc đến', `${data.user.name}: ${data.message}`, { link: `/lessons/${data.lessonId}` });
          // Push realtime notification to the mentioned user
          this.emitUserEvent(uid, 'notificationCreated', {
            id: String((created as any)?._id || ''),
            title: created?.title || 'Bạn được nhắc đến',
            body: created?.body || `${data.user.name}: ${data.message}`,
            link: created?.meta?.link || `/lessons/${data.lessonId}`,
          });
        } catch {}
      }
    } catch {}
  }

  // Emit enrollment events
  emitEnrollmentAdded(courseId: string, enrollment: any) {
    this.server.to(`course:${courseId}`).emit('enrollmentAdded', {
      courseId,
      enrollment,
      timestamp: new Date().toISOString(),
    });
  }

  emitEnrollmentRemoved(courseId: string, studentId: string) {
    this.server.to(`course:${courseId}`).emit('enrollmentRemoved', {
      courseId,
      studentId,
      timestamp: new Date().toISOString(),
    });
  }

  // Classroom student events
  emitClassroomStudentAdded(classroomId: string, student: any) {
    this.server.to(`classroom:${classroomId}`).emit('classroomStudentAdded', {
      classroomId,
      student,
      timestamp: new Date().toISOString(),
    });
  }

  emitClassroomStudentRemoved(classroomId: string, studentId: string) {
    this.server.to(`classroom:${classroomId}`).emit('classroomStudentRemoved', {
      classroomId,
      studentId,
      timestamp: new Date().toISOString(),
    });
  }

  // Course invitation events
  emitCourseInvitationCreated(studentId: string, invitationData: any) {
    this.server.to(`user:${studentId}`).emit('courseInvitationCreated', {
      ...invitationData,
      timestamp: new Date().toISOString(),
    });
  }

  emitCourseInvitationAccepted(courseId: string, invitationData: any) {
    this.server.to(`course:${courseId}`).emit('courseInvitationAccepted', {
      ...invitationData,
      timestamp: new Date().toISOString(),
    });
  }

  emitCourseInvitationDeclined(courseId: string, invitationData: any) {
    this.server.to(`course:${courseId}`).emit('courseInvitationDeclined', {
      ...invitationData,
      timestamp: new Date().toISOString(),
    });
  }

  // Course enrollment events (updated)
  emitCourseEnrollmentAdded(courseId: string, enrollmentData: any) {
    this.server.to(`course:${courseId}`).emit('courseEnrollmentAdded', {
      ...enrollmentData,
      timestamp: new Date().toISOString(),
    });
  }

  // Generic user notification emitter
  emitUserEvent(userId: string, event: string, payload: any) {
    const message = {
      ...payload,
      timestamp: new Date().toISOString(),
    };
    if (process.env.DEBUG_REALTIME === '1') this.logger.debug(`Emitting ${event} to user:${userId}`);
    this.server.to(`user:${userId}`).emit(event, message);
  }
}
