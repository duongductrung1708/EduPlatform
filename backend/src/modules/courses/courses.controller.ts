import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { Roles } from '../../decorators/roles.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { CoursesService } from './courses.service';
import { CreateCourseDto, UpdateCourseDto, CourseResponseDto, CreateDocumentDto, UpdateDocumentDto } from './dto/course.dto';

@ApiTags('courses')
@Controller('api/courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles('teacher', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new course (teacher/admin only)' })
  @ApiResponse({ status: 201, description: 'Course created successfully', type: CourseResponseDto })
  async create(
    @Body() createCourseDto: CreateCourseDto,
    @CurrentUser() user: any,
  ) {
    return this.coursesService.create(createCourseDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all courses' })
  @ApiResponse({ status: 200, description: 'List of courses' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') search?: string,
    @Query('tags') tags?: string,
    @Query('visibility') visibility?: string,
  ) {
    const tagArray = tags ? tags.split(',') : undefined;
    return this.coursesService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search,
      tagArray,
      visibility,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get course by ID' })
  @ApiResponse({ status: 200, description: 'Course details', type: CourseResponseDto })
  async findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get course by slug' })
  @ApiResponse({ status: 200, description: 'Course details', type: CourseResponseDto })
  async findBySlug(@Param('slug') slug: string) {
    return this.coursesService.findBySlug(slug);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @Roles('teacher', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update course (owner/admin only)' })
  @ApiResponse({ status: 200, description: 'Course updated successfully', type: CourseResponseDto })
  async update(
    @Param('id') id: string,
    @Body() updateCourseDto: UpdateCourseDto,
    @CurrentUser() user: any,
  ) {
    return this.coursesService.update(id, updateCourseDto, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @Roles('teacher', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete course (owner/admin only)' })
  @ApiResponse({ status: 200, description: 'Course deleted successfully' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    await this.coursesService.remove(id, user.id);
    return { message: 'Course deleted successfully' };
  }

  // Public listing of courses
  @Get('public/list')
  @ApiOperation({ summary: 'List public published courses (no auth)' })
  async listPublicCourses(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') search?: string,
    @Query('tags') tags?: string,
  ) {
    const tagArray = tags ? tags.split(',') : undefined;
    return this.coursesService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search,
      tagArray,
      'public',
    );
  }

  // Enrollment endpoints
  @Post(':id/enroll')
  @UseGuards(JwtAuthGuard)
  @Roles('student', 'teacher', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enroll current user to a course' })
  async enroll(@Param('id') id: string, @CurrentUser() user: any) {
    return this.coursesService.enrollInCourse(id, user.id);
  }

  @Get(':id/enrollment')
  @UseGuards(JwtAuthGuard)
  @Roles('student', 'teacher', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get enrollment status for current user' })
  async getEnrollment(@Param('id') id: string, @CurrentUser() user: any) {
    return this.coursesService.getEnrollmentStatus(id, user.id);
  }

  // Rating endpoint
  @Post(':id/rate')
  @UseGuards(JwtAuthGuard)
  @Roles('student', 'teacher', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rate a course (must be enrolled)' })
  async rateCourse(
    @Param('id') id: string,
    @Body() body: { rating: number; review?: string },
    @CurrentUser() user: any,
  ) {
    return this.coursesService.rateCourse(id, user.id, body.rating, body.review);
  }

  // Lessons by course (grouped by moduleId)
  @Get(':id/lessons')
  @ApiOperation({ summary: 'List published lessons of a course grouped by moduleId' })
  async listLessons(@Param('id') id: string) {
    return this.coursesService.listLessonsByCourse(id);
  }

  // Teacher content management: modules
  @Get(':id/modules')
  @ApiOperation({ summary: 'List modules for a course' })
  async listModules(@Param('id') id: string) {
    return this.coursesService.listModules(id);
  }

  @Post(':id/modules')
  @UseGuards(JwtAuthGuard)
  @Roles('teacher', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a module in a course (teacher/admin)' })
  async createModule(
    @Param('id') id: string,
    @Body() body: { title: string; description: string; order?: number; estimatedDuration?: number; isPublished?: boolean },
    @CurrentUser() user: any,
  ) {
    return this.coursesService.createModule(id, user.id, body);
  }

  // Teacher content management: lessons by module
  @Get('modules/:moduleId/lessons')
  @ApiOperation({ summary: 'List lessons under a module' })
  async listLessonsByModule(@Param('moduleId') moduleId: string) {
    return this.coursesService.listLessonsByModule(moduleId);
  }

  @Post('modules/:moduleId/lessons')
  @UseGuards(JwtAuthGuard)
  @Roles('teacher', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a lesson under a module (teacher/admin)' })
  async createLessonUnderModule(
    @Param('moduleId') moduleId: string,
    @Body() body: { title: string; description: string; type: 'document'|'video'|'interactive'|'quiz'|'assignment'; order?: number; content?: any; estimatedDuration?: number; isPublished?: boolean },
    @CurrentUser() user: any,
  ) {
    return this.coursesService.createLessonUnderModule(moduleId, user.id, body);
  }

  // Materials endpoints
  @Get(':id/materials')
  @ApiOperation({ summary: 'List materials of a course (public returns published+public only)' })
  async listMaterials(@Param('id') id: string, @Query('public') publicOnly?: string) {
    const onlyPublic = publicOnly === 'true';
    return this.coursesService.listCourseDocuments(id, onlyPublic);
  }

  @Post('materials')
  @UseGuards(JwtAuthGuard)
  @Roles('teacher', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a material to a course (teacher/admin)' })
  async addMaterial(@Body() dto: CreateDocumentDto, @CurrentUser() user: any) {
    return this.coursesService.addDocument(dto, user.id);
  }

  @Patch('materials/:id')
  @UseGuards(JwtAuthGuard)
  @Roles('teacher', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a material (owner/admin)' })
  async updateMaterial(@Param('id') id: string, @Body() dto: UpdateDocumentDto, @CurrentUser() user: any) {
    return this.coursesService.updateDocument(id, dto, user.id);
  }

  @Delete('materials/:id')
  @UseGuards(JwtAuthGuard)
  @Roles('teacher', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a material (owner/admin)' })
  async removeMaterial(@Param('id') id: string, @CurrentUser() user: any) {
    await this.coursesService.removeDocument(id, user.id);
    return { message: 'Material deleted successfully' };
  }

  // Enrollment management endpoints
  @Get(':id/enrollments')
  @UseGuards(JwtAuthGuard)
  @Roles('teacher', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all enrollments for a course (teacher/admin only)' })
  async getCourseEnrollments(@Param('id') id: string, @CurrentUser() user: any) {
    return this.coursesService.getCourseEnrollments(id, user.id);
  }

  @Delete(':id/enrollments/:studentId')
  @UseGuards(JwtAuthGuard)
  @Roles('teacher', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a student from course enrollment (teacher/admin only)' })
  async removeStudentFromCourse(
    @Param('id') courseId: string,
    @Param('studentId') studentId: string,
    @CurrentUser() user: any,
  ) {
    return this.coursesService.removeStudentFromCourse(courseId, studentId, user.id);
  }
}
