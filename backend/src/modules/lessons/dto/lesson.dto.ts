import { IsString, IsOptional, IsNumber, IsArray, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLessonDto {
  @ApiProperty({ example: 'Bài 1: Học chữ cái A' })
  @IsString()
  @MinLength(2)
  title!: string;

  @ApiProperty({ example: '<p>Nội dung bài học...</p>', required: false })
  @IsOptional()
  @IsString()
  contentHtml?: string;

  @ApiProperty({ 
    example: [
      { url: 'https://example.com/file.pdf', type: 'pdf', name: 'Bài tập.pdf' }
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

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  order?: number;

  @ApiProperty({ example: 'Tuần 1', required: false })
  @IsOptional()
  @IsString()
  topic?: string;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  week?: number;

  @ApiProperty({ example: ['Toán', 'Ôn tập'], required: false })
  @IsOptional()
  @IsArray()
  tags?: string[];
}

export class UpdateLessonDto {
  @ApiProperty({ example: 'Bài 1: Học chữ cái A', required: false })
  @IsOptional()
  @IsString()
  @MinLength(2)
  title?: string;

  @ApiProperty({ example: '<p>Nội dung bài học...</p>', required: false })
  @IsOptional()
  @IsString()
  contentHtml?: string;

  @ApiProperty({ 
    example: [
      { url: 'https://example.com/file.pdf', type: 'pdf', name: 'Bài tập.pdf' }
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

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  order?: number;

  @ApiProperty({ example: 'Tuần 1', required: false })
  @IsOptional()
  @IsString()
  topic?: string;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  week?: number;

  @ApiProperty({ example: ['Toán', 'Ôn tập'], required: false })
  @IsOptional()
  @IsArray()
  tags?: string[];
}

export class LessonResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  classroomId!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  contentHtml?: string;

  @ApiProperty()
  attachments?: Array<{
    url: string;
    type: string;
    name?: string;
    size?: number;
  }>;

  @ApiProperty()
  order?: number;

  @ApiProperty()
  topic?: string;

  @ApiProperty()
  week?: number;

  @ApiProperty({ type: [String] })
  tags?: string[];

  @ApiProperty()
  createdBy!: string;

  @ApiProperty()
  createdAt!: Date;
}
