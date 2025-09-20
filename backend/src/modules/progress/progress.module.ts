import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProgressService } from './progress.service';
import { ProgressController } from './progress.controller';
import { CourseEnrollment, CourseEnrollmentSchema } from '../../models/course-enrollment.model';
import { UserBadge, UserBadgeSchema } from '../../models/user-badge.model';
import { Badge, BadgeSchema } from '../../models/badge.model';
import { Module as ModuleModel, ModuleSchema } from '../../models/module.model';
import { Lesson, LessonSchema } from '../../models/lesson.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CourseEnrollment.name, schema: CourseEnrollmentSchema },
      { name: UserBadge.name, schema: UserBadgeSchema },
      { name: Badge.name, schema: BadgeSchema },
      { name: ModuleModel.name, schema: ModuleSchema },
      { name: Lesson.name, schema: LessonSchema },
    ]),
  ],
  providers: [ProgressService],
  controllers: [ProgressController],
  exports: [ProgressService],
})
export class ProgressModule {}
