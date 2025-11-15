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
  IconButton,
  Tooltip,
  Alert,
  Fade,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Rating,
  Button,
} from '@mui/material';
import {
  People as PeopleIcon,
  School as SchoolIcon,
  Class as ClassIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
  Refresh as RefreshIcon,
  OpenInNew as OpenInNewIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { adminApi, DashboardStats, TopCourse } from '../api/admin';
import { coursesApi, CourseItem } from '../api/courses';
import StatsChart from '../components/charts/StatsChart';
import AdminLayout from '../components/AdminLayout';
import { useTheme } from '../contexts/ThemeContext';
import { ShimmerBox, DarkShimmerBox } from '../components/LoadingSkeleton';
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';

const EnhancedAdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [topCourses, setTopCourses] = useState<TopCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<string>('30days');
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<TopCourse | null>(null);
  const [courseDetails, setCourseDetails] = useState<CourseItem | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Theme colors
  const primaryTextColor = darkMode ? '#f8fafc' : '#102a43';
  const secondaryTextColor = darkMode ? 'rgba(248, 250, 252, 0.7)' : 'rgba(16, 42, 67, 0.64)';
  const cardBackground = darkMode
    ? 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)'
    : 'linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%)';
  const surfaceBorder = darkMode ? 'rgba(148, 163, 184, 0.2)' : 'rgba(239, 91, 91, 0.12)';

  // Initial load
  useEffect(() => {
    fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load chart data when period changes
  useEffect(() => {
    if (stats !== null) {
      fetchChartData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsData, coursesData] = await Promise.all([
        adminApi.getDashboardStats(period),
        adminApi.getTopCourses(5),
      ]);

      setStats(statsData);
      setTopCourses(coursesData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Không thể tải dữ liệu dashboard. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async () => {
    try {
      setChartLoading(true);
      const statsData = await adminApi.getDashboardStats(period);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching chart data:', error);
      setError('Không thể tải dữ liệu thống kê. Vui lòng thử lại.');
    } finally {
      setChartLoading(false);
    }
  };

  // Process real data for charts based on period
  const chartData =
    stats?.monthlyStats && stats.monthlyStats.length > 0
      ? (() => {
          const isDaily = period === '7days' || period === '30days';

          if (isDaily) {
            // For daily stats, format dates as DD/MM
            return stats.monthlyStats
              .map((item) => {
                try {
                  // Backend returns date as YYYY-MM-DD string
                  const date = new Date(item.month);
                  if (isNaN(date.getTime())) return null;
                  const formattedDate = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
                  return {
                    date: formattedDate,
                    users: item.users || 0,
                    courses: item.courses || 0,
                    classrooms: item.classrooms || 0,
                  };
                } catch {
                  return null;
                }
              })
              .filter((item) => item !== null)
              .sort((a, b) => {
                // Sort by original date string from backend
                const aOriginal = stats.monthlyStats.find((s) => {
                  try {
                    const date = new Date(s.month);
                    const formatted = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
                    return formatted === a?.date;
                  } catch {
                    return false;
                  }
                });
                const bOriginal = stats.monthlyStats.find((s) => {
                  try {
                    const date = new Date(s.month);
                    const formatted = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
                    return formatted === b?.date;
                  } catch {
                    return false;
                  }
                });
                if (!aOriginal || !bOriginal) return 0;
                return new Date(aOriginal.month).getTime() - new Date(bOriginal.month).getTime();
              });
          } else {
            // For monthly stats, format as T1, T2, etc.
            return stats.monthlyStats
              .map((item) => {
                // Check if it's already formatted as T1, T2, etc.
                if (item.month.startsWith('T')) {
                  return {
                    date: item.month,
                    users: item.users || 0,
                    courses: item.courses || 0,
                    classrooms: item.classrooms || 0,
                  };
                }
                // Otherwise, try to parse as date and format
                try {
                  // If it's YYYY-MM format, extract month number
                  if (item.month.match(/^\d{4}-\d{2}$/)) {
                    const monthNum = parseInt(item.month.split('-')[1]);
                    return {
                      date: `T${monthNum}`,
                      users: item.users || 0,
                      courses: item.courses || 0,
                      classrooms: item.classrooms || 0,
                    };
                  }
                  const date = new Date(item.month);
                  if (!isNaN(date.getTime())) {
                    const monthNum = date.getMonth() + 1;
                    return {
                      date: `T${monthNum}`,
                      users: item.users || 0,
                      courses: item.courses || 0,
                      classrooms: item.classrooms || 0,
                    };
                  }
                } catch {
                  // Fallback
                }
                return {
                  date: item.month,
                  users: item.users || 0,
                  courses: item.courses || 0,
                  classrooms: item.classrooms || 0,
                };
              })
              .sort((a, b) => {
                // Sort by month number (T1, T2, ...)
                const aMatch = a.date.match(/^T(\d+)$/);
                const bMatch = b.date.match(/^T(\d+)$/);
                if (aMatch && bMatch) {
                  return parseInt(aMatch[1]) - parseInt(bMatch[1]);
                }
                return 0;
              });
          }
        })()
      : [];

  const xAxisKey = 'date';
  const chartTitle =
    period === '7days'
      ? 'Thống kê theo ngày (7 ngày gần nhất)'
      : period === '30days'
        ? 'Thống kê theo ngày (30 ngày gần nhất)'
        : period === '1year'
          ? 'Thống kê theo tháng (1 năm)'
          : 'Thống kê theo tháng (Tất cả)';

  const userRoleData = stats
    ? [
        { name: 'Students', value: stats.usersByRole.student, color: '#0088FE' },
        { name: 'Teachers', value: stats.usersByRole.teacher, color: '#00C49F' },
        { name: 'Parents', value: stats.usersByRole.parent, color: '#FFBB28' },
        { name: 'Admins', value: stats.usersByRole.admin, color: '#FF8042' },
      ].filter((item) => item.value > 0)
    : [];

  if (loading) {
    return (
      <AdminLayout>
        <Box sx={{ p: 3 }}>
          {/* Header Skeleton */}
          <Box sx={{ mb: 4 }}>
            {darkMode ? (
              <>
                <Box sx={{ mb: 2 }}>
                  <DarkShimmerBox height="40px" width="300px" borderRadius="4px" />
                </Box>
                <DarkShimmerBox height="20px" width="400px" borderRadius="4px" />
              </>
            ) : (
              <>
                <Box sx={{ mb: 2 }}>
                  <ShimmerBox height="40px" width="300px" borderRadius="4px" />
                </Box>
                <ShimmerBox height="20px" width="400px" borderRadius="4px" />
              </>
            )}
          </Box>

          {/* Stats Cards Skeleton */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {[...Array(4)].map((_, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card
                  sx={{
                    height: 160,
                    borderRadius: 3,
                    p: 3,
                    background: cardBackground,
                    border: `1px solid ${surfaceBorder}`,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ mr: 2 }}>
                      {darkMode ? (
                        <DarkShimmerBox height="56px" width="56px" borderRadius="50%" />
                      ) : (
                        <ShimmerBox height="56px" width="56px" borderRadius="50%" />
                      )}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      {darkMode ? (
                        <>
                          <Box sx={{ mb: 1 }}>
                            <DarkShimmerBox height="16px" width="80%" borderRadius="4px" />
                          </Box>
                          <DarkShimmerBox height="32px" width="60%" borderRadius="4px" />
                        </>
                      ) : (
                        <>
                          <Box sx={{ mb: 1 }}>
                            <ShimmerBox height="16px" width="80%" borderRadius="4px" />
                          </Box>
                          <ShimmerBox height="32px" width="60%" borderRadius="4px" />
                        </>
                      )}
                    </Box>
                  </Box>
                  {darkMode ? (
                    <DarkShimmerBox height="16px" width="50%" borderRadius="4px" />
                  ) : (
                    <ShimmerBox height="16px" width="50%" borderRadius="4px" />
                  )}
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Charts Skeleton */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={8}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  background: cardBackground,
                  border: `1px solid ${surfaceBorder}`,
                  height: 380,
                }}
              >
                <Box
                  sx={{
                    mb: 3,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  {darkMode ? (
                    <DarkShimmerBox height="24px" width="200px" borderRadius="4px" />
                  ) : (
                    <ShimmerBox height="24px" width="200px" borderRadius="4px" />
                  )}
                  {darkMode ? (
                    <DarkShimmerBox height="40px" width="150px" borderRadius="4px" />
                  ) : (
                    <ShimmerBox height="40px" width="150px" borderRadius="4px" />
                  )}
                </Box>
                <Box sx={{ height: 300, position: 'relative' }}>
                  {/* Grid lines */}
                  {[...Array(5)].map((_, i) => (
                    <Box
                      key={`grid-${i}`}
                      sx={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: `${i * 25}%`,
                        height: '1px',
                      }}
                    >
                      {darkMode ? (
                        <DarkShimmerBox height="1px" width="100%" borderRadius="0" />
                      ) : (
                        <ShimmerBox height="1px" width="100%" borderRadius="0" />
                      )}
                    </Box>
                  ))}
                  {/* Chart bars */}
                  {[45, 60, 35, 75, 50, 65, 40, 55].map((height, i) => (
                    <Box
                      key={`bar-${i}`}
                      sx={{
                        position: 'absolute',
                        left: `${i * 12 + 5}%`,
                        bottom: 0,
                        width: '8%',
                        height: `${height}%`,
                      }}
                    >
                      {darkMode ? (
                        <DarkShimmerBox height="100%" width="100%" borderRadius="4px 4px 0 0" />
                      ) : (
                        <ShimmerBox height="100%" width="100%" borderRadius="4px 4px 0 0" />
                      )}
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  background: cardBackground,
                  border: `1px solid ${surfaceBorder}`,
                  height: 380,
                }}
              >
                <Box sx={{ mb: 3 }}>
                  {darkMode ? (
                    <DarkShimmerBox height="24px" width="150px" borderRadius="4px" />
                  ) : (
                    <ShimmerBox height="24px" width="150px" borderRadius="4px" />
                  )}
                </Box>
                <Box
                  sx={{
                    height: 300,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {darkMode ? (
                    <DarkShimmerBox height="250px" width="250px" borderRadius="50%" />
                  ) : (
                    <ShimmerBox height="250px" width="250px" borderRadius="50%" />
                  )}
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* Overview Chart Skeleton */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  background: cardBackground,
                  border: `1px solid ${surfaceBorder}`,
                }}
              >
                <Box sx={{ mb: 3 }}>
                  {darkMode ? (
                    <DarkShimmerBox height="24px" width="150px" borderRadius="4px" />
                  ) : (
                    <ShimmerBox height="24px" width="150px" borderRadius="4px" />
                  )}
                </Box>
                <Box sx={{ height: 250, position: 'relative' }}>
                  {[60, 45, 70, 55, 50, 65].map((height, i) => (
                    <Box
                      key={`overview-bar-${i}`}
                      sx={{
                        position: 'absolute',
                        left: `${i * 15 + 5}%`,
                        bottom: 0,
                        width: '12%',
                        height: `${height}%`,
                      }}
                    >
                      {darkMode ? (
                        <DarkShimmerBox height="100%" width="100%" borderRadius="4px 4px 0 0" />
                      ) : (
                        <ShimmerBox height="100%" width="100%" borderRadius="4px 4px 0 0" />
                      )}
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* Top Courses Table Skeleton */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              background: cardBackground,
              border: `1px solid ${surfaceBorder}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              {darkMode ? (
                <DarkShimmerBox height="24px" width="200px" borderRadius="4px" />
              ) : (
                <ShimmerBox height="24px" width="200px" borderRadius="4px" />
              )}
            </Box>
            {/* Table header */}
            <Box sx={{ display: 'flex', mb: 2, gap: 2 }}>
              {[...Array(5)].map((_, i) => (
                <Box key={`header-${i}`} sx={{ flex: 1 }}>
                  {darkMode ? (
                    <DarkShimmerBox height="20px" width="80%" borderRadius="4px" />
                  ) : (
                    <ShimmerBox height="20px" width="80%" borderRadius="4px" />
                  )}
                </Box>
              ))}
            </Box>
            {/* Table rows */}
            {[...Array(5)].map((_, rowIndex) => (
              <Box
                key={`row-${rowIndex}`}
                sx={{ display: 'flex', mb: 2, gap: 2, alignItems: 'center' }}
              >
                {[...Array(5)].map((_, colIndex) => (
                  <Box key={`cell-${rowIndex}-${colIndex}`} sx={{ flex: 1 }}>
                    {darkMode ? (
                      <DarkShimmerBox height="40px" width="90%" borderRadius="4px" />
                    ) : (
                      <ShimmerBox height="40px" width="90%" borderRadius="4px" />
                    )}
                  </Box>
                ))}
              </Box>
            ))}
          </Paper>
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
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 4,
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 700,
                mb: 1,
                color: primaryTextColor,
                background: darkMode
                  ? 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)'
                  : 'linear-gradient(135deg, #EF5B5B 0%, #D94A4A 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Tổng quan Dashboard
            </Typography>
            <Typography variant="body1" sx={{ color: secondaryTextColor }}>
              Chào mừng trở lại, <strong>{user?.name}</strong>! Đây là tổng quan về hệ thống.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Tooltip title="Làm mới dữ liệu">
              <IconButton
                onClick={fetchInitialData}
                disabled={loading || chartLoading}
                color="primary"
                size="medium"
                sx={{
                  bgcolor: darkMode ? 'rgba(239, 91, 91, 0.2)' : 'white',
                  color: '#EF5B5B',
                  border: `1px solid ${surfaceBorder}`,
                  '&:hover': {
                    bgcolor: darkMode ? 'rgba(239, 91, 91, 0.3)' : 'white',
                    transform: 'rotate(180deg)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                height: '100%',
                background: darkMode
                  ? 'linear-gradient(135deg, #EF5B5B 0%, #D94A4A 100%)'
                  : 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
                color: 'white',
                borderRadius: 3,
                boxShadow: '0 8px 24px rgba(239, 91, 91, 0.3)',
                border: 'none',
                position: 'relative',
                transform: 'translateZ(0)',
                willChange: 'auto',
                '&:hover': {
                  boxShadow: '0 8px 24px rgba(239, 91, 91, 0.3)',
                  transform: 'translateZ(0)',
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.25)',
                      mr: 2,
                      width: 56,
                      height: 56,
                    }}
                  >
                    <PeopleIcon sx={{ fontSize: 28, color: 'white' }} />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'rgba(255,255,255,0.9)',
                        fontWeight: 500,
                        mb: 0.5,
                      }}
                    >
                      Tổng người dùng
                    </Typography>
                    <Typography
                      variant="h4"
                      component="div"
                      sx={{ fontWeight: 700, color: 'white' }}
                    >
                      {stats?.totalUsers.toLocaleString() || 0}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                  <TrendingUpIcon sx={{ mr: 1, fontSize: 18, color: 'rgba(255,255,255,0.9)' }} />
                  <Typography
                    variant="body2"
                    sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}
                  >
                    +{stats?.newUsersThisMonth || 0} tháng này
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                height: '100%',
                background: darkMode
                  ? 'linear-gradient(135deg,rgb(155, 210, 232) 0%,rgb(103, 182, 225) 100%)'
                  : 'linear-gradient(135deg,rgb(155, 210, 232) 0%,rgb(103, 182, 225) 100%)',
                color: 'white',
                borderRadius: 3,
                boxShadow: '0 8px 24px rgba(174, 214, 230, 0.3)',
                border: 'none',
                position: 'relative',
                transform: 'translateZ(0)',
                willChange: 'auto',
                '&:hover': {
                  boxShadow: '0 8px 24px rgba(174, 214, 230, 0.3)',
                  transform: 'translateZ(0)',
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.25)',
                      mr: 2,
                      width: 56,
                      height: 56,
                      color: 'white',
                    }}
                  >
                    <SchoolIcon sx={{ fontSize: 28, color: 'white' }} />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'rgba(255,255,255,0.9)',
                        fontWeight: 500,
                        mb: 0.5,
                      }}
                    >
                      Môn học
                    </Typography>
                    <Typography
                      variant="h4"
                      component="div"
                      sx={{ fontWeight: 700, color: 'white' }}
                    >
                      {stats?.totalCourses || 0}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                  <TrendingUpIcon sx={{ mr: 1, fontSize: 18, color: 'rgba(255,255,255,0.9)' }} />
                  <Typography
                    variant="body2"
                    sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}
                  >
                    +12 tuần này
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                height: '100%',
                background: darkMode
                  ? 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)'
                  : 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
                color: 'white',
                borderRadius: 3,
                boxShadow: '0 8px 24px rgba(76, 175, 80, 0.3)',
                border: 'none',
                position: 'relative',
                transform: 'translateZ(0)',
                willChange: 'auto',
                '&:hover': {
                  boxShadow: '0 8px 24px rgba(76, 175, 80, 0.3)',
                  transform: 'translateZ(0)',
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.25)',
                      mr: 2,
                      width: 56,
                      height: 56,
                    }}
                  >
                    <ClassIcon sx={{ fontSize: 28, color: 'white' }} />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'rgba(255,255,255,0.9)',
                        fontWeight: 500,
                        mb: 0.5,
                      }}
                    >
                      Lớp học
                    </Typography>
                    <Typography
                      variant="h4"
                      component="div"
                      sx={{ fontWeight: 700, color: 'white' }}
                    >
                      {stats?.totalClassrooms || 0}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                  <TrendingUpIcon sx={{ mr: 1, fontSize: 18, color: 'rgba(255,255,255,0.9)' }} />
                  <Typography
                    variant="body2"
                    sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}
                  >
                    +8 tuần này
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                height: '100%',
                background: darkMode
                  ? 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)'
                  : 'linear-gradient(135deg, #FF9800 0%, #FFB74D 100%)',
                color: 'white',
                borderRadius: 3,
                boxShadow: '0 8px 24px rgba(255, 152, 0, 0.3)',
                border: 'none',
                position: 'relative',
                transform: 'translateZ(0)',
                willChange: 'auto',
                '&:hover': {
                  boxShadow: '0 8px 24px rgba(255, 152, 0, 0.3)',
                  transform: 'translateZ(0)',
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.25)',
                      mr: 2,
                      width: 56,
                      height: 56,
                    }}
                  >
                    <AssignmentIcon sx={{ fontSize: 28, color: 'white' }} />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'rgba(255,255,255,0.9)',
                        fontWeight: 500,
                        mb: 0.5,
                      }}
                    >
                      Bài tập
                    </Typography>
                    <Typography
                      variant="h4"
                      component="div"
                      sx={{ fontWeight: 700, color: 'white' }}
                    >
                      {stats?.totalAssignments || 0}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                  <TrendingUpIcon sx={{ mr: 1, fontSize: 18, color: 'rgba(255,255,255,0.9)' }} />
                  <Typography
                    variant="body2"
                    sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}
                  >
                    +23 tuần này
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Charts Section */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={8}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                background: cardBackground,
                border: `1px solid ${surfaceBorder}`,
                height: '100%',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 3,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600, color: primaryTextColor }}>
                  {chartTitle}
                </Typography>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel sx={{ color: primaryTextColor }}>Khoảng thời gian</InputLabel>
                  <Select
                    value={period}
                    label="Khoảng thời gian"
                    onChange={(e) => setPeriod(e.target.value)}
                    disabled={chartLoading}
                    sx={{
                      color: primaryTextColor,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: surfaceBorder,
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#EF5B5B',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#EF5B5B',
                      },
                    }}
                  >
                    <MenuItem value="7days">7 ngày</MenuItem>
                    <MenuItem value="30days">30 ngày</MenuItem>
                    <MenuItem value="1year">1 năm</MenuItem>
                    <MenuItem value="all">Tất cả</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              {chartLoading ? (
                <Box sx={{ height: 300, p: 2 }}>
                  {/* Chart skeleton with shimmer effect */}
                  <Box sx={{ mb: 2 }}>
                    {darkMode ? (
                      <DarkShimmerBox height="20px" width="40%" borderRadius="4px" />
                    ) : (
                      <ShimmerBox height="20px" width="40%" borderRadius="4px" />
                    )}
                  </Box>
                  {/* Chart area with lines */}
                  <Box sx={{ position: 'relative', height: 240 }}>
                    {/* Grid lines */}
                    {[...Array(5)].map((_, i) => (
                      <Box
                        key={`grid-${i}`}
                        sx={{
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          top: `${i * 25}%`,
                          height: '1px',
                        }}
                      >
                        {darkMode ? (
                          <DarkShimmerBox height="1px" width="100%" borderRadius="0" />
                        ) : (
                          <ShimmerBox height="1px" width="100%" borderRadius="0" />
                        )}
                      </Box>
                    ))}
                    {/* Chart bars/lines simulation */}
                    {[45, 60, 35, 75, 50, 65, 40, 55].map((height, i) => (
                      <Box
                        key={`bar-${i}`}
                        sx={{
                          position: 'absolute',
                          left: `${i * 12 + 5}%`,
                          bottom: 0,
                          width: '8%',
                          height: `${height}%`,
                          display: 'flex',
                          alignItems: 'flex-end',
                        }}
                      >
                        {darkMode ? (
                          <DarkShimmerBox height="100%" width="100%" borderRadius="4px 4px 0 0" />
                        ) : (
                          <ShimmerBox height="100%" width="100%" borderRadius="4px 4px 0 0" />
                        )}
                      </Box>
                    ))}
                    {/* X-axis labels */}
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: -20,
                        left: 0,
                        right: 0,
                        display: 'flex',
                        justifyContent: 'space-around',
                      }}
                    >
                      {[...Array(6)].map((_, i) => (
                        <Box key={`label-${i}`} sx={{ width: '15%' }}>
                          {darkMode ? (
                            <DarkShimmerBox height="12px" width="60%" borderRadius="2px" />
                          ) : (
                            <ShimmerBox height="12px" width="60%" borderRadius="2px" />
                          )}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Box>
              ) : (
                <StatsChart
                  data={chartData.map((item) => ({
                    name: item.date,
                    value: item.users,
                    courses: item.courses,
                    classrooms: item.classrooms,
                  }))}
                  title=""
                  type="area"
                  dataKey="users"
                  xAxisKey={xAxisKey}
                  color="#EF5B5B"
                  height={300}
                />
              )}
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                background: cardBackground,
                border: `1px solid ${surfaceBorder}`,
                height: '100%',
              }}
            >
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: primaryTextColor }}>
                Phân bố người dùng
              </Typography>
              <StatsChart data={userRoleData} title="" type="pie" dataKey="value" height={300} />
            </Paper>
          </Grid>
        </Grid>

        {/* Overview Chart */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                background: cardBackground,
                border: `1px solid ${surfaceBorder}`,
              }}
            >
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: primaryTextColor }}>
                Tổng quan hệ thống
              </Typography>
              <StatsChart
                data={[
                  { name: 'Người dùng', value: stats?.totalUsers || 0, color: '#EF5B5B' },
                  { name: 'Môn học', value: stats?.totalCourses || 0, color: '#AED6E6' },
                  { name: 'Lớp học', value: stats?.totalClassrooms || 0, color: '#4CAF50' },
                  { name: 'Bài tập', value: stats?.totalAssignments || 0, color: '#FF9800' },
                ]}
                title=""
                type="bar"
                dataKey="value"
                xAxisKey="name"
                color="#EF5B5B"
                height={250}
              />
            </Paper>
          </Grid>
        </Grid>

        {/* Top Courses */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3,
            background: cardBackground,
            border: `1px solid ${surfaceBorder}`,
          }}
        >
          <Typography
            variant="h6"
            gutterBottom
            sx={{
              fontWeight: 600,
              mb: 3,
              color: primaryTextColor,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <SchoolIcon sx={{ mr: 1, color: '#EF5B5B' }} />
            Môn học phổ biến
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, color: primaryTextColor }}>Môn học</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, color: primaryTextColor }}>
                    Giảng viên
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, color: primaryTextColor }}>
                    Ngày tạo
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, color: primaryTextColor }}>
                    Học sinh
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, color: primaryTextColor }}>
                    Đánh giá
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, color: primaryTextColor }}>
                    Thao tác
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {topCourses.length > 0 ? (
                  topCourses.map((course, index) => (
                    <Fade
                      in={true}
                      key={`course-${course.id}-${index}`}
                      style={{ transitionDelay: `${index * 100}ms` }}
                    >
                      <TableRow
                        sx={{
                          '&:hover': {
                            bgcolor: darkMode
                              ? 'rgba(239, 91, 91, 0.1)'
                              : 'rgba(239, 91, 91, 0.05)',
                          },
                        }}
                      >
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 600, color: primaryTextColor }}
                          >
                            {course.title}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 0.5,
                            }}
                          >
                            <PersonIcon fontSize="small" sx={{ color: secondaryTextColor }} />
                            <Typography variant="body2" sx={{ color: primaryTextColor }}>
                              {course.teacherName || 'Không xác định'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 0.5,
                            }}
                          >
                            <CalendarIcon fontSize="small" sx={{ color: secondaryTextColor }} />
                            <Typography variant="body2" sx={{ color: primaryTextColor }}>
                              {course.createdAt
                                ? new Date(course.createdAt).toLocaleDateString('vi-VN')
                                : 'N/A'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600, color: primaryTextColor }}
                            >
                              {course.students}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Rating
                              value={course.rating}
                              readOnly
                              precision={0.1}
                              size="small"
                              sx={{ mr: 1 }}
                            />
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600, color: primaryTextColor }}
                            >
                              {course.rating.toFixed(1)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Xem chi tiết">
                            <IconButton
                              size="small"
                              onClick={async () => {
                                setSelectedCourse(course);
                                setDetailOpen(true);
                                setLoadingDetails(true);
                                try {
                                  const details = await coursesApi.getById(course.id);
                                  setCourseDetails(details);
                                } catch (error) {
                                  console.error('Error fetching course details:', error);
                                  setCourseDetails(null);
                                } finally {
                                  setLoadingDetails(false);
                                }
                              }}
                              sx={{
                                color: '#EF5B5B',
                                '&:hover': {
                                  backgroundColor: 'rgba(239, 91, 91, 0.1)',
                                },
                              }}
                            >
                              <OpenInNewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    </Fade>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        Chưa có môn học nào được đánh giá
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Course Detail Dialog */}
        <Dialog
          open={detailOpen}
          onClose={() => {
            setDetailOpen(false);
            setSelectedCourse(null);
            setCourseDetails(null);
          }}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle
            sx={{
              background: darkMode
                ? 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)'
                : 'linear-gradient(135deg, #EF5B5B 0%, #D94A4A 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 700,
            }}
          >
            Chi tiết môn học
          </DialogTitle>
          <DialogContent dividers>
            {loadingDetails ? (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: 200,
                }}
              >
                {darkMode ? (
                  <DarkShimmerBox height="200px" width="100%" borderRadius="8px" />
                ) : (
                  <ShimmerBox height="200px" width="100%" borderRadius="8px" />
                )}
              </Box>
            ) : selectedCourse && courseDetails ? (
              <Box sx={{ mt: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: primaryTextColor, mb: 2 }}>
                  {courseDetails.title}
                </Typography>
                {courseDetails.description && (
                  <Typography variant="body2" sx={{ color: secondaryTextColor, mb: 3 }}>
                    {courseDetails.description}
                  </Typography>
                )}
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                    gap: 3,
                  }}
                >
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ color: secondaryTextColor, display: 'block', mb: 0.5 }}
                    >
                      Giảng viên
                    </Typography>
                    <Typography variant="body1" sx={{ color: primaryTextColor, fontWeight: 500 }}>
                      {selectedCourse.teacherName ||
                        courseDetails.createdBy?.name ||
                        'Không xác định'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ color: secondaryTextColor, display: 'block', mb: 0.5 }}
                    >
                      Ngày tạo
                    </Typography>
                    <Typography variant="body1" sx={{ color: primaryTextColor, fontWeight: 500 }}>
                      {selectedCourse.createdAt
                        ? new Date(selectedCourse.createdAt).toLocaleDateString('vi-VN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : (courseDetails as CourseItem & { createdAt?: string })?.createdAt
                          ? new Date(
                              (courseDetails as CourseItem & { createdAt?: string }).createdAt!,
                            ).toLocaleDateString('vi-VN', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })
                          : 'N/A'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ color: secondaryTextColor, display: 'block', mb: 0.5 }}
                    >
                      Danh mục
                    </Typography>
                    <Typography variant="body1" sx={{ color: primaryTextColor, fontWeight: 500 }}>
                      {courseDetails.category || '—'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ color: secondaryTextColor, display: 'block', mb: 0.5 }}
                    >
                      Cấp độ
                    </Typography>
                    <Typography variant="body1" sx={{ color: primaryTextColor, fontWeight: 500 }}>
                      {courseDetails.level || '—'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ color: secondaryTextColor, display: 'block', mb: 0.5 }}
                    >
                      Số học sinh
                    </Typography>
                    <Typography variant="body1" sx={{ color: primaryTextColor, fontWeight: 500 }}>
                      {selectedCourse.students}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ color: secondaryTextColor, display: 'block', mb: 0.5 }}
                    >
                      Đánh giá
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Rating value={selectedCourse.rating} readOnly precision={0.1} size="small" />
                      <Typography variant="body1" sx={{ color: primaryTextColor, fontWeight: 500 }}>
                        {selectedCourse.rating.toFixed(1)}/5.0
                      </Typography>
                    </Box>
                  </Box>
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ color: secondaryTextColor, display: 'block', mb: 0.5 }}
                    >
                      Trạng thái
                    </Typography>
                    <Chip
                      sx={{ color: 'white' }}
                      label={
                        courseDetails.status === 'published'
                          ? 'Đã xuất bản'
                          : courseDetails.status === 'draft'
                            ? 'Bản nháp'
                            : 'Đã lưu trữ'
                      }
                      color={
                        courseDetails.status === 'published'
                          ? 'success'
                          : courseDetails.status === 'draft'
                            ? 'default'
                            : 'default'
                      }
                      size="small"
                    />
                  </Box>
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ color: secondaryTextColor, display: 'block', mb: 0.5 }}
                    >
                      Hiển thị
                    </Typography>
                    <Chip
                      sx={{ color: 'white' }}
                      label={courseDetails.visibility === 'public' ? 'Công khai' : 'Riêng tư'}
                      color={courseDetails.visibility === 'public' ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                </Box>
              </Box>
            ) : selectedCourse ? (
              <Box>
                <Typography variant="h6" sx={{ mb: 1, color: primaryTextColor }}>
                  {selectedCourse.title}
                </Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                    gap: 2,
                    mt: 2,
                  }}
                >
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ color: secondaryTextColor, display: 'block', mb: 0.5 }}
                    >
                      Giảng viên
                    </Typography>
                    <Typography variant="body2" sx={{ color: primaryTextColor }}>
                      {selectedCourse.teacherName || 'Không xác định'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ color: secondaryTextColor, display: 'block', mb: 0.5 }}
                    >
                      Ngày tạo
                    </Typography>
                    <Typography variant="body2" sx={{ color: primaryTextColor }}>
                      {selectedCourse.createdAt
                        ? new Date(selectedCourse.createdAt).toLocaleDateString('vi-VN')
                        : 'N/A'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ color: secondaryTextColor, display: 'block', mb: 0.5 }}
                    >
                      Số học sinh
                    </Typography>
                    <Typography variant="body2" sx={{ color: primaryTextColor }}>
                      {selectedCourse.students}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ color: secondaryTextColor, display: 'block', mb: 0.5 }}
                    >
                      Đánh giá
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Rating value={selectedCourse.rating} readOnly precision={0.1} size="small" />
                      <Typography variant="body2" sx={{ color: primaryTextColor }}>
                        {selectedCourse.rating.toFixed(1)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            ) : (
              <Typography variant="body2" sx={{ color: secondaryTextColor }}>
                Không có dữ liệu
              </Typography>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={() => {
                setDetailOpen(false);
                setSelectedCourse(null);
                setCourseDetails(null);
              }}
              variant="outlined"
            >
              Đóng
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AdminLayout>
  );
};

export default EnhancedAdminDashboard;
