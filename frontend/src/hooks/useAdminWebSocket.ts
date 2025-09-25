import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';

interface AnalyticsData {
  userGrowth: any[];
  coursePerformance: any[];
  classroomActivity: any[];
  systemMetrics: {
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    systemHealth: {
      database: string;
      api: string;
      storage: string;
      uptime: string;
    };
  };
}

interface DashboardStats {
  totalUsers: number;
  totalCourses: number;
  totalClassrooms: number;
  totalAssignments: number;
  activeUsers: number;
  newUsersThisMonth: number;
  coursesCompleted: number;
  averageCompletionRate: number;
  usersByRole: {
    admin: number;
    teacher: number;
    student: number;
    parent: number;
  };
  coursesByCategory: { category: string; count: number }[];
  monthlyStats: { month: string; users: number; courses: number; classrooms: number }[];
}

interface AdminNotification {
  type: 'user_registered' | 'course_created' | 'classroom_created' | 'system_alert';
  message: string;
  timestamp: string;
  data?: any;
}

export const useAdminWebSocket = () => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [error, setError] = useState<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!user || user.role !== 'admin' || !token) {
      return;
    }

    const connectSocket = () => {
      const backendUrl = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:3000';
      const newSocket = io(`${backendUrl}/admin`, {
        auth: {
          token: token,
        },
        transports: ['websocket', 'polling'],
      });

      newSocket.on('connect', () => {
        setIsConnected(true);
        setError(null);
        
        // Clear any existing reconnect timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
      });

      newSocket.on('disconnect', (reason) => {
        setIsConnected(false);
        
        // Attempt to reconnect after 5 seconds
        if (reason === 'io server disconnect') {
          // Server disconnected, try to reconnect
          reconnectTimeoutRef.current = setTimeout(() => {
            connectSocket();
          }, 5000);
        }
      });

      newSocket.on('connect_error', (error) => {
        console.error('Admin WebSocket connection error:', error);
        setError('Không thể kết nối WebSocket');
        setIsConnected(false);
      });

      // Analytics data updates
      newSocket.on('analyticsUpdate', (data: AnalyticsData) => {
        setAnalyticsData(data);
      });

      newSocket.on('analyticsError', (error: { message: string }) => {
        console.error('Analytics error:', error);
        setError(error.message);
      });

      // Dashboard stats updates
      newSocket.on('dashboardStatsUpdate', (data: DashboardStats) => {
        setDashboardStats(data);
      });

      newSocket.on('dashboardStatsError', (error: { message: string }) => {
        console.error('Dashboard stats error:', error);
        setError(error.message);
      });

      // Admin notifications
      newSocket.on('adminNotification', (notification: AdminNotification) => {
        setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep last 10 notifications
      });

      setSocket(newSocket);
    };

    connectSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socket) {
        socket.disconnect();
      }
    };
  }, [user, token]);

  const requestAnalytics = () => {
    if (socket && isConnected) {
      socket.emit('requestAnalytics');
    }
  };

  const requestDashboardStats = () => {
    if (socket && isConnected) {
      socket.emit('requestDashboardStats');
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return {
    socket,
    isConnected,
    analyticsData,
    dashboardStats,
    notifications,
    error,
    requestAnalytics,
    requestDashboardStats,
    clearNotifications,
  };
};
