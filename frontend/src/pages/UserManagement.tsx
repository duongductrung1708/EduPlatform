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
  DialogContentText,
  Pagination,
  Alert,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText,
  Fab,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Person as PersonIcon,
  Add as AddIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  AdminPanelSettings as AdminIcon,
  FamilyRestroom as ParentIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  AccessTime as AccessTimeIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { adminApi } from '../api/admin';
import AdminLayout from '../components/AdminLayout';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { ShimmerBox, DarkShimmerBox } from '../components/LoadingSkeleton';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  lastLoginAt?: string;
  avatar?: string;
  phone?: string;
  address?: string;
  gender?: string;
  organization?: string;
  verified?: boolean;
}

interface UserListResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const UserManagement: React.FC = () => {
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [actionUser, setActionUser] = useState<User | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    teachers: 0,
    students: 0,
    admins: 0,
    parents: 0,
  });

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
    fetchUsers(true);
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!initialized) return;
    const t = setTimeout(() => {
      setPage(1);
      fetchUsers(false);
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, roleFilter]);

  useEffect(() => {
    if (!initialized) return;
    fetchUsers(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const fetchUsers = async (showFullLoading: boolean = false) => {
    try {
      if (showFullLoading || !initialized) {
        setLoading(true);
      } else {
        setIsFetching(true);
      }
      setError(null);

      const response = await adminApi.getAllUsers(
        page,
        10,
        roleFilter || undefined,
        searchTerm || undefined,
      );
      setUsers(response.users);
      setTotalPages(response.pagination.pages);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
      setIsFetching(false);
      setInitialized(true);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await adminApi.getUserStats();
      setStats(response);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(1);
  };

  const handleRoleFilter = (event: any) => {
    setRoleFilter(event.target.value);
    setPage(1);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, user: User) => {
    setAnchorEl(event.currentTarget);
    setActionUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setActionUser(null);
  };

  const handleViewUser = async (user: User) => {
    setViewingUser(user);
    setViewDialogOpen(true);
    setLoadingDetails(true);
    handleMenuClose();

    try {
      const details = await adminApi.getUserById(user._id);
      setUserDetails(details);
    } catch (error) {
      console.error('Error fetching user details:', error);
      setError('Không thể tải thông tin chi tiết người dùng');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleOpenDeleteDialog = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await adminApi.deleteUser(userToDelete._id);
      fetchUsers();
      handleCloseDeleteDialog();
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Không thể xóa người dùng');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'teacher':
        return 'primary';
      case 'student':
        return 'success';
      case 'parent':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Quản trị viên';
      case 'teacher':
        return 'Giáo viên';
      case 'student':
        return 'Học sinh';
      case 'parent':
        return 'Phụ huynh';
      default:
        return role;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  if (loading) {
    return (
      <AdminLayout>
        <Box sx={{ p: 3 }}>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}
          >
            <Box>
              {darkMode ? (
                <DarkShimmerBox height="40px" width="300px" borderRadius="4px" />
              ) : (
                <ShimmerBox height="40px" width="300px" borderRadius="4px" />
              )}
            </Box>
            {darkMode ? (
              <DarkShimmerBox height="40px" width="150px" borderRadius="4px" />
            ) : (
              <ShimmerBox height="40px" width="150px" borderRadius="4px" />
            )}
          </Box>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {[...Array(4)].map((_, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card sx={{ borderRadius: 3, height: '100%' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      {darkMode ? (
                        <DarkShimmerBox height="56px" width="56px" borderRadius="50%" />
                      ) : (
                        <ShimmerBox height="56px" width="56px" borderRadius="50%" />
                      )}
                      <Box sx={{ flex: 1, ml: 2 }}>
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
                  </CardContent>
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
              Quản lý người dùng
            </Typography>
            <Typography variant="body1" sx={{ color: secondaryTextColor }}>
              Quản lý và theo dõi tất cả người dùng trong hệ thống
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/admin/create-user')}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 'bold',
              px: 3,
              py: 1.5,
              background: 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #D94A4A 0%, #EF5B5B 100%)',
              },
            }}
          >
            Tạo User Mới
          </Button>
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
                      {stats.totalUsers}
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
                      {stats.activeUsers}
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
                      Giáo viên
                    </Typography>
                    <Typography
                      variant="h4"
                      component="div"
                      sx={{ fontWeight: 700, color: 'white' }}
                    >
                      {stats.teachers}
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
                      Học sinh
                    </Typography>
                    <Typography
                      variant="h4"
                      component="div"
                      sx={{ fontWeight: 700, color: 'white' }}
                    >
                      {stats.students}
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
              placeholder="Tìm kiếm theo tên hoặc email..."
              value={searchTerm}
              onChange={handleSearch}
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
              <InputLabel sx={{ color: primaryTextColor }}>Vai trò</InputLabel>
              <Select
                value={roleFilter}
                onChange={handleRoleFilter}
                label="Vai trò"
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
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="teacher">Giáo viên</MenuItem>
                <MenuItem value="student">Học sinh</MenuItem>
                <MenuItem value="parent">Phụ huynh</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => fetchUsers(false)}
              sx={{
                borderColor: surfaceBorder,
                color: primaryTextColor,
                '&:hover': {
                  borderColor: '#EF5B5B',
                  backgroundColor: darkMode ? 'rgba(239, 91, 91, 0.1)' : 'rgba(239, 91, 91, 0.05)',
                },
              }}
            >
              Lọc
            </Button>
          </Box>
        </Paper>

        {/* Users Table */}
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
                  <TableCell sx={{ fontWeight: 600, color: primaryTextColor }}>
                    Người dùng
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: primaryTextColor }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: primaryTextColor }}>Vai trò</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: primaryTextColor }}>Ngày tạo</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: primaryTextColor }}>
                    Đăng nhập cuối
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: primaryTextColor }}>
                    Thao tác
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow
                    key={user._id}
                    sx={{
                      '&:hover': {
                        bgcolor: darkMode ? 'rgba(239, 91, 91, 0.1)' : 'rgba(239, 91, 91, 0.05)',
                      },
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2, bgcolor: '#EF5B5B' }}>
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <PersonIcon sx={{ color: 'white' }} />
                          )}
                        </Avatar>
                        <Box>
                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 600, color: primaryTextColor }}
                          >
                            {user.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: secondaryTextColor }}>
                            ID: {user._id.slice(-8)}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: primaryTextColor }}>
                        {user.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getRoleLabel(user.role)}
                        color={getRoleColor(user.role) as any}
                        size="small"
                        sx={{
                          '& .MuiChip-label': {
                            color: 'white',
                          },
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: primaryTextColor }}>
                        {formatDate(user.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: primaryTextColor }}>
                        {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Chưa đăng nhập'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Thao tác">
                        <IconButton
                          onClick={(e) => handleMenuOpen(e, user)}
                          size="small"
                          sx={{
                            color: secondaryTextColor,
                            '&:hover': {
                              color: '#EF5B5B',
                              backgroundColor: darkMode
                                ? 'rgba(239, 91, 91, 0.1)'
                                : 'rgba(239, 91, 91, 0.05)',
                            },
                          }}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
              showFirstButton
              showLastButton
            />
          </Box>
        </Paper>

        {/* Action Menu */}
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
          <MenuItem onClick={() => actionUser && handleViewUser(actionUser)}>
            <ListItemIcon>
              <ViewIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Xem chi tiết</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => actionUser && handleOpenDeleteDialog(actionUser)}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Xóa</ListItemText>
          </MenuItem>
        </Menu>

        {/* View User Details Dialog */}
        <Dialog
          open={viewDialogOpen}
          onClose={() => setViewDialogOpen(false)}
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
            Chi tiết người dùng
          </DialogTitle>
          <DialogContent>
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
            ) : userDetails ? (
              <Box sx={{ mt: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: 3,
                    pb: 3,
                    borderBottom: `1px solid ${surfaceBorder}`,
                  }}
                >
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      bgcolor: '#EF5B5B',
                      mr: 3,
                    }}
                  >
                    {userDetails.avatarUrl ? (
                      <img
                        src={userDetails.avatarUrl}
                        alt={userDetails.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <PersonIcon sx={{ fontSize: 40, color: 'white' }} />
                    )}
                  </Avatar>
                  <Box>
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: 700, color: primaryTextColor, mb: 1 }}
                    >
                      {userDetails.name}
                    </Typography>
                    <Chip
                      label={getRoleLabel(userDetails.role)}
                      color={getRoleColor(userDetails.role) as any}
                      size="small"
                      sx={{
                        '& .MuiChip-label': {
                          color: 'white',
                        },
                      }}
                    />
                  </Box>
                </Box>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <EmailIcon sx={{ mr: 2, color: '#EF5B5B' }} />
                      <Box>
                        <Typography
                          variant="caption"
                          sx={{ color: secondaryTextColor, display: 'block' }}
                        >
                          Email
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{ color: primaryTextColor, fontWeight: 500 }}
                        >
                          {userDetails.email}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  {userDetails.phone && (
                    <Grid item xs={12} md={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <PhoneIcon sx={{ mr: 2, color: '#EF5B5B' }} />
                        <Box>
                          <Typography
                            variant="caption"
                            sx={{ color: secondaryTextColor, display: 'block' }}
                          >
                            Số điện thoại
                          </Typography>
                          <Typography
                            variant="body1"
                            sx={{ color: primaryTextColor, fontWeight: 500 }}
                          >
                            {userDetails.phone}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}

                  {userDetails.address && (
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                        <LocationIcon sx={{ mr: 2, color: '#EF5B5B', mt: 0.5 }} />
                        <Box>
                          <Typography
                            variant="caption"
                            sx={{ color: secondaryTextColor, display: 'block' }}
                          >
                            Địa chỉ
                          </Typography>
                          <Typography
                            variant="body1"
                            sx={{ color: primaryTextColor, fontWeight: 500 }}
                          >
                            {userDetails.address}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}

                  {userDetails.gender && (
                    <Grid item xs={12} md={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <PersonIcon sx={{ mr: 2, color: '#EF5B5B' }} />
                        <Box>
                          <Typography
                            variant="caption"
                            sx={{ color: secondaryTextColor, display: 'block' }}
                          >
                            Giới tính
                          </Typography>
                          <Typography
                            variant="body1"
                            sx={{ color: primaryTextColor, fontWeight: 500 }}
                          >
                            {userDetails.gender === 'male'
                              ? 'Nam'
                              : userDetails.gender === 'female'
                                ? 'Nữ'
                                : 'Khác'}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}

                  {userDetails.organization && (
                    <Grid item xs={12} md={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <SchoolIcon sx={{ mr: 2, color: '#EF5B5B' }} />
                        <Box>
                          <Typography
                            variant="caption"
                            sx={{ color: secondaryTextColor, display: 'block' }}
                          >
                            Tổ chức
                          </Typography>
                          <Typography
                            variant="body1"
                            sx={{ color: primaryTextColor, fontWeight: 500 }}
                          >
                            {userDetails.organization}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}

                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <CalendarIcon sx={{ mr: 2, color: '#EF5B5B' }} />
                      <Box>
                        <Typography
                          variant="caption"
                          sx={{ color: secondaryTextColor, display: 'block' }}
                        >
                          Ngày tạo
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{ color: primaryTextColor, fontWeight: 500 }}
                        >
                          {formatDate(userDetails.createdAt)}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  {userDetails.lastLoginAt && (
                    <Grid item xs={12} md={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <AccessTimeIcon sx={{ mr: 2, color: '#EF5B5B' }} />
                        <Box>
                          <Typography
                            variant="caption"
                            sx={{ color: secondaryTextColor, display: 'block' }}
                          >
                            Đăng nhập cuối
                          </Typography>
                          <Typography
                            variant="body1"
                            sx={{ color: primaryTextColor, fontWeight: 500 }}
                          >
                            {formatDate(userDetails.lastLoginAt)}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}

                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <CheckCircleIcon
                        sx={{ mr: 2, color: userDetails.verified ? '#4CAF50' : '#EF5B5B' }}
                      />
                      <Box>
                        <Typography
                          variant="caption"
                          sx={{ color: secondaryTextColor, display: 'block' }}
                        >
                          Xác thực tài khoản
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{ color: primaryTextColor, fontWeight: 500 }}
                        >
                          {userDetails.verified ? 'Đã xác thực' : 'Chưa xác thực'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            ) : null}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={() => {
                setViewDialogOpen(false);
                setViewingUser(null);
                setUserDetails(null);
              }}
              variant="contained"
              sx={{
                background: 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #D94A4A 0%, #EF5B5B 100%)',
                },
              }}
            >
              Đóng
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirm Dialog */}
        <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog} maxWidth="xs" fullWidth>
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
            Xác nhận xóa người dùng
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ color: secondaryTextColor }}>
              Bạn có chắc chắn muốn xóa người dùng{' '}
              <strong style={{ color: primaryTextColor }}>{userToDelete?.name}</strong>? Hành động
              này không thể hoàn tác.
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button
              onClick={handleCloseDeleteDialog}
              sx={{
                color: secondaryTextColor,
                '&:hover': {
                  backgroundColor: darkMode ? 'rgba(239, 91, 91, 0.1)' : 'rgba(239, 91, 91, 0.05)',
                },
              }}
            >
              Hủy
            </Button>
            <Button
              onClick={handleDeleteUser}
              variant="contained"
              sx={{
                background: 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #D94A4A 0%, #EF5B5B 100%)',
                },
              }}
            >
              Xóa
            </Button>
          </DialogActions>
        </Dialog>

        {/* Floating Action Button */}
        <Fab
          color="primary"
          aria-label="add user"
          onClick={() => navigate('/admin/create-user')}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1000,
          }}
        >
          <AddIcon />
        </Fab>
      </Box>
    </AdminLayout>
  );
};

export default UserManagement;
