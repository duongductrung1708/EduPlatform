import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { Roles } from '../../decorators/roles.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { ClassroomsService } from './classrooms.service';
import { CreateClassroomDto, UpdateClassroomDto, JoinClassroomDto, ClassroomResponseDto } from './dto/classroom.dto';

@ApiTags('classrooms')
@Controller('api/classes')
export class ClassroomsController {
  constructor(private readonly classroomsService: ClassroomsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles('teacher', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new classroom (teacher/admin only)' })
  @ApiResponse({ status: 201, description: 'Classroom created successfully', type: ClassroomResponseDto })
  async create(
    @Body() createClassroomDto: CreateClassroomDto,
    @CurrentUser() user: any,
  ) {
    return this.classroomsService.create(createClassroomDto, user.id);
  }
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @Roles('teacher', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete classroom (teacher/admin only)' })
  @ApiResponse({ status: 200, description: 'Classroom deleted successfully' })
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    await this.classroomsService.delete(id, user.id);
    return { message: 'Classroom deleted successfully' };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all classrooms for current user' })
  @ApiResponse({ status: 200, description: 'List of classrooms' })
  async findAll(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.classroomsService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      user.id,
    );
  }

  @Get('find-student')
  @UseGuards(JwtAuthGuard)
  @Roles('teacher', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Find student by email for adding to classroom' })
  @ApiResponse({ status: 200, description: 'Student found' })
  async findStudentByEmail(
    @Query('email') email: string,
  ) {
    return this.classroomsService.findStudentByEmail(email);
  }



  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get classroom by ID' })
  @ApiResponse({ status: 200, description: 'Classroom details', type: ClassroomResponseDto })
  async findOne(@Param('id') id: string) {
    return this.classroomsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @Roles('teacher', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update classroom (teacher/admin only)' })
  @ApiResponse({ status: 200, description: 'Classroom updated successfully', type: ClassroomResponseDto })
  async update(
    @Param('id') id: string,
    @Body() updateClassroomDto: UpdateClassroomDto,
    @CurrentUser() user: any,
  ) {
    return this.classroomsService.update(id, updateClassroomDto, user.id);
  }

  @Post('join')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Join classroom with invite code' })
  @ApiResponse({ status: 200, description: 'Successfully joined classroom', type: ClassroomResponseDto })
  async joinClassroom(
    @Body() joinClassroomDto: JoinClassroomDto,
    @CurrentUser() user: any,
  ) {
    return this.classroomsService.joinClassroom(joinClassroomDto, user.id);
  }

  @Post(':id/students')
  @UseGuards(JwtAuthGuard)
  @Roles('teacher', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add student to classroom (teacher/admin only)' })
  @ApiResponse({ status: 200, description: 'Student added successfully' })
  async addStudent(
    @Param('id') classroomId: string,
    @Body() body: { studentId: string },
    @CurrentUser() user: any,
  ) {
    return this.classroomsService.addStudent(classroomId, body.studentId, user.id);
  }

  @Get(':id/students')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all students in classroom' })
  @ApiResponse({ status: 200, description: 'List of students in classroom' })
  async getClassroomStudents(
    @Param('id') classroomId: string,
    @CurrentUser() user: any,
  ) {
    return this.classroomsService.getClassroomStudents(classroomId, user.id);
  }

  @Get(':id/members')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all members (teachers/assistants/students) in classroom' })
  @ApiResponse({ status: 200, description: 'List of members in classroom' })
  async listMembers(
    @Param('id') classroomId: string,
    @CurrentUser() user: any,
  ) {
    return this.classroomsService.listMembers(classroomId, user.id);
  }

  @Delete(':id/students/:studentId')
  @UseGuards(JwtAuthGuard)
  @Roles('teacher', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove student from classroom (teacher/admin only)' })
  @ApiResponse({ status: 200, description: 'Student removed successfully' })
  async removeStudent(
    @Param('id') classroomId: string,
    @Param('studentId') studentId: string,
    @CurrentUser() user: any,
  ) {
    await this.classroomsService.removeStudent(classroomId, studentId, user.id);
    return { message: 'Student removed successfully' };
  }
}
