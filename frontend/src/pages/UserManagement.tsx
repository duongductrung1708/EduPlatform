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
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Person as PersonIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { adminApi } from '../api/admin';
import AdminLayout from '../components/AdminLayout';
import { useNavigate } from 'react-router-dom';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  lastLoginAt?: string;
  avatar?: string;
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
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [actionUser, setActionUser] = useState<User | null>(null);

  // Debounce search/filter
  // Initial load
  useEffect(() => {
    fetchUsers(true);
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
      
      const response = await adminApi.getAllUsers(page, 10, roleFilter || undefined, searchTerm || undefined);
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

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteUser = async (user: User) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa người dùng ${user.name}?`)) {
      try {
        await adminApi.deleteUser(user._id);
        fetchUsers();
        handleMenuClose();
      } catch (error) {
        console.error('Error deleting user:', error);
        setError('Không thể xóa người dùng');
      }
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
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
              Quản lý người dùng
            </Typography>
            <Skeleton variant="rectangular" width={150} height={40} sx={{ borderRadius: 2 }} />
          </Box>
          {[...Array(5)].map((_, index) => (
            <Skeleton key={index} variant="rectangular" height={60} sx={{ mb: 2, borderRadius: 2 }} />
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
            Quản lý người dùng
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/admin/create-user')}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 'bold',
              px: 3,
              py: 1.5
            }}
          >
            Tạo User Mới
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Filters */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              placeholder="Tìm kiếm theo tên hoặc email..."
              value={searchTerm}
              onChange={handleSearch}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              sx={{ flexGrow: 1 }}
            />
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Vai trò</InputLabel>
              <Select
                value={roleFilter}
                onChange={handleRoleFilter}
                label="Vai trò"
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
              onClick={fetchUsers}
            >
              Lọc
            </Button>
          </Box>
        </Paper>

        {/* Users Table */}
        <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'grey.50' }}>
                  <TableCell>Người dùng</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Vai trò</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell>Ngày tạo</TableCell>
                  <TableCell>Đăng nhập cuối</TableCell>
                  <TableCell align="right">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user._id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <PersonIcon />
                          )}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="medium">
                            {user.name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            ID: {user._id.slice(-8)}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{user.email}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.role}
                        color={getRoleColor(user.role) as any}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.status || 'active'}
                        color={getStatusColor(user.status || 'active') as any}
                        size="small"
                        icon={user.status === 'active' ? <CheckCircleIcon /> : <BlockIcon />}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(user.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Chưa đăng nhập'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Thao tác">
                        <IconButton
                          onClick={(e) => handleMenuOpen(e, user)}
                          size="small"
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
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => actionUser && handleEditUser(actionUser)}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Chỉnh sửa</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => actionUser && handleDeleteUser(actionUser)}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Xóa</ListItemText>
          </MenuItem>
        </Menu>

        {/* Edit User Dialog */}
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Chỉnh sửa người dùng</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="textSecondary">
              Chức năng chỉnh sửa người dùng sẽ được phát triển trong phiên bản tiếp theo.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Đóng</Button>
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
