import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  IconButton,
  Collapse,
  Badge,
  Tooltip,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  PersonAdd as PersonAddIcon,
  School as SchoolIcon,
  Class as ClassIcon,
  Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { useAdminWebSocket } from '../hooks/useAdminWebSocket';

interface AdminNotification {
  type: 'user_registered' | 'course_created' | 'classroom_created' | 'system_alert';
  message: string;
  timestamp: string;
  data?: any;
}

const RealTimeNotifications: React.FC = () => {
  const { notifications, clearNotifications } = useAdminWebSocket();
  const [expanded, setExpanded] = useState(false);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'user_registered':
        return <PersonAddIcon color="primary" />;
      case 'course_created':
        return <SchoolIcon color="success" />;
      case 'classroom_created':
        return <ClassIcon color="info" />;
      case 'system_alert':
        return <WarningIcon color="warning" />;
      default:
        return <NotificationsIcon />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'user_registered':
        return 'primary';
      case 'course_created':
        return 'success';
      case 'classroom_created':
        return 'info';
      case 'system_alert':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) { // Less than 1 minute
      return 'Vừa xong';
    } else if (diff < 3600000) { // Less than 1 hour
      return `${Math.floor(diff / 60000)} phút trước`;
    } else if (diff < 86400000) { // Less than 1 day
      return `${Math.floor(diff / 3600000)} giờ trước`;
    } else {
      return date.toLocaleDateString('vi-VN');
    }
  };

  return (
    <Paper sx={{ p: 2, borderRadius: 2, maxWidth: 400 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Badge badgeContent={notifications.length} color="error">
            <NotificationsIcon />
          </Badge>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Thông báo Real-time
          </Typography>
        </Box>
        <Box>
          <Tooltip title={expanded ? 'Thu gọn' : 'Mở rộng'}>
            <IconButton onClick={() => setExpanded(!expanded)} size="small">
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Tooltip>
          {notifications.length > 0 && (
            <Tooltip title="Xóa tất cả">
              <IconButton onClick={clearNotifications} size="small" color="error">
                <ClearIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      <Collapse in={expanded}>
        {notifications.length === 0 ? (
          <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 2 }}>
            Chưa có thông báo nào
          </Typography>
        ) : (
          <List dense>
            {notifications.slice(0, 5).map((notification, index) => (
              <ListItem key={index} sx={{ px: 0 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  {getNotificationIcon(notification.type)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {notification.message}
                      </Typography>
                      <Chip
                        label={notification.type.replace('_', ' ')}
                        color={getNotificationColor(notification.type) as any}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  }
                  secondary={
                    <Typography variant="caption" color="textSecondary">
                      {formatTime(notification.timestamp)}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
            {notifications.length > 5 && (
              <ListItem sx={{ px: 0 }}>
                <Typography variant="caption" color="textSecondary" sx={{ textAlign: 'center', width: '100%' }}>
                  Và {notifications.length - 5} thông báo khác...
                </Typography>
              </ListItem>
            )}
          </List>
        )}
      </Collapse>
    </Paper>
  );
};

export default RealTimeNotifications;
