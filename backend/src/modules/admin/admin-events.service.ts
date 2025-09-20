import { Injectable } from '@nestjs/common';
import { AdminGateway } from './admin.gateway';

@Injectable()
export class AdminEventsService {
  constructor(private adminGateway: AdminGateway) {}

  async notifyUserRegistered(user: any) {
    await this.adminGateway.notifyAdminEvent({
      type: 'user_registered',
      message: `Người dùng mới đã đăng ký: ${user.name} (${user.email})`,
      data: { userId: user._id, role: user.role }
    });
  }

  async notifyCourseCreated(course: any) {
    await this.adminGateway.notifyAdminEvent({
      type: 'course_created',
      message: `Khóa học mới đã được tạo: ${course.title}`,
      data: { courseId: course._id, category: course.category }
    });
  }

  async notifyClassroomCreated(classroom: any) {
    await this.adminGateway.notifyAdminEvent({
      type: 'classroom_created',
      message: `Lớp học mới đã được tạo: ${classroom.name}`,
      data: { classroomId: classroom._id, courseId: classroom.courseId }
    });
  }

  async notifySystemAlert(message: string, data?: any) {
    await this.adminGateway.notifyAdminEvent({
      type: 'system_alert',
      message,
      data
    });
  }

  async broadcastAnalyticsUpdate() {
    await this.adminGateway.broadcastAnalyticsUpdate();
  }

  async broadcastDashboardStatsUpdate() {
    await this.adminGateway.broadcastDashboardStatsUpdate();
  }
}
