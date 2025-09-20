import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  UseGuards, 
  HttpCode, 
  HttpStatus 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { CourseInvitationsService } from './course-invitations.service';

@ApiTags('Course Invitations')
@Controller('api/course-invitations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CourseInvitationsController {
  constructor(private readonly courseInvitationsService: CourseInvitationsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('teacher', 'admin')
  @ApiOperation({ summary: 'Create a course invitation (teacher/admin only)' })
  @ApiResponse({ status: 201, description: 'Invitation created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Course or student not found' })
  async createInvitation(
    @Body() body: { 
      courseId: string; 
      studentEmail: string; 
      message?: string 
    },
    @CurrentUser() user: any
  ) {
    return this.courseInvitationsService.createInvitation(
      body.courseId,
      body.studentEmail,
      user.id,
      body.message
    );
  }

  @Get('my-invitations')
  @UseGuards(RolesGuard)
  @Roles('student')
  @ApiOperation({ summary: 'Get student invitations (student only)' })
  @ApiResponse({ status: 200, description: 'Invitations retrieved successfully' })
  async getStudentInvitations(@CurrentUser() user: any) {
    return this.courseInvitationsService.getStudentInvitations(user.id);
  }

  @Get('sent-invitations')
  @UseGuards(RolesGuard)
  @Roles('teacher', 'admin')
  @ApiOperation({ summary: 'Get teacher sent invitations (teacher/admin only)' })
  @ApiResponse({ status: 200, description: 'Invitations retrieved successfully' })
  async getTeacherInvitations(@CurrentUser() user: any) {
    return this.courseInvitationsService.getTeacherInvitations(user.id);
  }

  @Put(':id/accept')
  @UseGuards(RolesGuard)
  @Roles('student')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept a course invitation (student only)' })
  @ApiResponse({ status: 200, description: 'Invitation accepted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  async acceptInvitation(
    @Param('id') invitationId: string,
    @CurrentUser() user: any
  ) {
    return this.courseInvitationsService.acceptInvitation(invitationId, user.id);
  }

  @Put(':id/decline')
  @UseGuards(RolesGuard)
  @Roles('student')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Decline a course invitation (student only)' })
  @ApiResponse({ status: 200, description: 'Invitation declined successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  async declineInvitation(
    @Param('id') invitationId: string,
    @CurrentUser() user: any
  ) {
    return this.courseInvitationsService.declineInvitation(invitationId, user.id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('teacher', 'admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a course invitation (teacher/admin only)' })
  @ApiResponse({ status: 200, description: 'Invitation cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  async cancelInvitation(
    @Param('id') invitationId: string,
    @CurrentUser() user: any
  ) {
    return this.courseInvitationsService.cancelInvitation(invitationId, user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get invitation details by ID' })
  @ApiResponse({ status: 200, description: 'Invitation retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  async getInvitation(@Param('id') invitationId: string) {
    // This endpoint can be used by both students and teachers to view invitation details
    // The service should check permissions based on user role
    return this.courseInvitationsService.getInvitationById(invitationId);
  }
}
