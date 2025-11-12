import React from 'react';
import { Box, List, ListItemButton, ListItemIcon, ListItemText, Toolbar } from '@mui/material';
import { Dashboard, People, School, Class } from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';

const items = [
  { to: '/admin', icon: <Dashboard />, label: 'Bảng điều khiển' },
  { to: '/admin/users', icon: <People />, label: 'Người dùng' },
  { to: '/admin/courses', icon: <School />, label: 'Khóa học' },
  { to: '/admin/classrooms', icon: <Class />, label: 'Lớp học' },
];

export default function AdminSidebar() {
  const location = useLocation();
  const { darkMode } = useTheme();

  const isSelected = (to: string) => {
    if (to === '/admin') {
      return (
        location.pathname === '/admin' ||
        location.pathname === '/admin/' ||
        location.pathname === '/admin/dashboard'
      );
    }
    return location.pathname === to || location.pathname.startsWith(`${to}/`);
  };

  return (
    <Box sx={{ width: 259 }}>
      <Toolbar />
      <List sx={{ px: 2, py: 1 }}>
        {items.map((item) => (
          <ListItemButton
            key={item.to}
            component={Link}
            to={item.to}
            selected={isSelected(item.to)}
            sx={{
              mb: 1,
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
                color: darkMode ? '#b0b0b0' : '#777777',
                '& svg': { fontSize: 24 },
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{
                fontSize: '0.95rem',
                fontWeight: isSelected(item.to) ? 600 : 400,
              }}
            />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
}
