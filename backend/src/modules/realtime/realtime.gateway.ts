import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true } })
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    // Connected
  }

  handleDisconnect(client: Socket) {
    // Disconnected
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
}
