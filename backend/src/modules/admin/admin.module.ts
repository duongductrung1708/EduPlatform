import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminGateway } from './admin.gateway';
import { AdminEventsService } from './admin-events.service';
import { User, UserSchema } from '../../models/user.model';
import { Course, CourseSchema } from '../../models/course.model';
import { Classroom, ClassroomSchema } from '../../models/classroom.model';
import { Assignment, AssignmentSchema, Submission, SubmissionSchema } from '../../models/assignment.model';
import { Lesson, LessonSchema } from '../../models/lesson.model';
import { SecuritySetting, SecuritySettingSchema } from '../../models/security-setting.model';
import { SecurityLog, SecurityLogSchema } from '../../models/security-log.model';
import { SystemSetting, SystemSettingSchema } from '../../models/system-setting.model';
import { CourseEnrollment, CourseEnrollmentSchema } from '../../models/course-enrollment.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Course.name, schema: CourseSchema },
      { name: Classroom.name, schema: ClassroomSchema },
      { name: Assignment.name, schema: AssignmentSchema },
      { name: Submission.name, schema: SubmissionSchema },
      { name: Lesson.name, schema: LessonSchema },
      { name: SecuritySetting.name, schema: SecuritySettingSchema },
      { name: SecurityLog.name, schema: SecurityLogSchema },
      { name: SystemSetting.name, schema: SystemSettingSchema },
      { name: CourseEnrollment.name, schema: CourseEnrollmentSchema },
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminGateway, AdminEventsService],
  exports: [AdminService, AdminGateway, AdminEventsService],
})
export class AdminModule {}
