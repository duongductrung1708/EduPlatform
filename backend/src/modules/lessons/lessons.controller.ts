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

  private mapLesson(doc: any) {
    if (!doc) return doc;
    const plain = typeof doc.toObject === 'function' ? doc.toObject() : doc;
    return {
      _id: String(plain._id),
      classroomId: plain.classroomId ? String(plain.classroomId) : undefined,
      title: plain.title,
      contentHtml: plain.content?.htmlContent,
      attachments: plain.content?.attachments || [],
      order: plain.order,
      topic: plain.topic,
      week: plain.week,
      tags: plain.tags || [],
      createdBy: plain.createdBy,
      createdAt: plain.createdAt,
      updatedAt: plain.updatedAt,
    };
  }

  @Post()
  @Roles('teacher', 'admin')
  @ApiOperation({ summary: 'Create a new lesson (teacher/admin only)' })
  @ApiResponse({ status: 201, description: 'Lesson created successfully', type: LessonResponseDto })
  async create(
    @Param('classroomId') classroomId: string,
    @Body() createLessonDto: CreateLessonDto,
    @CurrentUser() user: any,
  ) {
    const created = await this.lessonsService.create(classroomId, createLessonDto, user.id);
    return this.mapLesson(created);
  }

  @Get()
  @ApiOperation({ summary: 'Get all lessons in a classroom' })
  @ApiResponse({ status: 200, description: 'List of lessons' })
  async findAll(
    @Param('classroomId') classroomId: string,
    @CurrentUser() user: any,
  ) {
    const list = await this.lessonsService.findAll(classroomId, user.id);
    return list.map(l => this.mapLesson(l));
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
    const lesson = await this.lessonsService.findOne(id, user.id);
    return this.mapLesson(lesson);
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
    const updated = await this.lessonsService.update(id, updateLessonDto, user.id);
    return this.mapLesson(updated);
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
