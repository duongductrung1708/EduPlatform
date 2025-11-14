import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  Chip,
  Avatar,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Pagination,
  Alert,
  Skeleton,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText,
  Fab,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
  School as SchoolIcon,
  Add as AddIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { adminApi } from '../api/admin';
import AdminLayout from '../components/AdminLayout';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { ShimmerBox, DarkShimmerBox } from '../components/LoadingSkeleton';

interface Course {
  _id: string;
  title: string;
  description: string;
  status: 'draft' | 'published' | 'archived';
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  category?: string;
  level?: string;
  duration?: number;
  price?: number;
}

interface CoursePaginationResponse {
  courses: Course[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const CourseManagement: React.FC = () => {
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [actionCourse, setActionCourse] = useState<Course | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  // Create course dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [teachers, setTeachers] = useState<Array<{ _id: string; name: string; email: string }>>([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    publishedCourses: 0,
    draftCourses: 0,
    totalTeachers: 0,
  });
  const [form, setForm] = useState({
    title: '',
    slug: '',
    description: '',
    category: 'Toán',
    level: 'Lớp 1',
    visibility: 'public',
    status: 'draft',
    teacherId: '',
    thumbnail: '',
    tags: '' as any, // comma separated in UI
  });
  const PRIMARY_CATEGORIES = [
    'Toán',
    'Tiếng Việt',
    'Tiếng Anh',
    'Khoa học',
    'Tin học',
    'Mỹ thuật',
    'Âm nhạc',
  ];
  const PRIMARY_LEVELS = ['Lớp 1', 'Lớp 2', 'Lớp 3', 'Lớp 4', 'Lớp 5'];

