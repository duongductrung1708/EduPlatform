import { IsString, IsOptional, IsArray, IsDateString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateClassroomDto {
  @ApiProperty({ example: 'TV1 - Sáng' })
  @IsString()
  @MinLength(2)
  title!: string;

  @ApiProperty({ example: 'course-id-here', required: false })
  @IsOptional()
  @IsString()
  courseId?: string;

  @ApiProperty({ example: ['teacher-id-1', 'teacher-id-2'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  teacherIds?: string[];

  @ApiProperty({ example: ['assistant-id-1'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assistantIds?: string[];

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ example: '2024-12-31T23:59:59.000Z', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ example: 'Asia/Ho_Chi_Minh', required: false })
  @IsOptional()
  @IsString()
  timezone?: string;
}

export class UpdateClassroomDto {
  @ApiProperty({ example: 'TV1 - Sáng', required: false })
  @IsOptional()
  @IsString()
  @MinLength(2)
  title?: string;

  @ApiProperty({ example: ['teacher-id-1', 'teacher-id-2'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  teacherIds?: string[];

  @ApiProperty({ example: ['assistant-id-1'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assistantIds?: string[];

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ example: '2024-12-31T23:59:59.000Z', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ example: 'Asia/Ho_Chi_Minh', required: false })
  @IsOptional()
  @IsString()
  timezone?: string;
}

export class JoinClassroomDto {
  @ApiProperty({ example: 'TV1-ABC' })
  @IsString()
  inviteCode!: string;
}

export class InviteStudentDto {
  @ApiProperty({ example: 'student@example.com' })
  @IsString()
  email!: string;
}

export class ClassroomResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  courseId?: string;

  @ApiProperty()
  teacherIds!: string[];

  @ApiProperty()
  assistantIds!: string[];

  @ApiProperty()
  studentIds!: string[];

  @ApiProperty()
  inviteCode?: string;

  @ApiProperty()
  schedule?: {
    startDate: Date;
    endDate?: Date;
    timezone?: string;
  };

  @ApiProperty()
  createdAt!: Date;
}
