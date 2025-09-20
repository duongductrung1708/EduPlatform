import { IsString, IsOptional, IsNumber, IsArray, IsDateString, MinLength, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAssignmentDto {
  @ApiProperty({ example: 'Bài tập viết chữ A' })
  @IsString()
  @MinLength(2)
  title!: string;

  @ApiProperty({ example: 'Viết 5 lần chữ A vào vở', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ 
    example: [
      { url: 'https://example.com/assignment.pdf', type: 'pdf', name: 'Bài tập.pdf' }
    ], 
    required: false 
  })
  @IsOptional()
  @IsArray()
  attachments?: Array<{
    url: string;
    type: string;
    name?: string;
    size?: number;
  }>;

  @ApiProperty({ example: '2024-12-31T23:59:59.000Z', required: false })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiProperty({ example: 100, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  totalPoints?: number;
}

export class UpdateAssignmentDto {
  @ApiProperty({ example: 'Bài tập viết chữ A', required: false })
  @IsOptional()
  @IsString()
  @MinLength(2)
  title?: string;

  @ApiProperty({ example: 'Viết 5 lần chữ A vào vở', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ 
    example: [
      { url: 'https://example.com/assignment.pdf', type: 'pdf', name: 'Bài tập.pdf' }
    ], 
    required: false 
  })
  @IsOptional()
  @IsArray()
  attachments?: Array<{
    url: string;
    type: string;
    name?: string;
    size?: number;
  }>;

  @ApiProperty({ example: '2024-12-31T23:59:59.000Z', required: false })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiProperty({ example: 100, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  totalPoints?: number;
}

export class CreateSubmissionDto {
  @ApiProperty({ example: 'Em đã hoàn thành bài tập...', required: false })
  @IsOptional()
  @IsString()
  contentText?: string;

  @ApiProperty({ 
    example: [
      { url: 'https://example.com/submission.pdf', type: 'pdf', name: 'Bài làm.pdf' }
    ], 
    required: false 
  })
  @IsOptional()
  @IsArray()
  attachments?: Array<{
    url: string;
    type: string;
    name?: string;
    size?: number;
  }>;
}

export class GradeSubmissionDto {
  @ApiProperty({ example: 85 })
  @IsNumber()
  @Min(0)
  grade!: number;

  @ApiProperty({ example: 'Làm tốt! Cần cải thiện chữ viết.', required: false })
  @IsOptional()
  @IsString()
  feedback?: string;
}

export class AssignmentResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  classroomId!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  description?: string;

  @ApiProperty()
  attachments?: Array<{
    url: string;
    type: string;
    name?: string;
    size?: number;
  }>;

  @ApiProperty()
  dueDate?: Date;

  @ApiProperty()
  totalPoints?: number;

  @ApiProperty()
  createdBy!: string;

  @ApiProperty()
  createdAt!: Date;
}

export class SubmissionResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  assignmentId!: string;

  @ApiProperty()
  studentId!: string;

  @ApiProperty()
  contentText?: string;

  @ApiProperty()
  attachments?: Array<{
    url: string;
    type: string;
    name?: string;
    size?: number;
  }>;

  @ApiProperty()
  submittedAt!: Date;

  @ApiProperty()
  graded?: boolean;

  @ApiProperty()
  grade?: number;

  @ApiProperty()
  feedback?: string;
}