  // Theme colors
  const primaryTextColor = darkMode ? '#f8fafc' : '#102a43';
  const secondaryTextColor = darkMode ? 'rgba(248, 250, 252, 0.7)' : 'rgba(16, 42, 67, 0.64)';
  const cardBackground = darkMode
    ? 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)'
    : 'linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%)';
  const surfaceBorder = darkMode ? 'rgba(148, 163, 184, 0.2)' : 'rgba(239, 91, 91, 0.12)';

  // Debounce search input
  // Initial load
  useEffect(() => {
    fetchCourses(true);
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!initialized) return;
    const t = setTimeout(() => {
      setPage(1);
      fetchCourses(false);
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    if (!initialized) return;
    fetchCourses(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    // Load teachers for assignment
    (async () => {
      try {
        const res = await adminApi.getAllUsers(1, 100, 'teacher');
        setTeachers(res.users || []);
      } catch (e) {
        console.warn('Không thể tải danh sách giảng viên');
      }
    })();
  }, []);

  const fetchCourses = async (showFullLoading: boolean = false) => {
    try {
      if (showFullLoading || !initialized) {
        setLoading(true);
      } else {
        setIsFetching(true);
      }
      setError(null);
      const response = await adminApi.getAllCourses(
        page,
        10,
        statusFilter || undefined,
        searchTerm || undefined,
      );

      // Validate response structure
      if (!response || !response.courses || !Array.isArray(response.courses)) {
        throw new Error('Invalid response structure from API');
      }

      // Validate each course has required fields
      const validCourses = response.courses.filter((course: Course) => {
        if (!course || !course._id) {
          console.warn('Invalid course found:', course);
          return false;
        }
        return true;
      });

      setCourses(validCourses);
      setTotalPages(response.pagination?.pages || 1);
    } catch (err: any) {
      console.error('Error fetching courses:', err);
      setError(err.response?.data?.message || err.message || 'Không thể tải danh sách môn học');
      setCourses([]); // Set empty array on error
    } finally {
      setLoading(false);
      setIsFetching(false);
      setInitialized(true);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await adminApi.getCourseStats();
      setStats(response);
    } catch (error) {
      console.error('Error fetching course stats:', error);
    }
  };

  const handleStatusChange = async () => {
    if (!selectedCourse || !newStatus) return;
    // Optimistic update
    const prevCourses = [...courses];
    setCourses((cs) =>
      cs.map((c) => (c._id === selectedCourse._id ? { ...c, status: newStatus as any } : c)),
    );
    try {
      await adminApi.updateCourseStatus(selectedCourse._id, newStatus);
      setStatusDialogOpen(false);
      setSelectedCourse(null);
      setNewStatus('');
      fetchCourses(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể cập nhật trạng thái môn học');
      // rollback
      setCourses(prevCourses);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, course: Course) => {
    setAnchorEl(event.currentTarget);
    setActionCourse(course);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleStatusClick = (course: Course) => {
    setSelectedCourse(course);
    setNewStatus(course.status);
    setStatusDialogOpen(true);
    handleMenuClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'success';
      case 'draft':
        return 'warning';
      case 'archived':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircleIcon />;
      case 'draft':
        return <PendingIcon />;
      case 'archived':
        return <CancelIcon />;
      default:
        return <PendingIcon />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'published':
        return 'Đã xuất bản';
      case 'draft':
        return 'Bản nháp';
      case 'archived':
        return 'Đã lưu trữ';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  if (loading) {
    return (
      <AdminLayout>
        <Box sx={{ p: 3 }}>
          <Box sx={{ mb: 4 }}>
            {darkMode ? (
              <DarkShimmerBox height="40px" width="300px" borderRadius="4px" />
            ) : (
              <ShimmerBox height="40px" width="300px" borderRadius="4px" />
            )}
          </Box>
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
                </Card>
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
              Quản lý môn học
            </Typography>
            <Typography variant="body1" sx={{ color: secondaryTextColor }}>
              Quản lý và theo dõi tất cả các môn học trong hệ thống
            </Typography>
          </Box>
        </Box>

        {error && (
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
                <FilterIcon />
              </IconButton>
            }
          >
            {error}
          </Alert>
        )}

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                height: '100%',
                borderRadius: 3,
                background: 'linear-gradient(135deg, #2196F3 0%, #21CBF3 100%)',
                color: 'white',
                boxShadow: '0 8px 24px rgba(33, 150, 243, 0.3)',
                border: 'none',
                position: 'relative',
                transform: 'translateZ(0)',
                willChange: 'auto',
                '&:hover': {
                  boxShadow: '0 8px 24px rgba(33, 150, 243, 0.3)',
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
                      Đã xuất bản
                    </Typography>
                    <Typography
                      variant="h4"
                      component="div"
                      sx={{ fontWeight: 700, color: 'white' }}
                    >
                      {stats.publishedCourses}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                height: '100%',
                borderRadius: 3,
                background: 'linear-gradient(135deg, #FF9800 0%, #FFB74D 100%)',
                color: 'white',
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
                    <PendingIcon sx={{ fontSize: 28, color: 'white' }} />
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
                      Bản nháp
                    </Typography>
                    <Typography
                      variant="h4"
                      component="div"
                      sx={{ fontWeight: 700, color: 'white' }}
                    >
                      {stats.draftCourses}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                height: '100%',
                borderRadius: 3,
                background: 'linear-gradient(135deg, #4CAF50 0%, #81C784 100%)',
                color: 'white',
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
                    <PersonIcon sx={{ fontSize: 28, color: 'white' }} />
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
                      Giảng viên
                    </Typography>
                    <Typography
                      variant="h4"
                      component="div"
                      sx={{ fontWeight: 700, color: 'white' }}
                    >
                      {stats.totalTeachers}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                height: '100%',
                borderRadius: 3,
                background: 'linear-gradient(135deg, #9C27B0 0%, #BA68C8 100%)',
                color: 'white',
                boxShadow: '0 8px 24px rgba(156, 39, 176, 0.3)',
                border: 'none',
                position: 'relative',
                transform: 'translateZ(0)',
                willChange: 'auto',
                '&:hover': {
                  boxShadow: '0 8px 24px rgba(156, 39, 176, 0.3)',
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
                    <CalendarIcon sx={{ fontSize: 28, color: 'white' }} />
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
                      Tổng môn học
                    </Typography>
                    <Typography
                      variant="h4"
                      component="div"
                      sx={{ fontWeight: 700, color: 'white' }}
                    >
                      {stats.totalCourses}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 3,
            borderRadius: 3,
            background: cardBackground,
            border: `1px solid ${surfaceBorder}`,
          }}
        >
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              placeholder="Tìm kiếm môn học..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: secondaryTextColor }} />,
              }}
              sx={{
                minWidth: 300,
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: surfaceBorder,
                  },
                  '&:hover fieldset': {
                    borderColor: '#EF5B5B',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#EF5B5B',
                  },
                },
              }}
            />
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel sx={{ color: primaryTextColor }}>Trạng thái</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Trạng thái"
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
                <MenuItem value="">Tất cả</MenuItem>
                <MenuItem value="published">Đã xuất bản</MenuItem>
                <MenuItem value="draft">Bản nháp</MenuItem>
                <MenuItem value="archived">Đã lưu trữ</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => fetchCourses(false)}
              sx={{
                borderColor: surfaceBorder,
                color: primaryTextColor,
                '&:hover': {
                  borderColor: '#EF5B5B',
                  bgcolor: darkMode ? 'rgba(239, 91, 91, 0.1)' : 'rgba(239, 91, 91, 0.05)',
                },
              }}
            >
              Lọc
            </Button>
          </Box>
        </Paper>

        {/* Courses Table */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            background: cardBackground,
            border: `1px solid ${surfaceBorder}`,
          }}
        >
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow
                  sx={{
                    backgroundColor: darkMode
                      ? 'rgba(148, 163, 184, 0.1)'
                      : 'rgba(239, 91, 91, 0.05)',
                  }}
                >
                  <TableCell sx={{ fontWeight: 600, color: primaryTextColor }}>Môn học</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: primaryTextColor }}>
                    Giảng viên
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: primaryTextColor }}>
                    Trạng thái
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: primaryTextColor }}>Ngày tạo</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: primaryTextColor }}>Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {courses.length > 0 ? (
                  courses.map((course) => (
                    <TableRow
                      key={course._id}
                      sx={{
                        '&:hover': {
                          bgcolor: darkMode ? 'rgba(239, 91, 91, 0.1)' : 'rgba(239, 91, 91, 0.05)',
                        },
                      }}
                    >
                      <TableCell>
                        <Box>
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 600, color: primaryTextColor }}
                          >
                            {course.title}
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 0.5, color: secondaryTextColor }}>
                            {course.description?.substring(0, 100)}...
                          </Typography>
                          {course.category && (
                            <Chip
                              label={course.category}
                              size="small"
                              sx={{
                                mt: 1,
                                mr: 1,
                                bgcolor: darkMode
                                  ? 'rgba(239, 91, 91, 0.2)'
                                  : 'rgba(239, 91, 91, 0.1)',
                                color: '#EF5B5B',
                                border: `1px solid ${surfaceBorder}`,
                              }}
                            />
                          )}
                          {course.level && (
                            <Chip
                              label={course.level}
                              size="small"
                              sx={{
                                mt: 1,
                                bgcolor: darkMode
                                  ? 'rgba(156, 39, 176, 0.2)'
                                  : 'rgba(156, 39, 176, 0.1)',
                                color: '#9C27B0',
                                border: `1px solid ${surfaceBorder}`,
                              }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: '#EF5B5B' }}>
                            {course.createdBy?.name?.[0] || '?'}
                          </Avatar>
                          <Box>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600, color: primaryTextColor }}
                            >
                              {course.createdBy?.name || 'Unknown'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: secondaryTextColor }}>
                              {course.createdBy?.email || 'No email'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(course.status)}
                          label={getStatusText(course.status)}
                          color={getStatusColor(course.status) as any}
                          size="small"
                          sx={{
                            color: 'white',
                            '& .MuiChip-icon': {
                              color: 'white',
                            },
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: primaryTextColor }}>
                          {formatDate(course.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          onClick={(e) => handleMenuOpen(e, course)}
                          size="small"
                          sx={{
                            color: primaryTextColor,
                            '&:hover': {
                              bgcolor: darkMode
                                ? 'rgba(239, 91, 91, 0.2)'
                                : 'rgba(239, 91, 91, 0.1)',
                            },
                          }}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <Typography variant="body1" sx={{ color: secondaryTextColor }}>
                        Không có môn học nào
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, newPage) => setPage(newPage)}
              color="primary"
            />
          </Box>
        )}

        {/* Status Change Dialog */}
        <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)}>
          <DialogTitle>Cập nhật trạng thái môn học</DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Môn học: <strong>{selectedCourse?.title}</strong>
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Trạng thái mới</InputLabel>
              <Select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                label="Trạng thái mới"
              >
                <MenuItem value="draft">Bản nháp</MenuItem>
                <MenuItem value="published">Đã xuất bản</MenuItem>
                <MenuItem value="archived">Đã lưu trữ</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setStatusDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleStatusChange} variant="contained">
              Cập nhật
            </Button>
          </DialogActions>
        </Dialog>

        {/* Action Menu */}
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
          <MenuItem onClick={() => handleStatusClick(actionCourse!)}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Thay đổi trạng thái</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={() => {
              setDetailOpen(true);
              handleMenuClose();
            }}
          >
            <ListItemIcon>
              <ViewIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Xem chi tiết</ListItemText>
          </MenuItem>
        </Menu>

        {/* Course Detail Dialog */}
        <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Chi tiết môn học</DialogTitle>
          <DialogContent dividers>
            {actionCourse ? (
              <Box>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  {actionCourse.title}
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {actionCourse.description}
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Trạng thái
                    </Typography>
                    <Typography variant="body2">{actionCourse.status}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Giảng viên
                    </Typography>
                    <Typography variant="body2">
                      {actionCourse.createdBy?.name || 'Unknown'} (
                      {actionCourse.createdBy?.email || 'N/A'})
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Danh mục
                    </Typography>
                    <Typography variant="body2">{actionCourse.category || '—'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Cấp độ
                    </Typography>
                    <Typography variant="body2">{actionCourse.level || '—'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Tạo lúc
                    </Typography>
                    <Typography variant="body2">{formatDate(actionCourse.createdAt)}</Typography>
                  </Box>
                </Box>
              </Box>
            ) : (
              <Typography variant="body2">Không có dữ liệu</Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailOpen(false)}>Đóng</Button>
          </DialogActions>
        </Dialog>

        {/* Floating Action Button */}
        {/* Removed FAB create course per requirements */}

        {/* Removed create dialog per requirements */}
      </Box>
    </AdminLayout>
  );
};

export default CourseManagement;
