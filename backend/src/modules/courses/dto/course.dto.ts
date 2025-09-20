import { IsString, IsOptional, IsEnum, IsArray, MinLength, IsMongoId, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCourseDto {
  @ApiProperty({ example: 'Tiếng Việt lớp 1' })
  @IsString()
  @MinLength(2)
  title!: string;

  @ApiProperty({ example: 'tieng-viet-1' })
  @IsString()
  @MinLength(2)
  slug!: string;

  @ApiProperty({ example: 'Khóa học Tiếng Việt cho lớp 1' })
  @IsString()
  @MinLength(10)
  description!: string;

  @ApiProperty({ example: 'Tiểu học', enum: ['Toán', 'Tiếng Việt', 'Tiếng Anh', 'Khoa học', 'Tin học', 'Mỹ thuật', 'Âm nhạc'] })
  @IsString()
  @IsIn(['Toán', 'Tiếng Việt', 'Tiếng Anh', 'Khoa học', 'Tin học', 'Mỹ thuật', 'Âm nhạc'])
  category!: string;

  @ApiProperty({ example: 'Lớp 1', enum: ['Lớp 1', 'Lớp 2', 'Lớp 3', 'Lớp 4', 'Lớp 5'] })
  @IsString()
  @IsIn(['Lớp 1', 'Lớp 2', 'Lớp 3', 'Lớp 4', 'Lớp 5'])
  level!: string;

  @ApiProperty({ example: 'published', enum: ['draft', 'published', 'archived'], required: false })
  @IsOptional()
  @IsEnum(['draft', 'published', 'archived'])
  status?: string;

  @ApiProperty({ example: 'https://example.com/thumbnail.jpg', required: false })
  @IsOptional()
  @IsString()
  thumbnail?: string;

  @ApiProperty({ example: ['tieng-viet', 'lop-1'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ example: 'private', enum: ['public', 'private'] })
  @IsEnum(['public', 'private'])
  visibility!: string;

  @ApiProperty({ example: '60f7a1c2d2a3f2b1c8e4f9a0', description: 'Teacher user id (role=teacher)' })
  @IsMongoId()
  teacherId!: string;
}

export class UpdateCourseDto {
  @ApiProperty({ example: 'Tiếng Việt lớp 1', required: false })
  @IsOptional()
  @IsString()
  @MinLength(2)
  title?: string;

  @ApiProperty({ example: 'Khóa học Tiếng Việt cho lớp 1', required: false })
  @IsOptional()
  @IsString()
  @MinLength(10)
  description?: string;

  @ApiProperty({ example: 'https://example.com/thumbnail.jpg', required: false })
  @IsOptional()
  @IsString()
  thumbnail?: string;

  @ApiProperty({ example: ['tieng-viet', 'lop-1'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ example: 'private', enum: ['public', 'private'], required: false })
  @IsOptional()
  @IsEnum(['public', 'private'])
  visibility?: string;
}

export class CourseResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  thumbnail?: string;

  @ApiProperty()
  tags!: string[];

  @ApiProperty()
  createdBy!: string;

  @ApiProperty()
  visibility!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class CreateDocumentDto {
  @ApiProperty({ example: 'courseId mongo id' })
  @IsMongoId()
  courseId!: string;

  @ApiProperty({ example: 'Tài liệu bài 1' })
  @IsString()
  @MinLength(2)
  title!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'https://cdn.example.com/uploads/file.pdf' })
  @IsString()
  fileUrl!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  fileSize?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ example: 'public', enum: ['public', 'private'], required: false })
  @IsOptional()
  @IsEnum(['public', 'private'])
  visibility?: string;

  @ApiProperty({ example: 'published', enum: ['draft', 'published', 'archived'], required: false })
  @IsOptional()
  @IsEnum(['draft', 'published', 'archived'])
  status?: string;
}

export class UpdateDocumentDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(2)
  title?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  fileUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  fileSize?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(['public', 'private'])
  visibility?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(['draft', 'published', 'archived'])
  status?: string;
}