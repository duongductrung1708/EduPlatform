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

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Course.name, schema: CourseSchema },
      { name: Classroom.name, schema: ClassroomSchema },
      { name: Assignment.name, schema: AssignmentSchema },
      { name: Submission.name, schema: SubmissionSchema },
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
