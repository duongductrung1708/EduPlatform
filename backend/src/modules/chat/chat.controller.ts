import { Controller, Get, Query, UseGuards, Patch, Body, Param, Delete } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { CurrentUser } from '../../decorators/current-user.decorator';

@ApiTags('chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Get('classroom')
  @ApiOperation({ summary: 'List chat messages by classroom' })
  async listClass(@Query('classroomId') classroomId: string, @Query('limit') limit?: string) {
    return this.chatService.listClassMessages(classroomId, limit ? Number(limit) : 50);
  }

  @Get('lesson')
  @ApiOperation({ summary: 'List chat messages by lesson' })
  async listLesson(@Query('lessonId') lessonId: string, @Query('limit') limit?: string) {
    return this.chatService.listLessonMessages(lessonId, limit ? Number(limit) : 50);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edit a chat message (author or teacher)' })
  async edit(
    @Param('id') id: string,
    @Body() body: { message: string },
    @CurrentUser() user: any,
  ) {
    return this.chatService.editMessage(id, String(user.id), body?.message || '');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a chat message (author or teacher)' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.chatService.deleteMessage(id, String(user.id));
  }
}


