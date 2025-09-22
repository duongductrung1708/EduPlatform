import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true } })
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;
  private readonly logger = new Logger(RealtimeGateway.name);

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
  handleClassMessage(@MessageBody() data: { classroomId: string; message: string; user: { id: string; name: string } }) {
    this.server.to(`classroom:${data.classroomId}`).emit('classMessage', {
      ...data,
      timestamp: new Date().toISOString(),
    });
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
