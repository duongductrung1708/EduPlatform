import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AdminService } from './admin.service';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
  namespace: '/admin',
})
export class AdminGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedAdmins = new Map<string, Socket>();

  constructor(
    private jwtService: JwtService,
    private adminService: AdminService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      
      if (payload.role !== 'admin') {
        client.disconnect();
        return;
      }

      this.connectedAdmins.set(client.id, client);
      console.log(`Admin connected: ${payload.email} (${client.id})`);
      
      // Send initial analytics data
      this.sendAnalyticsUpdate(client);
      
      // Start real-time updates
      this.startRealTimeUpdates(client);
      
    } catch (error) {
      console.error('Admin connection error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.connectedAdmins.delete(client.id);
    console.log(`Admin disconnected: ${client.id}`);
  }

  @SubscribeMessage('requestAnalytics')
  async handleRequestAnalytics(@ConnectedSocket() client: Socket) {
    try {
      const analyticsData = await this.adminService.getAnalyticsData();
      client.emit('analyticsUpdate', analyticsData);
    } catch (error) {
      client.emit('analyticsError', { message: 'Không thể lấy dữ liệu analytics' });
    }
  }

  @SubscribeMessage('requestDashboardStats')
  async handleRequestDashboardStats(@ConnectedSocket() client: Socket) {
    try {
      const stats = await this.adminService.getDashboardStats();
      client.emit('dashboardStatsUpdate', stats);
    } catch (error) {
      client.emit('dashboardStatsError', { message: 'Không thể lấy thống kê dashboard' });
    }
  }

  private async sendAnalyticsUpdate(client: Socket) {
    try {
      const analyticsData = await this.adminService.getAnalyticsData();
      client.emit('analyticsUpdate', analyticsData);
    } catch (error) {
      console.error('Error sending analytics update:', error);
    }
  }

  private startRealTimeUpdates(client: Socket) {
    // Send updates every 30 seconds
    const interval = setInterval(async () => {
      if (this.connectedAdmins.has(client.id)) {
        await this.sendAnalyticsUpdate(client);
      } else {
        clearInterval(interval);
      }
    }, 30000);

    // Store interval for cleanup
    client.data.interval = interval;
  }

  // Broadcast to all connected admins
  async broadcastAnalyticsUpdate() {
    try {
      const analyticsData = await this.adminService.getAnalyticsData();
      this.server.emit('analyticsUpdate', analyticsData);
    } catch (error) {
      console.error('Error broadcasting analytics update:', error);
    }
  }

  async broadcastDashboardStatsUpdate() {
    try {
      const stats = await this.adminService.getDashboardStats();
      this.server.emit('dashboardStatsUpdate', stats);
    } catch (error) {
      console.error('Error broadcasting dashboard stats update:', error);
    }
  }

  // Notify admins about important events
  async notifyAdminEvent(event: {
    type: 'user_registered' | 'course_created' | 'classroom_created' | 'system_alert';
    message: string;
    data?: any;
  }) {
    this.server.emit('adminNotification', {
      ...event,
      timestamp: new Date().toISOString(),
    });
  }

  // Get connected admins count
  getConnectedAdminsCount(): number {
    return this.connectedAdmins.size;
  }
}
