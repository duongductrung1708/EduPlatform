import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography, Alert, Button } from '@mui/material';
import { isAuthenticated, getCurrentUser } from '../utils/auth';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  allowedRoles?: string[];
  fallback?: React.ReactNode;
}

export default function AuthGuard({ 
  children, 
  requireAuth = true, 
  allowedRoles = [], 
  fallback 
}: AuthGuardProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      const currentUser = getCurrentUser();
      
      setIsAuth(authenticated);
      setUser(currentUser);
      setLoading(false);

      if (requireAuth && !authenticated) {
        // Redirect to login if authentication is required but user is not authenticated
        navigate('/auth/login');
        return;
      }

      if (authenticated && allowedRoles.length > 0 && currentUser) {
        // Check if user has required role
        if (!allowedRoles.includes(currentUser.role)) {
          // Redirect to unauthorized page or show fallback
          if (fallback) {
            return;
          } else {
            navigate('/unauthorized');
            return;
          }
        }
      }
    };

    checkAuth();
  }, [navigate, requireAuth, allowedRoles, fallback]);

  if (loading) {
    return (
      <Box 
        display="flex" 
        flexDirection="column"
        alignItems="center" 
        justifyContent="center" 
        minHeight="50vh"
        gap={2}
      >
        <CircularProgress size={40} />
        <Typography variant="body2" color="text.secondary">
          Đang kiểm tra xác thực...
        </Typography>
      </Box>
    );
  }

  if (requireAuth && !isAuth) {
    return (
      <Box 
        display="flex" 
        flexDirection="column"
        alignItems="center" 
        justifyContent="center" 
        minHeight="50vh"
        gap={2}
        sx={{ p: 3 }}
      >
        <Alert severity="warning" sx={{ mb: 2 }}>
          Bạn cần đăng nhập để truy cập trang này
        </Alert>
        <Button 
          variant="contained" 
          onClick={() => navigate('/auth/login')}
          sx={{ 
            background: 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #FF7B7B 0%, #EF5B5B 100%)',
            }
          }}
        >
          Đăng nhập
        </Button>
      </Box>
    );
  }

  if (isAuth && allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <Box 
        display="flex" 
        flexDirection="column"
        alignItems="center" 
        justifyContent="center" 
        minHeight="50vh"
        gap={2}
        sx={{ p: 3 }}
      >
        <Alert severity="error" sx={{ mb: 2 }}>
          Bạn không có quyền truy cập trang này
        </Alert>
        <Button 
          variant="contained" 
          onClick={() => navigate(-1)}
          sx={{ 
            background: 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #FF7B7B 0%, #EF5B5B 100%)',
            }
          }}
        >
          Quay lại
        </Button>
      </Box>
    );
  }

  return <>{children}</>;
}
