import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AssignmentsController } from './assignments.controller';
import { AssignmentsService } from './assignments.service';
import { Assignment, AssignmentSchema } from '../../models/assignment.model';
import { Submission, SubmissionSchema } from '../../models/assignment.model';
import { Classroom, ClassroomSchema } from '../../models/classroom.model';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Assignment.name, schema: AssignmentSchema },
      { name: Submission.name, schema: SubmissionSchema },
      { name: Classroom.name, schema: ClassroomSchema },
    ]),
    RealtimeModule,
  ],
  controllers: [AssignmentsController],
  providers: [AssignmentsService],
  exports: [AssignmentsService],
})
export class AssignmentsModule {}
