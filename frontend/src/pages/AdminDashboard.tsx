import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
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
} from '@mui/material';
import {
  People as PeopleIcon,
  School as SchoolIcon,
  Class as ClassIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { adminApi, DashboardStats, RecentActivity, TopCourse } from '../api/admin';

// Types are now imported from adminApi

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalCourses: 0,
    totalClassrooms: 0,
    totalAssignments: 0,
    activeUsers: 0,
    newUsersThisMonth: 0,
    coursesCompleted: 0,
    averageCompletionRate: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [topCourses, setTopCourses] = useState<TopCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all dashboard data in parallel
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
      // Fallback to mock data if API fails
      setStats({
        totalUsers: 1247,
        totalCourses: 89,
        totalClassrooms: 156,
        totalAssignments: 423,
        activeUsers: 892,
        newUsersThisMonth: 45,
        coursesCompleted: 234,
        averageCompletionRate: 78.5,
        usersByRole: { admin: 5, teacher: 45, student: 1150, parent: 47 },
        coursesByCategory: [],
        monthlyStats: [],
      });
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

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Admin Dashboard
        </Typography>
        <Tooltip title="Làm mới dữ liệu">
          <IconButton onClick={fetchDashboardData} color="primary">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <PeopleIcon />
                </Avatar>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Tổng người dùng
                  </Typography>
                  <Typography variant="h4" component="div">
                    {stats.totalUsers.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUpIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="body2" color="success.main">
                  +{stats.newUsersThisMonth} tháng này
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <SchoolIcon />
                </Avatar>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Khóa học
                  </Typography>
                  <Typography variant="h4" component="div">
                    {stats.totalCourses}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUpIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="body2" color="success.main">
                  +12 tuần này
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                  <ClassIcon />
                </Avatar>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Lớp học
                  </Typography>
                  <Typography variant="h4" component="div">
                    {stats.totalClassrooms}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUpIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="body2" color="success.main">
                  +8 tuần này
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                  <AssignmentIcon />
                </Avatar>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Bài tập
                  </Typography>
                  <Typography variant="h4" component="div">
                    {stats.totalAssignments}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUpIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="body2" color="success.main">
                  +23 tuần này
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Additional Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Người dùng hoạt động
              </Typography>
              <Typography variant="h3" color="primary">
                {stats.activeUsers}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)}% tổng người dùng
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Khóa học hoàn thành
              </Typography>
              <Typography variant="h3" color="success.main">
                {stats.coursesCompleted}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Tổng cộng
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Tỷ lệ hoàn thành TB
              </Typography>
              <Typography variant="h3" color="info.main">
                {stats.averageCompletionRate}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Trung bình toàn hệ thống
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activity and Top Courses */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Hoạt động gần đây
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    {recentActivity.map((activity) => (
                      <TableRow key={activity.id}>
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
                            color={getActivityColor(activity.type) as 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'}
                            variant="outlined"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Khóa học phổ biến
              </Typography>
              <TableContainer>
                <Table size="small">
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
                    {topCourses.map((course) => (
                      <TableRow key={course.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {course.title}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {course.students}
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
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;
