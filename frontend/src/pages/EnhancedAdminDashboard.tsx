import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  LinearProgress,
  IconButton,
  Tooltip,
  Fab,
  Badge,
  Alert,
  Skeleton,
  Fade,
  Zoom,
} from '@mui/material';
import {
  People as PeopleIcon,
  School as SchoolIcon,
  Class as ClassIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Storage as StorageIcon,
  Speed as SpeedIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { adminApi, DashboardStats, RecentActivity, TopCourse } from '../api/admin';
import StatsChart from '../components/charts/StatsChart';
import AdminLayout from '../components/AdminLayout';

const EnhancedAdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [topCourses, setTopCourses] = useState<TopCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [statsData, activityData, coursesData] = await Promise.all([
        adminApi.getDashboardStats(),
        adminApi.getRecentActivity(10),
        adminApi.getTopCourses(10),
      ]);
      
      setStats(statsData);
      setRecentActivity(activityData);
      setTopCourses(coursesData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Không thể tải dữ liệu dashboard. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };


  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_registered':
        return <PeopleIcon color="primary" />;
      case 'course_created':
        return <SchoolIcon color="success" />;
      case 'classroom_joined':
        return <ClassIcon color="info" />;
      case 'assignment_submitted':
        return <AssignmentIcon color="warning" />;
      default:
        return <PeopleIcon />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'user_registered':
        return 'primary';
      case 'course_created':
        return 'success';
      case 'classroom_joined':
        return 'info';
      case 'assignment_submitted':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  // Process real data for charts
  const monthlyData = stats?.monthlyStats && stats.monthlyStats.length > 0 
    ? stats.monthlyStats.map(item => ({
        month: item.month,
        users: item.users,
        courses: item.courses,
        classrooms: item.classrooms
      }))
    : [
        { month: 'T1', users: stats?.totalUsers || 0, courses: stats?.totalCourses || 0, classrooms: stats?.totalClassrooms || 0 },
        { month: 'T2', users: 0, courses: 0, classrooms: 0 },
        { month: 'T3', users: 0, courses: 0, classrooms: 0 },
        { month: 'T4', users: 0, courses: 0, classrooms: 0 },
        { month: 'T5', users: 0, courses: 0, classrooms: 0 },
        { month: 'T6', users: 0, courses: 0, classrooms: 0 },
      ];

  const userRoleData = stats ? [
    { name: 'Students', value: stats.usersByRole.student, color: '#0088FE' },
    { name: 'Teachers', value: stats.usersByRole.teacher, color: '#00C49F' },
    { name: 'Parents', value: stats.usersByRole.parent, color: '#FFBB28' },
    { name: 'Admins', value: stats.usersByRole.admin, color: '#FF8042' },
  ].filter(item => item.value > 0) : [];

  const systemHealthData = [
    { name: 'Server', status: 'active', value: 98 },
    { name: 'Database', status: 'active', value: 95 },
    { name: 'Storage', status: 'warning', value: 78 },
    { name: 'API', status: 'active', value: 99 },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <Box sx={{ p: 3 }}>
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
        {/* Error Alert */}
        {error && (
          <Fade in={!!error}>
            <Alert 
              severity="error" 
              sx={{ mb: 3 }}
              action={
                <IconButton
                  aria-label="close"
                  color="inherit"
                  size="small"
                  onClick={() => setError(null)}
                >
                  <RefreshIcon />
                </IconButton>
              }
            >
              {error}
            </Alert>
          </Fade>
        )}

        {/* Header with Quick Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
              Dashboard Overview
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Chào mừng trở lại, {user?.name}! Đây là tổng quan về hệ thống.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Tooltip title="Làm mới dữ liệu">
              <IconButton 
                onClick={fetchDashboardData} 
                color="primary"
                sx={{ 
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'primary.dark' }
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Fab 
              color="primary" 
              size="medium"
              onClick={() => {/* Navigate to create new item */}}
            >
              <AddIcon />
            </Fab>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Zoom in={true} style={{ transitionDelay: '0ms' }}>
              <Card 
                sx={{ 
                  height: '100%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  borderRadius: 3,
                  boxShadow: 3,
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 2 }}>
                      <PeopleIcon />
                    </Avatar>
                    <Box>
                      <Typography color="rgba(255,255,255,0.8)" gutterBottom>
                        Tổng người dùng
                      </Typography>
                      <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                        {stats?.totalUsers.toLocaleString() || 0}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TrendingUpIcon sx={{ mr: 1, color: 'rgba(255,255,255,0.8)' }} />
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      +{stats?.newUsersThisMonth || 0} tháng này
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Zoom in={true} style={{ transitionDelay: '100ms' }}>
              <Card 
                sx={{ 
                  height: '100%',
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  color: 'white',
                  borderRadius: 3,
                  boxShadow: 3,
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 2 }}>
                      <SchoolIcon />
                    </Avatar>
                    <Box>
                      <Typography color="rgba(255,255,255,0.8)" gutterBottom>
                        Khóa học
                      </Typography>
                      <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                        {stats?.totalCourses || 0}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TrendingUpIcon sx={{ mr: 1, color: 'rgba(255,255,255,0.8)' }} />
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      +12 tuần này
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Zoom in={true} style={{ transitionDelay: '200ms' }}>
              <Card 
                sx={{ 
                  height: '100%',
                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  color: 'white',
                  borderRadius: 3,
                  boxShadow: 3,
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 2 }}>
                      <ClassIcon />
                    </Avatar>
                    <Box>
                      <Typography color="rgba(255,255,255,0.8)" gutterBottom>
                        Lớp học
                      </Typography>
                      <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                        {stats?.totalClassrooms || 0}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TrendingUpIcon sx={{ mr: 1, color: 'rgba(255,255,255,0.8)' }} />
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      +8 tuần này
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Zoom in={true} style={{ transitionDelay: '300ms' }}>
              <Card 
                sx={{ 
                  height: '100%',
                  background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                  color: 'white',
                  borderRadius: 3,
                  boxShadow: 3,
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 2 }}>
                      <AssignmentIcon />
                    </Avatar>
                    <Box>
                      <Typography color="rgba(255,255,255,0.8)" gutterBottom>
                        Bài tập
                      </Typography>
                      <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                        {stats?.totalAssignments || 0}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TrendingUpIcon sx={{ mr: 1, color: 'rgba(255,255,255,0.8)' }} />
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      +23 tuần này
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>
        </Grid>

        {/* Charts Section */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={8}>
            <StatsChart
              data={monthlyData}
              title="Thống kê theo tháng"
              type="area"
              dataKey="users"
              xAxisKey="month"
              color="#667eea"
              height={300}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <StatsChart
              data={userRoleData}
              title="Phân bố người dùng"
              type="pie"
              dataKey="value"
              height={300}
            />
          </Grid>
        </Grid>

        {/* Overview Chart */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12}>
            <StatsChart
              data={[
                { name: 'Users', value: stats?.totalUsers || 0, color: '#0088FE' },
                { name: 'Courses', value: stats?.totalCourses || 0, color: '#00C49F' },
                { name: 'Classrooms', value: stats?.totalClassrooms || 0, color: '#FFBB28' },
                { name: 'Assignments', value: stats?.totalAssignments || 0, color: '#FF8042' },
              ]}
              title="Tổng quan hệ thống"
              type="bar"
              dataKey="value"
              xAxisKey="name"
              color="#8884d8"
              height={250}
            />
          </Grid>
        </Grid>

        {/* System Health & Recent Activity */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Paper 
              elevation={2} 
              sx={{ 
                p: 3, 
                borderRadius: 3,
                background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium', mb: 3 }}>
                <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Tình trạng hệ thống
              </Typography>
              {systemHealthData.map((item, index) => (
                <Box key={`health-${item.name}-${index}`} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" fontWeight="medium">
                      {item.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {item.status === 'active' && <CheckCircleIcon color="success" sx={{ mr: 1, fontSize: 16 }} />}
                      {item.status === 'warning' && <WarningIcon color="warning" sx={{ mr: 1, fontSize: 16 }} />}
                      {item.status === 'error' && <ErrorIcon color="error" sx={{ mr: 1, fontSize: 16 }} />}
                      <Typography variant="body2" color="textSecondary">
                        {item.value}%
                      </Typography>
                    </Box>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={item.value}
                    color={getStatusColor(item.status) as any}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
              ))}
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper 
              elevation={2} 
              sx={{ 
                p: 3, 
                borderRadius: 3,
                background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium', mb: 3 }}>
                <NotificationsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Hoạt động gần đây
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    {recentActivity.slice(0, 5).map((activity, index) => (
                      <Fade in={true} key={`activity-${activity.id}-${index}`} style={{ transitionDelay: `${index * 100}ms` }}>
                        <TableRow>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {getActivityIcon(activity.type)}
                              <Box sx={{ ml: 2 }}>
                                <Typography variant="body2" fontWeight="medium">
                                  {activity.user}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {activity.description}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={activity.timestamp}
                              size="small"
                              color={getActivityColor(activity.type) as any}
                              variant="outlined"
                            />
                          </TableCell>
                        </TableRow>
                      </Fade>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>

        {/* Top Courses */}
        <Paper 
          elevation={2} 
          sx={{ 
            p: 3, 
            borderRadius: 3,
            background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium', mb: 3 }}>
            <SchoolIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Khóa học phổ biến
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Khóa học</TableCell>
                  <TableCell align="right">Học sinh</TableCell>
                  <TableCell align="right">Hoàn thành</TableCell>
                  <TableCell align="right">Đánh giá</TableCell>
                  <TableCell align="right">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {topCourses.map((course, index) => (
                  <Fade in={true} key={`course-${course.id}-${index}`} style={{ transitionDelay: `${index * 100}ms` }}>
                    <TableRow>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {course.title}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Badge badgeContent={course.students} color="primary">
                          <PeopleIcon />
                        </Badge>
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                          <Typography variant="body2" sx={{ mr: 1 }}>
                            {course.completionRate}%
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={course.completionRate}
                            sx={{ width: 50, height: 6, borderRadius: 3 }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={`${course.rating} ⭐`}
                          size="small"
                          color="warning"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Xem chi tiết">
                          <IconButton size="small">
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Chỉnh sửa">
                          <IconButton size="small">
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  </Fade>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </AdminLayout>
  );
};

export default EnhancedAdminDashboard;
