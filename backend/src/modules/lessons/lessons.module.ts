import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LessonsController } from './lessons.controller';
import { LessonsService } from './lessons.service';
import { Lesson, LessonSchema } from '../../models/lesson.model';
import { Classroom, ClassroomSchema } from '../../models/classroom.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Lesson.name, schema: LessonSchema },
      { name: Classroom.name, schema: ClassroomSchema },
    ]),
  ],
  controllers: [LessonsController],
  providers: [LessonsService],
  exports: [LessonsService],
})
export class LessonsModule {}
