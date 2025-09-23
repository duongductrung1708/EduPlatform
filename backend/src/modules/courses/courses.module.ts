import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { CourseInvitationsController } from './course-invitations.controller';
import { CourseInvitationsService } from './course-invitations.service';
import { Course, CourseSchema } from '../../models/course.model';
import { DocumentFile, DocumentFileSchema } from '../../models/document.model';
import { Lesson, LessonSchema } from '../../models/lesson.model';
import { CourseEnrollment, CourseEnrollmentSchema } from '../../models/course-enrollment.model';
import { CourseInvitation, CourseInvitationSchema } from '../../models/course-invitation.model';
import { Module as CourseModule, ModuleSchema } from '../../models/module.model';
import { User, UserSchema } from '../../models/user.model';
import { RealtimeModule } from '../realtime/realtime.module';
import { EmailModule } from '../email/email.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Course.name, schema: CourseSchema },
      { name: DocumentFile.name, schema: DocumentFileSchema },
      { name: Lesson.name, schema: LessonSchema },
      { name: CourseEnrollment.name, schema: CourseEnrollmentSchema },
      { name: CourseInvitation.name, schema: CourseInvitationSchema },
      { name: CourseModule.name, schema: ModuleSchema },
      { name: User.name, schema: UserSchema },
    ]),
    RealtimeModule,
    EmailModule,
    NotificationsModule,
  ],
  controllers: [CoursesController, CourseInvitationsController],
  providers: [CoursesService, CourseInvitationsService],
  exports: [CoursesService, CourseInvitationsService],
})
export class CoursesModule {}
