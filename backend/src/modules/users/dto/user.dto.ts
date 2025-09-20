import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({ example: 'John Doe', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'My School', required: false })
  @IsOptional()
  @IsString()
  organization?: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg', required: false })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  verified?: boolean;

  @ApiProperty({ 
    example: { kidMode: true, locale: 'vi' }, 
    required: false 
  })
  @IsOptional()
  settings?: {
    kidMode?: boolean;
    locale?: string;
  };
}

export class UserResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  role!: string;

  @ApiProperty()
  avatarUrl?: string;

  @ApiProperty()
  organization?: string;

  @ApiProperty()
  verified!: boolean;

  @ApiProperty()
  settings?: {
    kidMode?: boolean;
    locale?: string;
  };

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
