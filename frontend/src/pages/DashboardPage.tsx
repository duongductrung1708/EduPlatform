import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Chip,
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  School,
  Assignment,
  Group,
  ExitToApp,
  AccountCircle,
  Person,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'error';
      case 'teacher': return 'primary';
      case 'student': return 'success';
      case 'parent': return 'warning';
      default: return 'default';
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return 'Quản trị viên';
      case 'teacher': return 'Giáo viên';
      case 'student': return 'Học sinh';
      case 'parent': return 'Phụ huynh';
      default: return role;
    }
  };

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <School sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            EduPlatform
          </Typography>
          <IconButton
            size="large"
            edge="end"
            color="inherit"
            onClick={handleMenuOpen}
          >
            <AccountCircle />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={() => { handleMenuClose(); navigate('/profile'); }}>
              <Person sx={{ mr: 1 }} />
              Hồ sơ cá nhân
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ExitToApp sx={{ mr: 1 }} />
              Đăng xuất
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Chào mừng, {user?.name}!
          </Typography>
          <Chip 
            label={getRoleText(user?.role || '')} 
            color={getRoleColor(user?.role || '')}
            variant="outlined"
          />
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <School color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Lớp học của tôi</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Xem và quản lý các lớp học bạn tham gia
                </Typography>
              </CardContent>
              <CardActions>
                <Button 
                  size="small" 
                  onClick={() => navigate('/classes')}
                >
                  Xem lớp học
                </Button>
              </CardActions>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Assignment color="secondary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Bài tập</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Xem bài tập và nộp bài
                </Typography>
              </CardContent>
              <CardActions>
                <Button 
                  size="small" 
                  onClick={() => navigate('/assignments')}
                >
                  Xem bài tập
                </Button>
              </CardActions>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Group color="success" sx={{ mr: 1 }} />
                  <Typography variant="h6">Tham gia lớp</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Tham gia lớp học bằng mã mời
                </Typography>
              </CardContent>
              <CardActions>
                <Button 
                  size="small" 
                  onClick={() => navigate('/join-class')}
                >
                  Tham gia lớp
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>

        {user?.role === 'teacher' && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" gutterBottom>
              Công cụ giáo viên
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">Tạo lớp học</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tạo lớp học mới cho học sinh
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      onClick={() => navigate('/create-class')}
                    >
                      Tạo lớp học
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">Tạo khóa học</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tạo khóa học mới
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      onClick={() => navigate('/create-course')}
                    >
                      Tạo khóa học
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}
      </Container>
    </Box>
  );
};
