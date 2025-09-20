import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { Course, CourseSchema } from '../../models/course.model';
import { DocumentFile, DocumentFileSchema } from '../../models/document.model';
import { Lesson, LessonSchema } from '../../models/lesson.model';
import { CourseEnrollment, CourseEnrollmentSchema } from '../../models/course-enrollment.model';
import { Module as CourseModule, ModuleSchema } from '../../models/module.model';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Course.name, schema: CourseSchema },
      { name: DocumentFile.name, schema: DocumentFileSchema },
      { name: Lesson.name, schema: LessonSchema },
      { name: CourseEnrollment.name, schema: CourseEnrollmentSchema },
      { name: CourseModule.name, schema: ModuleSchema },
    ]),
    RealtimeModule,
  ],
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [CoursesService],
})
export class CoursesModule {}
