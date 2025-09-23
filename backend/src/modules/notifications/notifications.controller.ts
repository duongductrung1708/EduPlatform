import { Controller, Get, Post, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../../decorators/current-user.decorator';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('api/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List notifications for current user' })
  async list(@CurrentUser() user: any, @Query('limit') limit?: string) {
    const n = await this.notificationsService.list(String(user._id || user.id), limit ? Number(limit) : 20);
    const unread = await this.notificationsService.countUnread(String(user._id || user.id));
    return { items: n, unread };
  }

  @Post('mark-read/:id')
  @ApiOperation({ summary: 'Mark one notification as read' })
  async markRead(@CurrentUser() user: any, @Param('id') id: string) {
    await this.notificationsService.markRead(String(user._id || user.id), id);
    const unread = await this.notificationsService.countUnread(String(user._id || user.id));
    return { success: true, unread };
  }

  @Post('mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllRead(@CurrentUser() user: any) {
    await this.notificationsService.markAllRead(String(user._id || user.id));
    return { success: true, unread: 0 };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    await this.notificationsService.remove(String(user._id || user.id), id);
    const unread = await this.notificationsService.countUnread(String(user._id || user.id));
    return { success: true, unread };
  }
}


