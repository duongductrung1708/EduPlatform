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
  const PRIMARY_CATEGORIES = ['Toán', 'Tiếng Việt', 'Tiếng Anh', 'Khoa học', 'Tin học', 'Mỹ thuật', 'Âm nhạc'];
  const PRIMARY_LEVELS = ['Lớp 1', 'Lớp 2', 'Lớp 3', 'Lớp 4', 'Lớp 5'];

  // Debounce search input
  // Initial load
  useEffect(() => {
    fetchCourses(true);
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
      const response = await adminApi.getAllCourses(page, 10, statusFilter || undefined, searchTerm || undefined);
      
      // Validate response structure
      if (!response || !response.courses || !Array.isArray(response.courses)) {
        throw new Error('Invalid response structure from API');
      }
      
      // Validate each course has required fields
      const validCourses = response.courses.filter(course => {
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
      setError(err.response?.data?.message || err.message || 'Không thể tải danh sách khóa học');
      setCourses([]); // Set empty array on error
    } finally {
      setLoading(false);
      setIsFetching(false);
      setInitialized(true);
    }
  };

  const handleStatusChange = async () => {
    if (!selectedCourse || !newStatus) return;
    // Optimistic update
    const prevCourses = [...courses];
    setCourses((cs) => cs.map(c => c._id === selectedCourse._id ? { ...c, status: newStatus as any } : c));
    try {
      await adminApi.updateCourseStatus(selectedCourse._id, newStatus);
      setStatusDialogOpen(false);
      setSelectedCourse(null);
      setNewStatus('');
      fetchCourses(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể cập nhật trạng thái khóa học');
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              Quản lý khóa học
            </Typography>
            <Skeleton variant="rectangular" width={150} height={40} sx={{ borderRadius: 2 }} />
          </Box>
          {[...Array(5)].map((_, index) => (
            <Skeleton key={index} variant="rectangular" height={80} sx={{ mb: 2, borderRadius: 2 }} />
          ))}
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Quản lý khóa học
          </Typography>
          {/* Removed create course button per requirements */}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)', color: 'white' }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <SchoolIcon sx={{ fontSize: 40 }} />
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {courses.filter(c => c.status === 'published').length}
                  </Typography>
                </Box>
                <Typography variant="subtitle1">Đã xuất bản</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, background: 'linear-gradient(45deg, #FF9800 30%, #FFB74D 90%)', color: 'white' }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <PendingIcon sx={{ fontSize: 40 }} />
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {courses.filter(c => c.status === 'draft').length}
                  </Typography>
                </Box>
                <Typography variant="subtitle1">Bản nháp</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, background: 'linear-gradient(45deg, #4CAF50 30%, #81C784 90%)', color: 'white' }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <PersonIcon sx={{ fontSize: 40 }} />
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {courses.length > 0 ? new Set(courses.map(c => c.createdBy?._id).filter(Boolean)).size : 0}
                  </Typography>
                </Box>
                <Typography variant="subtitle1">Giảng viên</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, background: 'linear-gradient(45deg, #9C27B0 30%, #BA68C8 90%)', color: 'white' }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <CalendarIcon sx={{ fontSize: 40 }} />
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {courses.length}
                  </Typography>
                </Box>
                <Typography variant="subtitle1">Tổng khóa học</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              placeholder="Tìm kiếm khóa học..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              sx={{ minWidth: 300 }}
            />
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Trạng thái</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Trạng thái"
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
              onClick={fetchCourses}
            >
              Lọc
            </Button>
          </Box>
        </Paper>

        {/* Courses Table */}
        <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Khóa học</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Giảng viên</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Trạng thái</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Ngày tạo</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {courses.length > 0 ? (
                  courses.map((course) => (
                    <TableRow key={course._id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                            {course.title}
                          </Typography>
                          <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                            {course.description?.substring(0, 100)}...
                          </Typography>
                          {course.category && (
                            <Chip
                              label={course.category}
                              size="small"
                              sx={{ mt: 1, mr: 1 }}
                            />
                          )}
                          {course.level && (
                            <Chip
                              label={course.level}
                              size="small"
                              color="secondary"
                              sx={{ mt: 1 }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
                            {course.createdBy?.name?.[0] || '?'}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {course.createdBy?.name || 'Unknown'}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
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
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(course.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          onClick={(e) => handleMenuOpen(e, course)}
                          size="small"
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <Typography variant="body1" color="textSecondary">
                        Không có khóa học nào
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
          <DialogTitle>Cập nhật trạng thái khóa học</DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Khóa học: <strong>{selectedCourse?.title}</strong>
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
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => handleStatusClick(actionCourse!)}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Thay đổi trạng thái</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => { setDetailOpen(true); handleMenuClose(); }}>
            <ListItemIcon>
              <ViewIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Xem chi tiết</ListItemText>
          </MenuItem>
        </Menu>

        {/* Course Detail Dialog */}
        <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Chi tiết khóa học</DialogTitle>
          <DialogContent dividers>
            {actionCourse ? (
              <Box>
                <Typography variant="h6" sx={{ mb: 1 }}>{actionCourse.title}</Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>{actionCourse.description}</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <Box>
                    <Typography variant="caption" color="textSecondary">Trạng thái</Typography>
                    <Typography variant="body2">{actionCourse.status}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">Giảng viên</Typography>
                    <Typography variant="body2">{actionCourse.createdBy?.name || 'Unknown'} ({actionCourse.createdBy?.email || 'N/A'})</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">Danh mục</Typography>
                    <Typography variant="body2">{actionCourse.category || '—'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">Cấp độ</Typography>
                    <Typography variant="body2">{actionCourse.level || '—'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">Tạo lúc</Typography>
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
