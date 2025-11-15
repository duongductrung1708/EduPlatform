import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { Roles } from '../../decorators/roles.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { AssignmentsService } from './assignments.service';
import { 
  CreateAssignmentDto, 
  UpdateAssignmentDto, 
  CreateSubmissionDto, 
  GradeSubmissionDto,
  AssignmentResponseDto,
  SubmissionResponseDto 
} from './dto/assignment.dto';

@ApiTags('assignments')
@Controller('api/classes/:classroomId/assignments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Post()
  @Roles('teacher', 'admin')
  @ApiOperation({ summary: 'Create a new assignment (teacher/admin only)' })
  @ApiResponse({ status: 201, description: 'Assignment created successfully', type: AssignmentResponseDto })
  async create(
    @Param('classroomId') classroomId: string,
    @Body() createAssignmentDto: CreateAssignmentDto,
    @CurrentUser() user: any,
  ) {
    return this.assignmentsService.create(classroomId, createAssignmentDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all assignments in a classroom' })
  @ApiResponse({ status: 200, description: 'List of assignments' })
  async findAll(
    @Param('classroomId') classroomId: string,
    @CurrentUser() user: any,
  ) {
    return this.assignmentsService.findAll(classroomId, user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get assignment by ID' })
  @ApiResponse({ status: 200, description: 'Assignment details', type: AssignmentResponseDto })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.assignmentsService.findOne(id, user.id);
  }

  @Patch(':id')
  @Roles('teacher', 'admin')
  @ApiOperation({ summary: 'Update assignment (teacher/admin only)' })
  @ApiResponse({ status: 200, description: 'Assignment updated successfully', type: AssignmentResponseDto })
  async update(
    @Param('id') id: string,
    @Body() updateAssignmentDto: UpdateAssignmentDto,
    @CurrentUser() user: any,
  ) {
    return this.assignmentsService.update(id, updateAssignmentDto, user.id);
  }

  @Delete(':id')
  @Roles('teacher', 'admin')
  @ApiOperation({ summary: 'Delete assignment (teacher/admin only)' })
  @ApiResponse({ status: 200, description: 'Assignment deleted successfully' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    await this.assignmentsService.remove(id, user.id);
    return { message: 'Assignment deleted successfully' };
  }

  // Submission endpoints
  @Post(':id/submissions')
  @Roles('student')
  @ApiOperation({ summary: 'Submit assignment (student only)' })
  @ApiResponse({ status: 201, description: 'Submission created successfully', type: SubmissionResponseDto })
  async createSubmission(
    @Param('id') assignmentId: string,
    @Body() createSubmissionDto: CreateSubmissionDto,
    @CurrentUser() user: any,
  ) {
    return this.assignmentsService.createSubmission(assignmentId, createSubmissionDto, user.id);
  }

  @Get(':id/submissions')
  @Roles('teacher', 'admin')
  @ApiOperation({ summary: 'Get all submissions for an assignment (teacher/admin only)' })
  @ApiResponse({ status: 200, description: 'List of submissions' })
  async getSubmissions(
    @Param('id') assignmentId: string,
    @CurrentUser() user: any,
  ) {
    return this.assignmentsService.getSubmissions(assignmentId, user.id);
  }

  @Get(':id/my-submission')
  @Roles('student')
  @ApiOperation({ summary: 'Get my submission for an assignment (student only)' })
  @ApiResponse({ status: 200, description: 'My submission', type: SubmissionResponseDto })
  async getMySubmission(
    @Param('id') assignmentId: string,
    @CurrentUser() user: any,
  ) {
    return this.assignmentsService.getMySubmission(assignmentId, user.id);
  }

  @Patch(':id/submissions/:submissionId/grade')
  @Roles('teacher', 'admin')
  @ApiOperation({ summary: 'Grade a submission (teacher/admin only)' })
  @ApiResponse({ status: 200, description: 'Submission graded successfully', type: SubmissionResponseDto })
  async gradeSubmission(
    @Param('id') assignmentId: string,
    @Param('submissionId') submissionId: string,
    @Body() gradeSubmissionDto: GradeSubmissionDto,
    @CurrentUser() user: any,
  ) {
    return this.assignmentsService.gradeSubmission(submissionId, gradeSubmissionDto, user.id);
  }
}
