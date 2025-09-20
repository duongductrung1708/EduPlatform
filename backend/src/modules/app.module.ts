import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CoursesModule } from './courses/courses.module';
import { ClassroomsModule } from './classrooms/classrooms.module';
import { LessonsModule } from './lessons/lessons.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { RolesGuard } from '../guards/roles.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { UploadsModule } from './uploads/uploads.module';
import { RealtimeModule } from './realtime/realtime.module';
import { AdminModule } from './admin/admin.module';
import { ProgressModule } from './progress/progress.module';
import { Course, CourseSchema } from '../models/course.model';
import { Module as CourseModule, ModuleSchema } from '../models/module.model';
import { Lesson, LessonSchema } from '../models/lesson.model';
import { CourseEnrollment, CourseEnrollmentSchema } from '../models/course-enrollment.model';
import { Badge, BadgeSchema } from '../models/badge.model';
import { UserBadge, UserBadgeSchema } from '../models/user-badge.model';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://localhost:27017/eduplatform'),
    MongooseModule.forFeature([
      { name: Course.name, schema: CourseSchema },
      { name: CourseModule.name, schema: ModuleSchema },
      { name: Lesson.name, schema: LessonSchema },
      { name: CourseEnrollment.name, schema: CourseEnrollmentSchema },
      { name: Badge.name, schema: BadgeSchema },
      { name: UserBadge.name, schema: UserBadgeSchema },
    ]),
    AuthModule,
    UsersModule,
    CoursesModule,
    ClassroomsModule,
    LessonsModule,
    AssignmentsModule,
    UploadsModule,
    RealtimeModule,
    AdminModule,
    ProgressModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
