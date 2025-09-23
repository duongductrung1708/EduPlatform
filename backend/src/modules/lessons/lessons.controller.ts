import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { Roles } from '../../decorators/roles.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { LessonsService } from './lessons.service';
import { CreateLessonDto, UpdateLessonDto, LessonResponseDto } from './dto/lesson.dto';

@ApiTags('lessons')
@Controller('api/classes/:classroomId/lessons')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Post()
  @Roles('teacher', 'admin')
  @ApiOperation({ summary: 'Create a new lesson (teacher/admin only)' })
  @ApiResponse({ status: 201, description: 'Lesson created successfully', type: LessonResponseDto })
  async create(
    @Param('classroomId') classroomId: string,
    @Body() createLessonDto: CreateLessonDto,
    @CurrentUser() user: any,
  ) {
    return this.lessonsService.create(classroomId, createLessonDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all lessons in a classroom' })
  @ApiResponse({ status: 200, description: 'List of lessons' })
  async findAll(
    @Param('classroomId') classroomId: string,
    @CurrentUser() user: any,
  ) {
    return this.lessonsService.findAll(classroomId, user.id);
  }

  @Get('/:lessonId/detail')
  @ApiOperation({ summary: 'Get lesson detail by id (for mention context)' })
  async findById(
    @Param('lessonId') lessonId: string,
  ) {
    return this.lessonsService.findById(lessonId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lesson by ID' })
  @ApiResponse({ status: 200, description: 'Lesson details', type: LessonResponseDto })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.lessonsService.findOne(id, user.id);
  }

  @Patch(':id')
  @Roles('teacher', 'admin')
  @ApiOperation({ summary: 'Update lesson (teacher/admin only)' })
  @ApiResponse({ status: 200, description: 'Lesson updated successfully', type: LessonResponseDto })
  async update(
    @Param('id') id: string,
    @Body() updateLessonDto: UpdateLessonDto,
    @CurrentUser() user: any,
  ) {
    return this.lessonsService.update(id, updateLessonDto, user.id);
  }

  @Delete(':id')
  @Roles('teacher', 'admin')
  @ApiOperation({ summary: 'Delete lesson (teacher/admin only)' })
  @ApiResponse({ status: 200, description: 'Lesson deleted successfully' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    await this.lessonsService.remove(id, user.id);
    return { message: 'Lesson deleted successfully' };
  }
}
