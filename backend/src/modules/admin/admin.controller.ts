import { Controller, Get, Query, UseGuards, Put, Delete, Param, Body, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService, DashboardStats, RecentActivity, TopCourse } from './admin.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { CreateCourseDto } from '../courses/dto/course.dto';
import { User } from '../../models/user.model';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('api/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Lấy thống kê tổng quan cho admin dashboard' })
  @ApiResponse({
    status: 200,
    description: 'Thống kê dashboard thành công',
    schema: {
      type: 'object',
      properties: {
        totalUsers: { type: 'number', description: 'Tổng số người dùng' },
        totalCourses: { type: 'number', description: 'Tổng số khóa học' },
        totalClassrooms: { type: 'number', description: 'Tổng số lớp học' },
        totalAssignments: { type: 'number', description: 'Tổng số bài tập' },
        activeUsers: { type: 'number', description: 'Số người dùng hoạt động' },
        newUsersThisMonth: { type: 'number', description: 'Người dùng mới tháng này' },
        coursesCompleted: { type: 'number', description: 'Khóa học đã hoàn thành' },
        averageCompletionRate: { type: 'number', description: 'Tỷ lệ hoàn thành trung bình' },
        usersByRole: {
          type: 'object',
          properties: {
            admin: { type: 'number' },
            teacher: { type: 'number' },
            student: { type: 'number' },
            parent: { type: 'number' },
          },
        },
        coursesByCategory: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              count: { type: 'number' },
            },
          },
        },
        monthlyStats: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              month: { type: 'string' },
              users: { type: 'number' },
              courses: { type: 'number' },
              classrooms: { type: 'number' },
            },
          },
        },
      },
    },
  })
  async getDashboardStats(@CurrentUser() user: User): Promise<DashboardStats> {
    return this.adminService.getDashboardStats();
  }

  @Get('dashboard/activity')
  @ApiOperation({ summary: 'Lấy hoạt động gần đây' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách hoạt động gần đây',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          type: { type: 'string', enum: ['user_registered', 'course_created', 'classroom_joined', 'assignment_submitted'] },
          user: { type: 'string' },
          description: { type: 'string' },
          timestamp: { type: 'string' },
        },
      },
    },
  })
  async getRecentActivity(
    @CurrentUser() user: User,
    @Query('limit') limit?: string,
  ): Promise<RecentActivity[]> {
    const limitNumber = limit ? parseInt(limit, 10) : 10;
    return this.adminService.getRecentActivity(limitNumber);
  }

  @Get('dashboard/top-courses')
  @ApiOperation({ summary: 'Lấy danh sách khóa học phổ biến' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách khóa học phổ biến',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          students: { type: 'number' },
          completionRate: { type: 'number' },
          rating: { type: 'number' },
        },
      },
    },
  })
  async getTopCourses(
    @CurrentUser() user: User,
    @Query('limit') limit?: string,
  ): Promise<TopCourse[]> {
    const limitNumber = limit ? parseInt(limit, 10) : 10;
    return this.adminService.getTopCourses(limitNumber);
  }

  @Get('users')
  @ApiOperation({ summary: 'Lấy danh sách tất cả người dùng (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách người dùng',
  })
  async getAllUsers(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('role') role?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getAllUsers(
      parseInt(page || '1'),
      parseInt(limit || '10'),
      role,
      search,
    );
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết người dùng' })
  async getUserById(@CurrentUser() user: User, @Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Put('users/:id')
  @ApiOperation({ summary: 'Cập nhật thông tin người dùng' })
  async updateUser(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() updateData: any,
  ) {
    return this.adminService.updateUser(id, updateData);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Xóa người dùng' })
  async deleteUser(@CurrentUser() user: User, @Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Get('courses')
  @ApiOperation({ summary: 'Lấy danh sách tất cả khóa học (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách khóa học',
  })
  async getAllCourses(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getAllCourses(
      parseInt(page || '1'),
      parseInt(limit || '10'),
      status,
      search,
    );
  }

  @Post('courses')
  @ApiOperation({ summary: 'Tạo khóa học mới (admin only), gán giảng viên' })
  @ApiResponse({ status: 201, description: 'Tạo khóa học thành công' })
  async createCourse(
    @CurrentUser() user: any,
    @Body() dto: CreateCourseDto,
  ) {
    // Admin can create and assign teacher via dto.teacherId
    return this.adminService.createCourse({
      title: dto.title,
      slug: dto.slug,
      description: dto.description,
      category: (dto as any).category,
      level: (dto as any).level,
      visibility: dto.visibility as any,
      status: (dto as any).status,
      thumbnail: dto.thumbnail,
      tags: dto.tags,
      teacherId: (dto as any).teacherId,
    });
  }

  @Put('courses/:id/status')
  @ApiOperation({ summary: 'Cập nhật trạng thái khóa học' })
  async updateCourseStatus(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.adminService.updateCourseStatus(id, status);
  }

  @Get('classrooms')
  @ApiOperation({ summary: 'Lấy danh sách tất cả lớp học (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách lớp học',
  })
  async getAllClassrooms(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getAllClassrooms(
      parseInt(page || '1'),
      parseInt(limit || '10'),
      status,
      search,
    );
  }

  @Put('classrooms/:id/status')
  @ApiOperation({ summary: 'Cập nhật trạng thái lớp học' })
  async updateClassroomStatus(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.adminService.updateClassroomStatus(id, status);
  }

  @Get('classrooms/stats')
  @ApiOperation({ summary: 'Lấy thống kê lớp học' })
  async getClassroomStats(@CurrentUser() user: User) {
    return this.adminService.getClassroomStats();
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Lấy dữ liệu analytics chi tiết' })
  @ApiResponse({
    status: 200,
    description: 'Dữ liệu analytics',
    schema: {
      type: 'object',
      properties: {
        userGrowth: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              month: { type: 'string' },
              totalUsers: { type: 'number' },
              students: { type: 'number' },
              teachers: { type: 'number' },
              parents: { type: 'number' },
            },
          },
        },
        coursePerformance: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              status: { type: 'string' },
              category: { type: 'string' },
              level: { type: 'string' },
              classroomCount: { type: 'number' },
              studentCount: { type: 'number' },
              completionRate: { type: 'number' },
            },
          },
        },
        classroomActivity: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              status: { type: 'string' },
              studentCount: { type: 'number' },
              maxStudents: { type: 'number' },
              fillRate: { type: 'number' },
              courseTitle: { type: 'string' },
              teacherName: { type: 'string' },
            },
          },
        },
        systemMetrics: {
          type: 'object',
          properties: {
            dailyActiveUsers: { type: 'number' },
            weeklyActiveUsers: { type: 'number' },
            systemHealth: {
              type: 'object',
              properties: {
                database: { type: 'string' },
                api: { type: 'string' },
                storage: { type: 'string' },
                uptime: { type: 'string' },
              },
            },
          },
        },
      },
    },
  })
  async getAnalyticsData(@CurrentUser() user: User) {
    return this.adminService.getAnalyticsData();
  }
}
