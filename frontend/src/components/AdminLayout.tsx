import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Switch,
  FormControlLabel,
  useTheme as useMuiTheme,
  useMediaQuery,
  Badge,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  Class as ClassIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountCircleIcon,
  Logout as LogoutIcon,
  Storage as StorageIcon,
  Security as SecurityIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import Logo from './Logo';
import {
  deleteNotification,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../api/notifications';

const drawerWidth = 280;

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode, theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<
    Array<{ id: string; text: string; ts: string; link?: string; _raw?: any; read?: boolean }>
  >([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteAllConfirmOpen, setDeleteAllConfirmOpen] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const { on, off, onConnect } = useSocket();

  const menuItems = [
    { text: 'Bảng điều khiển', icon: <DashboardIcon />, path: '/admin' },
    { text: 'Người dùng', icon: <PeopleIcon />, path: '/admin/users' },
    { text: 'Môn học', icon: <SchoolIcon />, path: '/admin/courses' },
    { text: 'Lớp học', icon: <ClassIcon />, path: '/admin/classrooms' },
    { text: 'Lưu trữ', icon: <StorageIcon />, path: '/admin/storage' },
    { text: 'Bảo mật', icon: <SecurityIcon />, path: '/admin/security' },
    { text: 'Cài đặt', icon: <SettingsIcon />, path: '/admin/settings' },
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
    handleMenuClose();
  };

  // Fetch notifications on mount and location change
  React.useEffect(() => {
    (async () => {
      try {
        setNotifLoading(true);
        const res = await fetchNotifications(20);
        setNotifications(
          res.items.map((it) => ({
            id: it._id,
            text: it.title || it.body,
            ts: new Date(it.createdAt).toLocaleTimeString(),
            link: it.meta?.link,
            _raw: it,
            read: it.read,
          })),
        );
        setUnreadCount(res.unread ?? 0);
      } catch {
      } finally {
        setNotifLoading(false);
      }
    })();
  }, [location.pathname]);

  // Socket event handlers for real-time notifications
  React.useEffect(() => {
    const handleNotificationCreated = (data: any) => {
      const text = data?.title || data?.body || 'Thông báo mới';
      setNotifications((prev) =>
        [
          {
            id: data?.id || crypto.randomUUID(),
            text,
            ts: new Date().toLocaleTimeString(),
            link: data?.link,
            _raw: data,
            read: false,
          },
          ...prev,
        ].slice(0, 20),
      );
      setUnreadCount((c) => c + 1);
    };
    const handleUserCreated = (data: any) => {
      const name = data?.user?.name || 'Người dùng';
      setNotifications((prev) =>
        [
          {
            id: crypto.randomUUID(),
            text: `${name} đã đăng ký tài khoản mới`,
            ts: new Date().toLocaleTimeString(),
            link: '/admin/users',
            _raw: data,
            read: false,
          },
          ...prev,
        ].slice(0, 20),
      );
      setUnreadCount((c) => c + 1);
    };
    const handleCourseCreated = (data: any) => {
      const title = data?.course?.title || 'Khóa học';
      setNotifications((prev) =>
        [
          {
            id: crypto.randomUUID(),
            text: `Khóa học mới: ${title}`,
            ts: new Date().toLocaleTimeString(),
            link: '/admin/courses',
            _raw: data,
            read: false,
          },
          ...prev,
        ].slice(0, 20),
      );
      setUnreadCount((c) => c + 1);
    };
    const handleClassroomCreated = (data: any) => {
      const name = data?.classroom?.name || data?.classroom?.title || 'Lớp học';
      setNotifications((prev) =>
        [
          {
            id: crypto.randomUUID(),
            text: `Lớp học mới: ${name}`,
            ts: new Date().toLocaleTimeString(),
            link: '/admin/classrooms',
            _raw: data,
            read: false,
          },
          ...prev,
        ].slice(0, 20),
      );
      setUnreadCount((c) => c + 1);
    };

    onConnect(() => {
      on('notificationCreated', handleNotificationCreated);
      on('userCreated', handleUserCreated);
      on('courseCreated', handleCourseCreated);
      on('classroomCreated', handleClassroomCreated);
    });
    return () => {
      off('notificationCreated', handleNotificationCreated);
      off('userCreated', handleUserCreated);
      off('courseCreated', handleCourseCreated);
      off('classroomCreated', handleClassroomCreated);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNotifOpen = (e: React.MouseEvent<HTMLElement>) => setNotifAnchor(e.currentTarget);
  const handleNotifClose = () => setNotifAnchor(null);

  const handleClickNotification = async (n: { id: string; link?: string; _raw?: any }) => {
    try {
      if (n._raw && !n._raw.read) {
        const res = await markNotificationRead(n.id);
        setUnreadCount(res.unread ?? 0);
      }
    } catch {}
    if (n.link) {
      navigate(n.link);
    }
    setNotifAnchor(null);
  };

  const handleDeleteNotification = (nid: string) => {
    setDeleteTargetId(nid);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    try {
      const res = await deleteNotification(deleteTargetId);
      setNotifications((prev) => prev.filter((p) => p.id !== deleteTargetId));
      setUnreadCount(res.unread ?? 0);
      setDeleteConfirmOpen(false);
      setDeleteTargetId(null);
    } catch {
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setDeleteTargetId(null);
  };

  const handleDeleteAllNotifications = () => {
    setDeleteAllConfirmOpen(true);
  };

  const handleConfirmDeleteAll = async () => {
    setDeletingAll(true);
    try {
      for (const notification of notifications) {
        await deleteNotification(notification.id);
      }
      setNotifications([]);
      setUnreadCount(0);
      setDeleteAllConfirmOpen(false);
    } catch {
    } finally {
      setDeletingAll(false);
    }
  };

  const handleCancelDeleteAll = () => {
    setDeleteAllConfirmOpen(false);
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await markAllNotificationsRead();
      setUnreadCount(res.unread ?? 0);
      setNotifications((prev) => prev.map((p) => ({ ...p, read: true })));
    } catch {}
  };

  const drawer = (
    <Box>
      {/* Logo Section */}
      <Box sx={{ p: 3, textAlign: 'center', borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          EduLearn
        </Typography>
        <Typography variant="caption" color="textSecondary">
          Bảng quản trị
        </Typography>
      </Box>

      {/* User Info */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>{user?.name?.charAt(0) || 'A'}</Avatar>
          <Box>
            <Typography variant="subtitle2" fontWeight="medium">
              {user?.name || 'Admin User'}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {user?.email || 'admin@example.com'}
            </Typography>
          </Box>
        </Box>
        <FormControlLabel
          control={
            <Switch
              checked={darkMode}
              onChange={toggleDarkMode}
              icon={<LightModeIcon />}
              checkedIcon={<DarkModeIcon />}
              size="small"
            />
          }
          label="Chế độ tối"
          sx={{ ml: 0 }}
        />
      </Box>

      {/* Navigation Menu */}
      <List sx={{ px: 2, py: 1 }}>
        {menuItems.map((item) => {
          const isSelected =
            location.pathname === item.path ||
            (item.path === '/admin' && location.pathname === '/dashboard') ||
            (item.path !== '/admin' && location.pathname.startsWith(item.path));

          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={isSelected}
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) setMobileOpen(false);
                }}
                sx={{
                  borderRadius: 3,
                  py: 1.5,
                  px: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(239, 91, 91, 0.1)',
                    '& .MuiListItemIcon-root': {
                      color: '#EF5B5B',
                      transform: 'scale(1.1)',
                    },
                    '& .MuiListItemText-primary': {
                      color: '#EF5B5B',
                      fontWeight: 600,
                    },
                  },
                  '&.Mui-selected': {
                    background: 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
                    color: 'white',
                    boxShadow: '0 4px 15px rgba(239, 91, 91, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #D94A4A 0%, #EF5B5B 100%)',
                      boxShadow: '0 6px 20px rgba(239, 91, 91, 0.4)',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'white',
                      transform: 'scale(1.1)',
                    },
                    '& .MuiListItemText-primary': {
                      color: 'white',
                      fontWeight: 600,
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 44,
                    transition: 'all 0.3s ease',
                    color: isSelected ? 'white' : darkMode ? '#b0b0b0' : '#777777',
                    '& svg': { fontSize: 24 },
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '0.95rem',
                    fontWeight: isSelected ? 600 : 400,
                    color: isSelected ? 'white' : 'inherit',
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          backgroundColor: 'background.paper',
          color: 'text.primary',
          boxShadow: 1,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Logo height={36} onClick={() => navigate('/admin')} />
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{
                fontWeight: 800,
                background: darkMode
                  ? 'linear-gradient(135deg, #FF7B7B 0%, #EF5B5B 100%)'
                  : 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                color: 'transparent',
                flexGrow: 1,
                ml: 2,
              }}
            >
              {menuItems.find((item) => item.path === location.pathname)?.text || 'Bảng điều khiển'}
            </Typography>
          </Box>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ flexGrow: 1, ml: 2, fontWeight: 600 }}
          ></Typography>

          {/* Notifications */}
          <Tooltip title="Thông báo">
            <IconButton
              color="inherit"
              onClick={handleNotifOpen}
              sx={{
                color: '#EF5B5B',
                mr: 1,
                '&:hover': {
                  backgroundColor: 'rgba(239, 91, 91, 0.1)',
                },
              }}
            >
              <Badge
                badgeContent={unreadCount}
                color="error"
                sx={{
                  '& .MuiBadge-badge': {
                    backgroundColor: '#EF5B5B',
                    color: 'white',
                    fontWeight: 600,
                  },
                }}
              >
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* User Menu */}
          <IconButton
            size="large"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenuOpen}
            color="inherit"
            sx={{
              color: '#EF5B5B',
              '&:hover': {
                backgroundColor: 'rgba(239, 91, 91, 0.1)',
                transform: 'scale(1.05)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            <AccountCircleIcon />
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem
              onClick={() => {
                navigate('/profile');
                handleMenuClose();
              }}
            >
              <ListItemIcon>
                <AccountCircleIcon fontSize="small" />
              </ListItemIcon>
              Hồ sơ
            </MenuItem>
            <MenuItem
              onClick={() => {
                navigate('/admin/settings');
                handleMenuClose();
              }}
            >
              <ListItemIcon>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              Cài đặt
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Đăng xuất
            </MenuItem>
          </Menu>

          {/* Notifications Menu */}
          <Menu
            anchorEl={notifAnchor}
            open={Boolean(notifAnchor)}
            onClose={handleNotifClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{ sx: { width: 360, maxHeight: 420 } }}
          >
            <Box
              sx={{
                px: 2,
                py: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Thông báo
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Tooltip title="Đánh dấu tất cả là đã đọc">
                  <IconButton size="small" onClick={handleMarkAllRead} aria-label="mark all read">
                    <Badge color="error" variant="dot" invisible={unreadCount === 0}>
                      <NotificationsIcon fontSize="small" />
                    </Badge>
                  </IconButton>
                </Tooltip>
                <Tooltip title="Xóa tất cả thông báo">
                  <IconButton
                    size="small"
                    onClick={handleDeleteAllNotifications}
                    aria-label="delete all notifications"
                    disabled={notifications.length === 0}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            <Divider />
            {notifLoading && (
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress size={20} />
              </Box>
            )}
            {!notifLoading && notifications.length === 0 && (
              <MenuItem disabled>
                <ListItemText primary="Chưa có thông báo" />
              </MenuItem>
            )}
            <Box sx={{ maxHeight: 360, overflowY: 'auto' }}>
              {notifications.map((n) => (
                <MenuItem
                  key={n.id}
                  onClick={() => handleClickNotification(n)}
                  sx={{ alignItems: 'flex-start', gap: 1, py: 1.5, minHeight: 'auto' }}
                  aria-label="notification item"
                >
                  <Box sx={{ mt: 1 }}>
                    <Badge color="error" variant="dot" invisible={!!n.read}>
                      <Box sx={{ width: 8, height: 8 }} />
                    </Badge>
                  </Box>
                  <ListItemText
                    primaryTypographyProps={{
                      fontWeight: n.read ? 400 : 700,
                      whiteSpace: 'pre-wrap',
                      sx: { wordBreak: 'break-word' },
                    }}
                    primary={n.text}
                    secondary={n.ts}
                  />
                  <Tooltip title="Xóa">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNotification(n.id);
                      }}
                      aria-label="delete notification"
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </MenuItem>
              ))}
            </Box>
            <Divider />
            <Box sx={{ px: 2, py: 1, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Nhấn vào thông báo để mở trang chi tiết
              </Typography>
            </Box>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              backgroundColor: 'background.paper',
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              backgroundColor: 'background.paper',
              borderRight: 1,
              borderColor: 'divider',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: 8, // Account for AppBar height
          backgroundColor: 'background.default',
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        {children}
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={handleCancelDelete}>
        <DialogTitle>Xóa thông báo?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Bạn có chắc muốn xóa thông báo này? Hành động không thể hoàn tác.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} disabled={deleting}>
            Hủy
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleConfirmDelete}
            disabled={deleting}
          >
            {deleting ? 'Đang xóa...' : 'Xóa'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete All Confirmation Dialog */}
      <Dialog open={deleteAllConfirmOpen} onClose={handleCancelDeleteAll}>
        <DialogTitle>Xóa tất cả thông báo?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Bạn có chắc muốn xóa tất cả thông báo? Hành động không thể hoàn tác.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDeleteAll} disabled={deletingAll}>
            Hủy
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleConfirmDeleteAll}
            disabled={deletingAll}
          >
            {deletingAll ? 'Đang xóa...' : 'Xóa tất cả'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminLayout;
