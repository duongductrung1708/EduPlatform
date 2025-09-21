import React, { useState } from 'react';
import { Box, AppBar, Toolbar, IconButton, Typography, Drawer, useMediaQuery, Avatar, Tooltip, InputBase, alpha, Badge, Menu, MenuItem, ListItemText } from '@mui/material';
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

const drawerWidth = 260;

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { theme, darkMode, toggleDarkMode } = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const { onClassMessage, onJoinedClassroom, socket } = useSocket();
  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<Array<{ id: string; text: string; ts: string }>>([]);
  const location = useLocation();
  const [search, setSearch] = useState(() => new URLSearchParams(location.search).get('q') || '');
  React.useEffect(() => {
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
      setNotifications((prev) => [{ id: crypto.randomUUID(), text: `Tin nhắn lớp: ${data.message}`, ts: new Date().toLocaleTimeString() }, ...prev].slice(0, 10));
    };
    const handleSubmissionCreated = (data: any) => {
      setNotifications((prev) => [{ id: crypto.randomUUID(), text: `HS nộp bài: ${data?.studentId ?? ''}`, ts: new Date().toLocaleTimeString() }, ...prev].slice(0, 10));
    };
    onJoinedClassroom(handleJoined);
    onClassMessage(handleMsg);
    socket?.on('submissionCreated', handleSubmissionCreated);
    return () => {
      socket?.off('submissionCreated', handleSubmissionCreated);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
                badgeContent={notifications.length}
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
      <Menu anchorEl={notifAnchor} open={Boolean(notifAnchor)} onClose={handleNotifClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
        {notifications.length === 0 && (
          <MenuItem disabled>
            <ListItemText primary="Chưa có thông báo" />
          </MenuItem>
        )}
        {notifications.map((n) => (
          <MenuItem key={n.id} onClick={handleNotifClose}>
            <ListItemText primary={n.text} secondary={n.ts} />
          </MenuItem>
        ))}
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
    </Box>
  );
}


