import React, { useState } from 'react';
import { Box, AppBar, Toolbar, IconButton, Typography, Drawer, useMediaQuery, Avatar, Tooltip, InputBase, alpha, Badge, Menu, MenuItem, ListItemText, Divider, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import SearchIcon from '@mui/icons-material/Search';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useTheme } from '../contexts/ThemeContext';
import TeacherSidebar from './sidebar/TeacherSidebar';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../hooks/useSocket';
import Logo from './Logo';
import { useNavigate, useLocation } from 'react-router-dom';
import VirtualAssistant from './VirtualAssistant';
import { deleteNotification, fetchNotifications, markAllNotificationsRead, markNotificationRead } from '../api/notifications';

const drawerWidth = 260;

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { theme, darkMode, toggleDarkMode } = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const { onClassMessage, onJoinedClassroom, on, off, onAny, offAny, onConnect } = useSocket();
  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<Array<{ id: string; text: string; ts: string; link?: string; _raw?: any; read?: boolean }>>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteAllConfirmOpen, setDeleteAllConfirmOpen] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const location = useLocation();
  const [search, setSearch] = useState(() => new URLSearchParams(location.search).get('q') || '');
  React.useEffect(() => {
    (async () => {
      try {
        setNotifLoading(true);
        const res = await fetchNotifications(20);
        setNotifications(res.items.map(it => ({ id: it._id, text: it.title || it.body, ts: new Date(it.createdAt).toLocaleTimeString(), link: it.meta?.link, _raw: it, read: it.read })));
        setUnreadCount(res.unread ?? 0);
      } catch {}
      finally { setNotifLoading(false); }
    })();
    const q = new URLSearchParams(location.search).get('q') || '';
    setSearch(q);
  }, [location.search]);
  const navigate = useNavigate();

  const handleDrawerToggle = () => setMobileOpen((v) => !v);
  const handleNotifOpen = (e: React.MouseEvent<HTMLElement>) => setNotifAnchor(e.currentTarget);
  const handleNotifClose = () => setNotifAnchor(null);

  React.useEffect(() => {
    const handleJoined = (_: any) => {};
    const handleMsg = (data: any) => {
      if (!data?.message) return;
      setNotifications((prev) => [{ id: crypto.randomUUID(), text: `Tin nhắn lớp: ${data.message}`, ts: new Date().toLocaleTimeString() }, ...prev].slice(0, 20));
      setUnreadCount((c) => c + 1);
    };
    const handleSubmissionCreated = (data: any) => {
      setNotifications((prev) => [{ id: crypto.randomUUID(), text: `HS nộp bài: ${data?.studentId ?? ''}`, ts: new Date().toLocaleTimeString() }, ...prev].slice(0, 10));
    };
    const handleEnrollmentAdded = (data: any) => {
      const name = data?.enrollment?.studentId?.name || 'Học sinh';
      setNotifications((prev) => [{ id: crypto.randomUUID(), text: `${name} đã ghi danh vào môn học`, ts: new Date().toLocaleTimeString() }, ...prev].slice(0, 20));
      setUnreadCount((c) => c + 1);
    };
    const handleEnrollmentRemoved = (data: any) => {
      setNotifications((prev) => [{ id: crypto.randomUUID(), text: `Một học sinh đã bị hủy ghi danh khỏi môn học`, ts: new Date().toLocaleTimeString() }, ...prev].slice(0, 20));
      setUnreadCount((c) => c + 1);
    };
    const handleNotificationCreated = (data: any) => {
      const text = data?.title || data?.body || 'Thông báo mới';
      setNotifications((prev) => [{ id: data?.id || crypto.randomUUID(), text, ts: new Date().toLocaleTimeString(), link: data?.link, _raw: data, read: false }, ...prev].slice(0, 20));
      setUnreadCount((c) => c + 1);
    };
    const handleCourseInvitationCreated = (data: any) => {
      const text = `Học sinh đã được mời tham gia môn học: ${data?.courseTitle}`;
      setNotifications((prev) => [{ id: data?.invitationId || crypto.randomUUID(), text, ts: new Date().toLocaleTimeString(), link: `/courses`, _raw: data, read: false }, ...prev].slice(0, 20));
      setUnreadCount((c) => c + 1);
    };
    const handleClassroomAdded = (data: any) => {
      const name = data?.student?.name || 'Học sinh';
      setNotifications((prev) => [{ id: crypto.randomUUID(), text: `${name} đã được thêm vào lớp học`, ts: new Date().toLocaleTimeString() }, ...prev].slice(0, 20));
      setUnreadCount((c) => c + 1);
    };
    const handleClassroomRemoved = (data: any) => {
      setNotifications((prev) => [{ id: crypto.randomUUID(), text: `Một học sinh đã bị xóa khỏi lớp học`, ts: new Date().toLocaleTimeString() }, ...prev].slice(0, 20));
      setUnreadCount((c) => c + 1);
    };
    // Debug: log any event
    const debug = (import.meta as any).env?.VITE_DEBUG_SOCKET === '1';
    const handleAny = (event: string, ...args: any[]) => {
    };

    onConnect(() => {
      onJoinedClassroom(handleJoined);
      onClassMessage(handleMsg);
      on('submissionCreated', handleSubmissionCreated);
      on('enrollmentAdded', handleEnrollmentAdded);
      on('enrollmentRemoved', handleEnrollmentRemoved);
      on('classroomStudentAdded', handleClassroomAdded);
      on('classroomStudentRemoved', handleClassroomRemoved);
      onAny(handleAny);
      on('notificationCreated', handleNotificationCreated);
      on('courseInvitationCreated', handleCourseInvitationCreated);
    });
    return () => {
      off('notificationCreated', handleNotificationCreated);
      off('courseInvitationCreated', handleCourseInvitationCreated);
      off('submissionCreated', handleSubmissionCreated);
      off('enrollmentAdded', handleEnrollmentAdded);
      off('enrollmentRemoved', handleEnrollmentRemoved);
      off('classroomStudentAdded', handleClassroomAdded);
      off('classroomStudentRemoved', handleClassroomRemoved);
      offAny(handleAny);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      setNotifications((prev) => prev.filter(p => p.id !== deleteTargetId));
      setUnreadCount(res.unread ?? 0);
      setDeleteConfirmOpen(false);
      setDeleteTargetId(null);
    } catch {}
    finally {
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
      // Delete all notifications one by one
      for (const notification of notifications) {
        await deleteNotification(notification.id);
      }
      setNotifications([]);
      setUnreadCount(0);
      setDeleteAllConfirmOpen(false);
    } catch {}
    finally {
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
      setNotifications((prev) => prev.map(p => ({ ...p, read: true })));
    } catch {}
  };

  const drawer = <TeacherSidebar />;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar position="fixed" sx={{ 
        width: { md: `calc(100% - ${drawerWidth}px)` }, 
        ml: { md: `${drawerWidth}px` }, 
        background: darkMode 
          ? 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)'
          : 'linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%)',
        color: darkMode ? '#ffffff' : '#333333',
        boxShadow: '0 4px 20px rgba(239, 91, 91, 0.1)',
        borderBottom: '1px solid rgba(239, 91, 91, 0.1)',
        backdropFilter: 'blur(10px)'
      }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2, display: { md: 'none' } }}>
            <MenuIcon />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Logo height={36} onClick={() => navigate('/dashboard')} />
            <Typography variant="h6" noWrap component="div" sx={{ 
              fontWeight: 800,
              background: darkMode 
                ? 'linear-gradient(135deg, #FF7B7B 0%, #EF5B5B 100%)'
                : 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: 'transparent'
            }}>
              EduLearn
            </Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{
            position: 'relative',
            borderRadius: 3,
            backgroundColor: 'rgba(239, 91, 91, 0.05)',
            border: '1px solid rgba(239, 91, 91, 0.1)',
            '&:hover': { 
              backgroundColor: 'rgba(239, 91, 91, 0.1)',
              border: '1px solid rgba(239, 91, 91, 0.2)'
            },
            mr: 2,
            ml: 2,
            display: { xs: 'none', sm: 'flex' },
            alignItems: 'center',
            px: 2,
            py: 1,
            transition: 'all 0.3s ease'
          }}>
            <SearchIcon fontSize="small" sx={{ color: '#EF5B5B' }} />
            <InputBase
              placeholder="Tìm kiếm..."
              sx={{ ml: 1, width: 220 }}
              inputProps={{ 'aria-label': 'search' }}
              value={search}
              onChange={(e) => {
                const next = e.target.value;
                setSearch(next);
                const q = next.trim();
                const target = q ? `/teacher/classrooms?q=${encodeURIComponent(q)}` : '/teacher/classrooms';
                if (!location.pathname.startsWith('/teacher/classrooms')) {
                  navigate(target, { replace: true });
                } else {
                  navigate(target, { replace: true });
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const q = search.trim();
                  navigate(q ? `/teacher/classrooms?q=${encodeURIComponent(q)}` : '/teacher/classrooms');
                }
              }}
            />
          </Box>
          <Tooltip title="Hồ sơ">
            <IconButton 
              color="inherit" 
              onClick={() => navigate('/profile')}
              sx={{ 
                '&:hover': { 
                  backgroundColor: 'rgba(239, 91, 91, 0.1)',
                  transform: 'scale(1.05)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              <Avatar sx={{ 
                width: 36, 
                height: 36,
                border: '2px solid rgba(239, 91, 91, 0.2)',
                background: 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)'
              }} src={(user as any)?.avatar}>
                {user?.name?.charAt(0) || 'U'}
              </Avatar>
            </IconButton>
          </Tooltip>
          <Tooltip title={darkMode ? 'Chế độ sáng' : 'Chế độ tối'}>
            <IconButton 
              color="inherit" 
              onClick={toggleDarkMode}
              sx={{ 
                color: '#EF5B5B',
                '&:hover': { 
                  backgroundColor: 'rgba(239, 91, 91, 0.1)',
                  transform: 'scale(1.05)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Thông báo">
            <IconButton 
              color="inherit" 
              onClick={handleNotifOpen}
              sx={{ 
                color: '#EF5B5B',
                '&:hover': { 
                  backgroundColor: 'rgba(239, 91, 91, 0.1)',
                  transform: 'scale(1.05)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              <Badge 
                color="error" 
                badgeContent={unreadCount}
                sx={{
                  '& .MuiBadge-badge': {
                    backgroundColor: '#EF5B5B',
                    color: 'white',
                    fontWeight: 600
                  }
                }}
              >
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          <Tooltip title="Đăng xuất">
            <IconButton 
              color="inherit" 
              onClick={() => { logout(); navigate('/auth/login'); }}
              sx={{ 
                color: '#EF5B5B',
                '&:hover': { 
                  backgroundColor: 'rgba(239, 91, 91, 0.1)',
                  transform: 'scale(1.05)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>
      <Menu anchorEl={notifAnchor} open={Boolean(notifAnchor)} onClose={handleNotifClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { width: 360, maxHeight: 420 } }}>
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Thông báo</Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Tooltip title="Đánh dấu tất cả là đã đọc"><IconButton size="small" onClick={handleMarkAllRead} aria-label="mark all read">
              <Badge color="error" variant="dot" invisible={unreadCount === 0}>
                <NotificationsIcon fontSize="small" />
              </Badge>
            </IconButton></Tooltip>
            <Tooltip title="Xóa tất cả thông báo"><IconButton size="small" onClick={handleDeleteAllNotifications} aria-label="delete all notifications" disabled={notifications.length === 0}>
              <CloseIcon fontSize="small" />
            </IconButton></Tooltip>
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
            <MenuItem key={n.id} onClick={() => handleClickNotification(n)} sx={{ alignItems: 'flex-start', gap: 1, py: 1.5, minHeight: 'auto' }} aria-label="notification item">
              <Box sx={{ mt: 1 }}>
                <Badge color="error" variant="dot" invisible={!!n.read}>
                  <Box sx={{ width: 8, height: 8 }} />
                </Badge>
              </Box>
              <ListItemText 
                primaryTypographyProps={{ 
                  fontWeight: n.read ? 400 : 700,
                  whiteSpace: 'pre-wrap',
                  sx: { wordBreak: 'break-word' }
                }} 
                primary={n.text} 
                secondary={n.ts} 
              />
              <Tooltip title="Xóa">
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDeleteNotification(n.id); }} aria-label="delete notification">
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </MenuItem>
          ))}
        </Box>
        <Divider />
        <Box sx={{ px: 2, py: 1, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">Nhấn vào thông báo để mở trang chi tiết</Typography>
        </Box>
      </Menu>
      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer variant="temporary" open={mobileOpen} onClose={handleDrawerToggle} ModalProps={{ keepMounted: true }} sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' } }}>
          {drawer}
        </Drawer>
        <Drawer variant="permanent" sx={{ 
          display: { xs: 'none', md: 'block' }, 
          '& .MuiDrawer-paper': { 
            width: drawerWidth, 
            boxSizing: 'border-box', 
            background: 'linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%)',
            boxShadow: '2px 0 20px rgba(239, 91, 91, 0.1)',
            borderRight: '1px solid rgba(239, 91, 91, 0.1)'
          } 
        }} open>
          {drawer}
        </Drawer>
      </Box>
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 3 }, mt: 8, backgroundColor: 'background.default' }}>{children}</Box>
      
      {/* Virtual Assistant */}
      <VirtualAssistant />
      
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
}


