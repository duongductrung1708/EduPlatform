import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClassroomsController } from './classrooms.controller';
import { ClassroomsService } from './classrooms.service';
import { Classroom, ClassroomSchema } from '../../models/classroom.model';
import { Course, CourseSchema } from '../../models/course.model';
import { User, UserSchema } from '../../models/user.model';
import { Assignment, AssignmentSchema } from '../../models/assignment.model';
import { RealtimeModule } from '../realtime/realtime.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Classroom.name, schema: ClassroomSchema },
      { name: Course.name, schema: CourseSchema },
      { name: User.name, schema: UserSchema },
      { name: Assignment.name, schema: AssignmentSchema },
    ]),
    RealtimeModule,
    EmailModule,
  ],
  controllers: [ClassroomsController],
  providers: [ClassroomsService],
  exports: [ClassroomsService],
})
export class ClassroomsModule {}
