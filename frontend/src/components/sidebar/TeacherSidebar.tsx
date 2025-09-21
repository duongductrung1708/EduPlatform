import React, { useState } from 'react';
import { Box, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Divider } from '@mui/material';
import { Dashboard, Class, Assignment, People, School, HelpOutline } from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import HelpGuide from '../HelpGuide';

const items = [
  { to: '/teacher', icon: <Dashboard />, label: 'Tổng quan' },
  { to: '/teacher/classrooms', icon: <Class />, label: 'Lớp của tôi' },
  { to: '/teacher/courses', icon: <School />, label: 'Môn học của tôi' },
  { to: '/teacher/assignments', icon: <Assignment />, label: 'Bài tập' },
  { to: '/teacher/students', icon: <People />, label: 'Học sinh' },
];

export default function TeacherSidebar() {
  const location = useLocation();
  const { darkMode } = useTheme();
  const [helpOpen, setHelpOpen] = useState(false);
  
  const isSelected = (to: string) => {
    if (to === '/teacher') {
      return (
        location.pathname === '/teacher' ||
        location.pathname === '/teacher/' ||
        location.pathname === '/dashboard'
      );
    }
    return location.pathname === to || location.pathname.startsWith(`${to}/`);
  };
  return (
    <Box sx={{ 
      width: 260, 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden',
      background: darkMode 
        ? 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)'
        : 'linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%)'
    }}>
      <Toolbar />
      <List sx={{ px: 2, py: 1, overflow: 'hidden' }}>
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
                  transform: 'scale(1.1)'
                },
                '& .MuiListItemText-primary': { 
                  color: '#EF5B5B',
                  fontWeight: 600
                }
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
                  transform: 'scale(1.1)'
                },
                '& .MuiListItemText-primary': { 
                  color: 'white',
                  fontWeight: 600
                }
              },
            }}
          >
            <ListItemIcon sx={{ 
              minWidth: 44,
              transition: 'all 0.3s ease',
              color: darkMode ? '#b0b0b0' : '#777777'
            }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.label} 
              sx={{
                '& .MuiListItemText-primary': {
                  fontWeight: 500,
                  fontSize: '0.95rem',
                  color: darkMode ? '#e0e0e0' : '#333333',
                  transition: 'all 0.3s ease'
                }
              }}
            />
          </ListItemButton>
        ))}
        
        {/* Help Guide Section */}
        <Divider sx={{ my: 2, borderColor: 'rgba(239, 91, 91, 0.1)' }} />
        <ListItemButton
          onClick={() => setHelpOpen(true)}
          sx={{
            mb: 1,
            borderRadius: 3,
            py: 1.5,
            px: 2,
            transition: 'all 0.3s ease',
            backgroundColor: 'rgba(239, 91, 91, 0.05)',
            border: '1px solid rgba(239, 91, 91, 0.1)',
            '&:hover': {
              backgroundColor: 'rgba(239, 91, 91, 0.1)',
              border: '1px solid rgba(239, 91, 91, 0.2)',
              '& .MuiListItemIcon-root': { 
                color: '#EF5B5B',
                transform: 'scale(1.1)'
              },
              '& .MuiListItemText-primary': { 
                color: '#EF5B5B',
                fontWeight: 600
              }
            }
          }}
        >
          <ListItemIcon sx={{ 
            minWidth: 44,
            transition: 'all 0.3s ease',
            color: '#EF5B5B'
          }}>
            <HelpOutline />
          </ListItemIcon>
          <ListItemText 
            primary="Hướng dẫn sử dụng" 
            sx={{
              '& .MuiListItemText-primary': {
                fontWeight: 500,
                fontSize: '0.95rem',
                color: '#EF5B5B',
                transition: 'all 0.3s ease'
              }
            }}
          />
        </ListItemButton>
      </List>
      
      {/* Help Guide Dialog */}
      <HelpGuide 
        open={helpOpen} 
        onClose={() => setHelpOpen(false)} 
        userRole="teacher" 
      />
    </Box>
  );
}


