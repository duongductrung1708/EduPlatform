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
import { adminApi } from '../api/admin';
import AdminLayout from '../components/AdminLayout';
import { useNavigate } from 'react-router-dom';

interface Classroom {
  _id: string;
  title: string;
  courseId?: {
    _id: string;
    title: string;
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
  const [allTeachers, setAllTeachers] = useState<Array<{ _id: string; name: string; email: string }>>([]);
  const [allStudents, setAllStudents] = useState<Array<{ _id: string; name: string; email: string }>>([]);
  const [submittingMembers, setSubmittingMembers] = useState(false);

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
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải danh sách lớp học');
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
    } catch (err: any) {
      console.error('Error fetching classroom stats:', err);
    }
  };

  const handleStatusChange = async () => {
    if (!selectedClassroom || !newStatus) return;
    // Optimistic update
    const prev = [...classrooms];
    setClassrooms((ls) => ls.map(l => l._id === selectedClassroom._id ? { ...l, status: newStatus as any } : l));
    try {
      await adminApi.updateClassroomStatus(selectedClassroom._id, newStatus);
      setStatusDialogOpen(false);
      setSelectedClassroom(null);
      setNewStatus('');
      fetchClassrooms(false);
      fetchStats();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể cập nhật trạng thái lớp học');
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
    setNewStatus(classroom.status);
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

  const formatDate = (dateString: string) => {
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              Quản lý lớp học
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
            Quản lý lớp học
          </Typography>
          {/* Removed create classroom button per requirements */}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, background: 'linear-gradient(45deg, #4CAF50 30%, #81C784 90%)', color: 'white' }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <ClassIcon sx={{ fontSize: 40 }} />
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {stats?.totalClassrooms || 0}
                  </Typography>
                </Box>
                <Typography variant="subtitle1">Tổng lớp học</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, background: 'linear-gradient(45deg, #2196F3 30%, #64B5F6 90%)', color: 'white' }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <CheckCircleIcon sx={{ fontSize: 40 }} />
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {stats?.activeClassrooms || 0}
                  </Typography>
                </Box>
                <Typography variant="subtitle1">Đang hoạt động</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, background: 'linear-gradient(45deg, #FF9800 30%, #FFB74D 90%)', color: 'white' }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <PeopleIcon sx={{ fontSize: 40 }} />
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {stats?.totalStudents || 0}
                  </Typography>
                </Box>
                <Typography variant="subtitle1">Tổng học sinh</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, background: 'linear-gradient(45deg, #9C27B0 30%, #BA68C8 90%)', color: 'white' }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <TrendingUpIcon sx={{ fontSize: 40 }} />
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {stats?.avgStudentsPerClass || 0}
                  </Typography>
                </Box>
                <Typography variant="subtitle1">TB học sinh/lớp</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              placeholder="Tìm kiếm lớp học..."
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
                <MenuItem value="active">Hoạt động</MenuItem>
                <MenuItem value="inactive">Tạm dừng</MenuItem>
                <MenuItem value="archived">Đã lưu trữ</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={fetchClassrooms}
            >
              Lọc
            </Button>
          </Box>
        </Paper>

        {/* Classrooms Table */}
        <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Lớp học</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Khóa học</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Giảng viên</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Học sinh</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Trạng thái</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Mã mời</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {classrooms.length > 0 ? (
                  classrooms.map((classroom) => (
                    <TableRow key={classroom._id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                            {classroom.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <SchoolIcon sx={{ mr: 1, color: 'primary.main' }} />
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {classroom.courseId?.title || 'N/A'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
                            {classroom.teacherId?.name?.[0] || '?'}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {classroom.teacherId?.name || 'Unknown'}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {classroom.teacherId?.email || 'No email'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <AvatarGroup max={3} sx={{ mr: 1 }}>
                            {(classroom.students || []).slice(0, 3).map((student) => (
                              <Avatar key={student._id} sx={{ width: 24, height: 24, fontSize: 12 }}>
                                {student.name?.[0] || '?'}
                              </Avatar>
                            ))}
                          </AvatarGroup>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {(classroom.students || []).length}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(classroom.status)}
                          label={getStatusText(classroom.status)}
                          color={getStatusColor(classroom.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                          {classroom.inviteCode || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton onClick={(e) => handleMenuOpen(e, classroom)} size="small">
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography variant="body1" color="textSecondary">
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
            />
          </Box>
        )}

        {/* Status Change Dialog */}
        <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)}>
          <DialogTitle>Cập nhật trạng thái lớp học</DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Lớp học: <strong>{selectedClassroom?.name}</strong>
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
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => handleStatusClick(actionClassroom!)}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Thay đổi trạng thái</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => { setAddMembersOpen(true); handleMenuClose(); }}>
            <ListItemIcon>
              <PeopleIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Thêm GV / Học sinh</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => { setDetailOpen(true); handleMenuClose(); }}>
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
                <Typography variant="h6" sx={{ mb: 1 }}>{actionClassroom.name}</Typography>
                {actionClassroom.description && (
                  <Typography variant="body2" sx={{ mb: 2 }}>{actionClassroom.description}</Typography>
                )}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <Box>
                    <Typography variant="caption" color="textSecondary">Trạng thái</Typography>
                    <Typography variant="body2">{getStatusText(actionClassroom.status)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">Giảng viên</Typography>
                    <Typography variant="body2">{actionClassroom.teacherId?.name || 'Unknown'} ({actionClassroom.teacherId?.email || 'N/A'})</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">Khóa học</Typography>
                    <Typography variant="body2">{actionClassroom.courseId?.title || '—'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">Học sinh</Typography>
                    <Typography variant="body2">{(actionClassroom.students || []).length}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">Mã mời</Typography>
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
        <Dialog open={addMembersOpen} onClose={() => setAddMembersOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Thêm giảng viên / học sinh</DialogTitle>
          <DialogContent dividers>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Lớp: <strong>{actionClassroom?.title}</strong>
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
                    {allTeachers.map(t => (
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
                    {allStudents.map(s => (
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
            <Button onClick={() => setAddMembersOpen(false)} disabled={submittingMembers}>Hủy</Button>
            <Button
              variant="contained"
              disabled={submittingMembers || !actionClassroom}
              onClick={async () => {
                if (!actionClassroom) return;
                try {
                  setSubmittingMembers(true);
                  await adminApi.addClassroomMembers(actionClassroom._id, {
                    teacherIds: selectedTeachers,
                    studentIds: selectedStudents,
                  });
                  setAddMembersOpen(false);
                  setSelectedTeachers([]);
                  setSelectedStudents([]);
                  fetchClassrooms();
                  fetchStats();
                } catch (e: any) {
                  setError(e?.response?.data?.message || 'Không thể thêm thành viên');
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
