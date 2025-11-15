import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Alert,
  Skeleton,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Tooltip,
  Zoom,
  Badge,
  Snackbar,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Speed as SpeedIcon,
  Storage as StorageIcon,
  Api as ApiIcon,
  Cloud as CloudIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { adminApi } from '../api/admin';
import AdminLayout from '../components/AdminLayout';
import StatsChart from '../components/charts/StatsChart';
import { useAdminWebSocket } from '../hooks/useAdminWebSocket';

interface UserGrowthData {
  month: string;
  totalUsers: number;
  students: number;
  teachers: number;
  parents: number;
}

interface CoursePerformanceData {
  title: string;
  status: string;
  category: string;
  level: string;
  classroomCount: number;
  studentCount: number;
  completionRate: number;
}

interface ClassroomActivityData {
  name: string;
  status: string;
  studentCount: number;
  maxStudents: number;
  fillRate: number;
  courseTitle: string;
  teacherName: string;
}

interface SystemMetrics {
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  systemHealth: {
    database: string;
    api: string;
    storage: string;
    uptime: string;
  };
}

const AnalyticsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  // WebSocket hook
  const {
    isConnected,
    analyticsData,
    notifications,
    error: wsError,
    requestAnalytics,
    clearNotifications,
  } = useAdminWebSocket();

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  // Show notifications
  useEffect(() => {
    if (notifications.length > 0) {
      const latestNotification = notifications[0];
      setNotificationMessage(latestNotification.message);
      setShowNotification(true);
    }
  }, [notifications]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getAnalyticsData();
      setLastUpdated(new Date());
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      console.error('Analytics API Error:', error);
      setError(error.response?.data?.message || 'Không thể tải dữ liệu analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (isConnected) {
      requestAnalytics();
    } else {
      fetchAnalyticsData();
    }
    setLastUpdated(new Date());
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircleIcon />;
      case 'warning':
        return <WarningIcon />;
      case 'error':
        return <ErrorIcon />;
      default:
        return <CheckCircleIcon />;
    }
  };

  const getFillRateColor = (fillRate: number) => {
    if (fillRate >= 90) return 'error';
    if (fillRate >= 70) return 'warning';
    return 'success';
  };

  if (loading) {
    return (
      <AdminLayout>
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              Analytics & Báo Cáo
            </Typography>
            <Skeleton variant="rectangular" width={100} height={40} sx={{ borderRadius: 2 }} />
          </Box>
          <Grid container spacing={3}>
            {[...Array(8)].map((_, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
              </Grid>
            ))}
          </Grid>
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Analytics & Báo Cáo
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* WebSocket Status */}
            <Tooltip title={isConnected ? 'Kết nối real-time' : 'Mất kết nối real-time'}>
              <Chip
                icon={isConnected ? <WifiIcon /> : <WifiOffIcon />}
                label={isConnected ? 'Real-time' : 'Offline'}
                color={isConnected ? 'success' : 'error'}
                size="small"
              />
            </Tooltip>

            {/* Notifications */}
            <Tooltip title="Thông báo admin">
              <IconButton onClick={clearNotifications} color="primary">
                <Badge badgeContent={notifications.length} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            {lastUpdated && (
              <Typography variant="caption" color="textSecondary">
                Cập nhật: {lastUpdated.toLocaleTimeString('vi-VN')}
              </Typography>
            )}
            
            <IconButton onClick={handleRefresh} color="primary">
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>

        {(wsError || error) && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            {wsError || error}
          </Alert>
        )}

        {!isConnected && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Đang kết nối real-time... Dữ liệu sẽ được cập nhật tự động khi kết nối thành công.
          </Alert>
        )}

        {!loading && analyticsData && (
          analyticsData.userGrowth.length === 0 && 
          analyticsData.coursePerformance.length === 0 && 
          analyticsData.classroomActivity.length === 0
        ) && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Chưa có dữ liệu analytics. Dữ liệu sẽ được cập nhật real-time khi có hoạt động mới.
          </Alert>
        )}

        {/* System Metrics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Zoom in={true} style={{ transitionDelay: '100ms' }}>
              <Card sx={{ borderRadius: 3, background: 'linear-gradient(45deg, #4CAF50 30%, #81C784 90%)', color: 'white' }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <PeopleIcon sx={{ fontSize: 40 }} />
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {analyticsData?.systemMetrics.dailyActiveUsers || 0}
                    </Typography>
                  </Box>
                  <Typography variant="subtitle1">Người dùng hoạt động hôm nay</Typography>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Zoom in={true} style={{ transitionDelay: '200ms' }}>
              <Card sx={{ borderRadius: 3, background: 'linear-gradient(45deg, #2196F3 30%, #64B5F6 90%)', color: 'white' }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <TrendingUpIcon sx={{ fontSize: 40 }} />
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {analyticsData?.systemMetrics.weeklyActiveUsers || 0}
                    </Typography>
                  </Box>
                  <Typography variant="subtitle1">Người dùng hoạt động tuần này</Typography>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Zoom in={true} style={{ transitionDelay: '300ms' }}>
              <Card sx={{ borderRadius: 3, background: 'linear-gradient(45deg, #FF9800 30%, #FFB74D 90%)', color: 'white' }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <SpeedIcon sx={{ fontSize: 40 }} />
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {analyticsData?.systemMetrics.systemHealth.uptime || '99.9%'}
                    </Typography>
                  </Box>
                  <Typography variant="subtitle1">Uptime hệ thống</Typography>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Zoom in={true} style={{ transitionDelay: '400ms' }}>
              <Card sx={{ borderRadius: 3, background: 'linear-gradient(45deg, #9C27B0 30%, #BA68C8 90%)', color: 'white' }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <CheckCircleIcon sx={{ fontSize: 40 }} />
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {analyticsData?.systemMetrics.systemHealth.database === 'healthy' ? '100%' : '95%'}
                    </Typography>
                  </Box>
                  <Typography variant="subtitle1">Hiệu suất hệ thống</Typography>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>
        </Grid>

        {/* Charts Section */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
              <StatsChart
                data={analyticsData?.userGrowth || []}
                title="Tăng trưởng người dùng theo tháng"
                type="area"
                dataKey="totalUsers"
                xAxisKey="month"
                color="#667eea"
                height={350}
              />
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Tình trạng hệ thống
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <StorageIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="body2" sx={{ flexGrow: 1 }}>Database</Typography>
                  <Chip
                    icon={getStatusIcon(analyticsData?.systemMetrics.systemHealth.database || 'healthy')}
                    label={analyticsData?.systemMetrics.systemHealth.database || 'healthy'}
                    color={getStatusColor(analyticsData?.systemMetrics.systemHealth.database || 'healthy') as 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'}
                    size="small"
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <ApiIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="body2" sx={{ flexGrow: 1 }}>API</Typography>
                  <Chip
                    icon={getStatusIcon(analyticsData?.systemMetrics.systemHealth.api || 'healthy')}
                    label={analyticsData?.systemMetrics.systemHealth.api || 'healthy'}
                    color={getStatusColor(analyticsData?.systemMetrics.systemHealth.api || 'healthy') as 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'}
                    size="small"
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CloudIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="body2" sx={{ flexGrow: 1 }}>Storage</Typography>
                  <Chip
                    icon={getStatusIcon(analyticsData?.systemMetrics.systemHealth.storage || 'healthy')}
                    label={analyticsData?.systemMetrics.systemHealth.storage || 'healthy'}
                    color={getStatusColor(analyticsData?.systemMetrics.systemHealth.storage || 'healthy') as 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'}
                    size="small"
                  />
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Performance Tables */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Top Khóa Học Hiệu Suất
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Khóa học</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Học sinh</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Hoàn thành</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(analyticsData?.coursePerformance || []).slice(0, 5).map((course, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {course.title}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {course.category} • {course.level}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {course.studentCount}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                            <LinearProgress
                              variant="determinate"
                              value={course.completionRate}
                              sx={{ width: 60, mr: 1 }}
                            />
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {course.completionRate}%
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Lớp Học Hoạt Động
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Lớp học</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Đầy lớp</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Trạng thái</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(analyticsData?.classroomActivity || []).slice(0, 5).map((classroom, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {classroom.name}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {classroom.courseTitle} • {classroom.teacherName}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                            <LinearProgress
                              variant="determinate"
                              value={classroom.fillRate}
                              color={getFillRateColor(classroom.fillRate) as 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'}
                              sx={{ width: 60, mr: 1 }}
                            />
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {Math.round(classroom.fillRate)}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={classroom.status}
                            color={classroom.status === 'active' ? 'success' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>

        {/* User Growth by Role Chart */}
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <StatsChart
                data={analyticsData?.userGrowth || []}
                title="Tăng trưởng người dùng theo vai trò"
                type="bar"
                dataKey="students"
                xAxisKey="month"
                color="#8884d8"
                height={300}
              />
            </Paper>
          </Grid>
        </Grid>

        {/* Notification Snackbar */}
        <Snackbar
          open={showNotification}
          autoHideDuration={6000}
          onClose={() => setShowNotification(false)}
          message={notificationMessage}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        />
      </Box>
    </AdminLayout>
  );
};

export default AnalyticsPage;
