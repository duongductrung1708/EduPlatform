import React from 'react';
import { Box, List, ListItemButton, ListItemIcon, ListItemText, Toolbar } from '@mui/material';
import { Dashboard, People, School, Class, Insights } from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';

const items = [
  { to: '/admin', icon: <Dashboard />, label: 'Dashboard' },
  { to: '/admin/users', icon: <People />, label: 'Người dùng' },
  { to: '/admin/courses', icon: <School />, label: 'Khóa học' },
  { to: '/admin/classrooms', icon: <Class />, label: 'Lớp học' },
  { to: '/admin/analytics', icon: <Insights />, label: 'Analytics' },
];

export default function AdminSidebar() {
  const location = useLocation();

  return (
    <Box sx={{ width: 260 }}>
      <Toolbar />
      <List>
        {items.map((item) => (
          <ListItemButton key={item.to} component={Link} to={item.to} selected={location.pathname.startsWith(item.to)}>
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
}


