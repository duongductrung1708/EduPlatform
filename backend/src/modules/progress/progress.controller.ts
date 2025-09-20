import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { ProgressService } from './progress.service';

@Controller('api/progress')
@UseGuards(JwtAuthGuard)
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Post('enroll/:courseId')
  @UseGuards(RolesGuard)
  @Roles('student')
  async enrollInCourse(@Param('courseId') courseId: string, @Request() req) {
    return await this.progressService.enrollInCourse(req.user._id, courseId);
  }

  @Get('enrollment/:courseId')
  async checkEnrollment(@Param('courseId') courseId: string, @Request() req) {
    return await this.progressService.checkEnrollment(req.user._id, courseId);
  }

  @Post('complete-lesson/:lessonId')
  @UseGuards(RolesGuard)
  @Roles('student')
  async completeLesson(@Param('lessonId') lessonId: string, @Request() req) {
    return await this.progressService.completeLesson(req.user._id, lessonId);
  }

  @Post('rate-course/:courseId')
  @UseGuards(RolesGuard)
  @Roles('student')
  async rateCourse(
    @Param('courseId') courseId: string,
    @Body() body: { rating: number; review?: string },
    @Request() req,
  ) {
    return await this.progressService.rateCourse(req.user._id, courseId, body.rating, body.review);
  }

  @Get('student-progress')
  @UseGuards(RolesGuard)
  @Roles('student')
  async getStudentProgress(@Request() req) {
    return await this.progressService.getStudentProgress(req.user._id);
  }

  @Get('student-badges')
  @UseGuards(RolesGuard)
  @Roles('student')
  async getStudentBadges(@Request() req) {
    return await this.progressService.getStudentBadges(req.user._id);
  }

  @Post('badges')
  @UseGuards(RolesGuard)
  @Roles('teacher', 'admin')
  async createBadge(@Body() badgeData: any) {
    return await this.progressService.createBadge(badgeData);
  }

  @Get('badges')
  async getBadges() {
    return await this.progressService.getBadges();
  }
}
