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
  Menu,
  ListItemIcon,
  ListItemText,
  Card,
  CardContent,
  Grid,
  AvatarGroup,
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
  Class as ClassIcon,
  Add as AddIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { adminApi, classesApi } from '../api/admin';
import AdminLayout from '../components/AdminLayout';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { ShimmerBox, DarkShimmerBox } from '../components/LoadingSkeleton';

interface Classroom {
  _id: string;
  title?: string;
  name?: string;
  description?: string;
  status?: 'active' | 'inactive' | 'archived';
  courseId?: {
    _id: string;
    title: string;
  };
  teacherId?: {
    _id: string;
    name: string;
    email: string;
  };
  teacherIds?: Array<{
    _id: string;
    name: string;
    email: string;
  }>;
  assistantIds?: Array<{
    _id: string;
    name: string;
    email: string;
  }>;
  students?: Array<{
    _id: string;
    name: string;
    email: string;
  }>;
  studentIds?: Array<{
    _id: string;
    name: string;
    email: string;
  }>;
  inviteCode?: string;
  createdAt: string;
  updatedAt: string;
}

interface ClassroomPaginationResponse {
  classrooms: Classroom[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface ClassroomStats {
  totalClassrooms: number;
  activeClassrooms: number;
  totalStudents: number;
  avgStudentsPerClass: number;
}

const ClassroomManagement: React.FC = () => {
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [stats, setStats] = useState<ClassroomStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [actionClassroom, setActionClassroom] = useState<Classroom | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [addMembersOpen, setAddMembersOpen] = useState(false);
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [allTeachers, setAllTeachers] = useState<
    Array<{ _id: string; name: string; email: string }>
  >([]);
  const [allStudents, setAllStudents] = useState<
    Array<{ _id: string; name: string; email: string }>
  >([]);
  const [submittingMembers, setSubmittingMembers] = useState(false);

  // Theme colors
  const primaryTextColor = darkMode ? '#f8fafc' : '#102a43';
  const secondaryTextColor = darkMode ? 'rgba(248, 250, 252, 0.7)' : 'rgba(16, 42, 67, 0.64)';
  const cardBackground = darkMode
    ? 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)'
    : 'linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%)';
  const surfaceBorder = darkMode ? 'rgba(148, 163, 184, 0.2)' : 'rgba(239, 91, 91, 0.12)';

  // Debounce search/filter
  // Initial load
  useEffect(() => {
    fetchClassrooms(true);
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!initialized) return;
    const t = setTimeout(() => {
      setPage(1);
      fetchClassrooms(false);
      fetchStats();
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    if (!initialized) return;
    fetchClassrooms(false);
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    // preload teachers and students lists
    (async () => {
      try {
        const [teachersRes, studentsRes] = await Promise.all([
          adminApi.getAllUsers(1, 100, 'teacher'),
          adminApi.getAllUsers(1, 200, 'student'),
        ]);
        setAllTeachers(teachersRes.users || []);
        setAllStudents(studentsRes.users || []);
      } catch (e) {}
    })();
  }, []);

  const fetchClassrooms = async (showFullLoading: boolean = false) => {
    try {
      if (showFullLoading || !initialized) {
        setLoading(true);
      } else {
        setIsFetching(true);
      }
      setError(null);
      const response = await adminApi.getAllClassrooms(page, 10, statusFilter, searchTerm);
      setClassrooms(response.classrooms);
      setTotalPages(response.pagination.pages);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Không thể tải danh sách lớp học');
    } finally {
      setLoading(false);
      setIsFetching(false);
      setInitialized(true);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await adminApi.getClassroomStats();
      setStats(response);
    } catch (err: unknown) {
      console.error('Error fetching classroom stats:', err);
    }
  };

  const handleStatusChange = async () => {
    if (!selectedClassroom || !newStatus) return;
    // Optimistic update
    const prev = [...classrooms];
    setClassrooms((ls) =>
      ls.map((l) => (l._id === selectedClassroom._id ? { ...l, status: newStatus as 'active' | 'inactive' | 'archived' } : l)),
    );
    try {
      await adminApi.updateClassroomStatus(selectedClassroom._id, newStatus);
      setStatusDialogOpen(false);
      setSelectedClassroom(null);
      setNewStatus('');
      fetchClassrooms(false);
      fetchStats();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Không thể cập nhật trạng thái lớp học');
      setClassrooms(prev);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, classroom: Classroom) => {
    setAnchorEl(event.currentTarget);
    setActionClassroom(classroom);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleStatusClick = (classroom: Classroom) => {
    setSelectedClassroom(classroom);
    setNewStatus(classroom.status || 'active');
    setStatusDialogOpen(true);
    handleMenuClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'warning';
      case 'archived':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon />;
      case 'inactive':
        return <PendingIcon />;
      case 'archived':
        return <CancelIcon />;
      default:
        return <PendingIcon />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Hoạt động';
      case 'inactive':
        return 'Tạm dừng';
      case 'archived':
        return 'Đã lưu trữ';
      default:
        return status;
    }
  };

  const _formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getStudentCountColor = (count: number, max: number) => {
    const percentage = (count / max) * 100;
    if (percentage >= 90) return 'error';
    if (percentage >= 70) return 'warning';
    return 'success';
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
              Quản lý lớp học
            </Typography>
            <Typography variant="body1" sx={{ color: secondaryTextColor }}>
              Quản lý và theo dõi tất cả các lớp học trong hệ thống
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
                      Tổng lớp học
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
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                height: '100%',
                borderRadius: 3,
                background: 'linear-gradient(135deg, #2196F3 0%, #64B5F6 100%)',
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
                    <CheckCircleIcon sx={{ fontSize: 28, color: 'white' }} />
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
                      Đang hoạt động
                    </Typography>
                    <Typography
                      variant="h4"
                      component="div"
                      sx={{ fontWeight: 700, color: 'white' }}
                    >
                      {stats?.activeClassrooms || 0}
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
                      Tổng học sinh
                    </Typography>
                    <Typography
                      variant="h4"
                      component="div"
                      sx={{ fontWeight: 700, color: 'white' }}
                    >
                      {stats?.totalStudents || 0}
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
                    <TrendingUpIcon sx={{ fontSize: 28, color: 'white' }} />
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
                      TB học sinh/lớp
                    </Typography>
                    <Typography
                      variant="h4"
                      component="div"
                      sx={{ fontWeight: 700, color: 'white' }}
                    >
                      {stats?.avgStudentsPerClass || 0}
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
              placeholder="Tìm kiếm lớp học..."
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
                <MenuItem value="active">Hoạt động</MenuItem>
                <MenuItem value="inactive">Tạm dừng</MenuItem>
                <MenuItem value="archived">Đã lưu trữ</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => fetchClassrooms(false)}
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

        {/* Classrooms Table */}
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
                  <TableCell sx={{ fontWeight: 600, color: primaryTextColor }}>Lớp học</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: primaryTextColor }}>
                    Giảng viên
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: primaryTextColor }}>Học sinh</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: primaryTextColor }}>
                    Trạng thái
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: primaryTextColor }}>Mã mời</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: primaryTextColor }}>Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {classrooms.length > 0 ? (
                  classrooms.map((classroom) => (
                    <TableRow
                      key={classroom._id}
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
                            {classroom.title || classroom.name || 'Lớp học'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: '#EF5B5B' }}>
                            {(classroom.teacherId || classroom.teacherIds?.[0])?.name?.[0] || '?'}
                          </Avatar>
                          <Box>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600, color: primaryTextColor }}
                            >
                              {(classroom.teacherId || classroom.teacherIds?.[0])?.name ||
                                'Unknown'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: secondaryTextColor }}>
                              {(classroom.teacherId || classroom.teacherIds?.[0])?.email ||
                                'No email'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <AvatarGroup max={3} sx={{ mr: 1 }}>
                            {(classroom.students || classroom.studentIds || [])
                              .slice(0, 3)
                              .map((student) => (
                                <Avatar
                                  key={student._id}
                                  sx={{ width: 24, height: 24, fontSize: 12, bgcolor: '#EF5B5B' }}
                                >
                                  {student.name?.[0] || '?'}
                                </Avatar>
                              ))}
                          </AvatarGroup>
                          <Box>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600, color: primaryTextColor }}
                            >
                              {(classroom.students || classroom.studentIds || []).length}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(classroom.status || 'active')}
                          label={getStatusText(classroom.status || 'active')}
                          color={getStatusColor(classroom.status || 'active') as 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'}
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
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: 'monospace',
                            fontWeight: 600,
                            color: primaryTextColor,
                          }}
                        >
                          {classroom.inviteCode || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          onClick={(e) => handleMenuOpen(e, classroom)}
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
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography variant="body1" sx={{ color: secondaryTextColor }}>
                        Không có lớp học nào
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
              showFirstButton
              showLastButton
            />
          </Box>
        )}

        {/* Status Change Dialog */}
        <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)}>
          <DialogTitle>Cập nhật trạng thái lớp học</DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Lớp học:{' '}
              <strong>{selectedClassroom?.name || selectedClassroom?.title || 'Lớp học'}</strong>
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Trạng thái mới</InputLabel>
              <Select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                label="Trạng thái mới"
              >
                <MenuItem value="active">Hoạt động</MenuItem>
                <MenuItem value="inactive">Tạm dừng</MenuItem>
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
          <MenuItem onClick={() => handleStatusClick(actionClassroom!)}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Thay đổi trạng thái</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={() => {
              setAddMembersOpen(true);
              handleMenuClose();
            }}
          >
            <ListItemIcon>
              <PeopleIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Thêm GV / Học sinh</ListItemText>
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

        {/* Classroom Detail Dialog */}
        <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Chi tiết lớp học</DialogTitle>
          <DialogContent dividers>
            {actionClassroom ? (
              <Box>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  {actionClassroom.name || actionClassroom.title || 'Lớp học'}
                </Typography>
                {actionClassroom.description && (
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {actionClassroom.description}
                  </Typography>
                )}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Trạng thái
                    </Typography>
                    <Typography variant="body2">
                      {actionClassroom.status ? getStatusText(actionClassroom.status) : 'N/A'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Giảng viên
                    </Typography>
                    <Typography variant="body2">
                      {(actionClassroom.teacherId || actionClassroom.teacherIds?.[0])?.name ||
                        'Unknown'}{' '}
                      (
                      {(actionClassroom.teacherId || actionClassroom.teacherIds?.[0])?.email ||
                        'N/A'}
                      )
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Học sinh
                    </Typography>
                    <Typography variant="body2">
                      {(actionClassroom.students || actionClassroom.studentIds || []).length}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Mã mời
                    </Typography>
                    <Typography variant="body2">{actionClassroom.inviteCode || '—'}</Typography>
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

        {/* Add Members Dialog */}
        <Dialog
          open={addMembersOpen}
          onClose={() => setAddMembersOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Thêm giảng viên / học sinh</DialogTitle>
          <DialogContent dividers>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Lớp: <strong>{actionClassroom?.name || actionClassroom?.title || 'Lớp học'}</strong>
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Giảng viên</InputLabel>
                  <Select
                    multiple
                    label="Giảng viên"
                    value={selectedTeachers}
                    onChange={(e) => setSelectedTeachers(e.target.value as string[])}
                    renderValue={(selected) => (selected as string[]).length + ' đã chọn'}
                  >
                    {allTeachers.map((t) => (
                      <MenuItem key={t._id} value={t._id}>
                        {t.name} ({t.email})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Học sinh</InputLabel>
                  <Select
                    multiple
                    label="Học sinh"
                    value={selectedStudents}
                    onChange={(e) => setSelectedStudents(e.target.value as string[])}
                    renderValue={(selected) => (selected as string[]).length + ' đã chọn'}
                  >
                    {allStudents.map((s) => (
                      <MenuItem key={s._id} value={s._id}>
                        {s.name} ({s.email})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddMembersOpen(false)} disabled={submittingMembers}>
              Hủy
            </Button>
            <Button
              variant="contained"
              disabled={submittingMembers || !actionClassroom}
              onClick={async () => {
                if (!actionClassroom) return;
                try {
                  setSubmittingMembers(true);
                  // TODO: Implement addClassroomMembers API
                  // For now, use classesApi.update to add members
                  const currentTeacherIds = (
                    actionClassroom.teacherId ? [actionClassroom.teacherId._id] : []
                  ).concat(actionClassroom.teacherIds?.map((t) => t._id) || []);
                  const currentStudentIds = (
                    actionClassroom.students?.map((s) => s._id) || []
                  ).concat(actionClassroom.studentIds?.map((s) => s._id) || []);
                  await classesApi.update(actionClassroom._id, {
                    teacherIds: [...new Set([...currentTeacherIds, ...selectedTeachers])],
                    studentIds: [...new Set([...currentStudentIds, ...selectedStudents])],
                  });
                  setAddMembersOpen(false);
                  setSelectedTeachers([]);
                  setSelectedStudents([]);
                  fetchClassrooms(false);
                  fetchStats();
                } catch (e: unknown) {
                  const error = e as { response?: { data?: { message?: string } } };
                  setError(error?.response?.data?.message || 'Không thể thêm thành viên');
                } finally {
                  setSubmittingMembers(false);
                }
              }}
            >
              {submittingMembers ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Floating Action Button */}
        {/* Removed FAB create classroom per requirements */}
      </Box>
    </AdminLayout>
  );
};

export default ClassroomManagement;
