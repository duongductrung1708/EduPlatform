import React, { useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  InputAdornment,
  IconButton,
} from '@mui/material';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useAuth } from '../contexts/AuthContext';
import ErrorAlert from '../components/ErrorAlert';
import OtpVerificationDialog from '../components/OtpVerificationDialog';
import Logo from '../components/Logo';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleLogin = async () => {
    // Prevent login if already loading
    if (loading) {
      return;
    }

    // Basic validation
    if (!email.trim() || !password.trim()) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      // Extract error message from different possible locations
      let errorMessage = 'Đăng nhập thất bại';

      // NestJS returns error in error.response.data.message (can be string or array)
      if (err.response?.data?.message) {
        const message = err.response.data.message;
        if (Array.isArray(message)) {
          errorMessage = message[0] || 'Đăng nhập thất bại';
        } else {
          errorMessage = message;
        }
      } else if (err.message) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }

      // Check if error is about unverified account
      if (
        errorMessage.includes('chưa được xác thực') ||
        errorMessage.includes('chưa được kích hoạt')
      ) {
        setPendingEmail(email);
        setOtpDialogOpen(true);
        setError('Tài khoản chưa được xác thực. Vui lòng nhập mã OTP để kích hoạt tài khoản.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerificationSuccess = (authData: any) => {
    // OTP verification successful, user is now logged in
    // AuthContext will automatically detect the stored tokens and update user state
    navigate(from, { replace: true });
  };

  const handleOtpDialogClose = () => {
    setOtpDialogOpen(false);
    setPendingEmail('');
  };

  return (
    <>
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: (t) =>
            t.palette.mode === 'dark'
              ? 'linear-gradient(135deg, #0f172a 0%, #111827 100%)'
              : 'linear-gradient(135deg, #e3f2fd 0%, #f5f7ff 100%)',
          p: 2,
          position: 'relative',
        }}
      >
        <Box sx={{ position: 'absolute', top: 16, left: 16 }}>
          <Logo height={48} />
        </Box>
        <Container maxWidth="sm">
          <Paper elevation={8} sx={{ p: 4, borderRadius: 3 }}>
            <Box textAlign="center" sx={{ mb: 3 }}>
              <Typography variant="h5" fontWeight={700} gutterBottom>
                Đăng nhập
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Chào mừng bạn quay trở lại với EduLearn
              </Typography>
            </Box>

            {error && (
              <Box sx={{ mb: 2 }}>
                <ErrorAlert error={error} onClose={() => setError('')} />
              </Box>
            )}

            <Box
              component="div"
              ref={formRef}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !loading) {
                  e.preventDefault();
                  e.stopPropagation();
                  handleLogin();
                }
              }}
              sx={{ mt: 2 }}
            >
              <TextField
                margin="normal"
                fullWidth
                id="email"
                label="Email"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MailOutlineIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                margin="normal"
                fullWidth
                name="password"
                label="Mật khẩu"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        type="button"
                        aria-label="toggle password visibility"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowPassword(!showPassword);
                        }}
                        edge="end"
                        size="small"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                type="button"
                fullWidth
                variant="contained"
                onClick={handleLogin}
                sx={{ mt: 3, mb: 2, py: 1.2, fontWeight: 600 }}
                disabled={loading}
              >
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </Button>
              <Box textAlign="center">
                <Link to="/auth/forgot-password" style={{ textDecoration: 'none' }}>
                  <Typography variant="body2" color="primary">
                    Quên mật khẩu?
                  </Typography>
                </Link>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Chưa có tài khoản?{' '}
                  <Link to="/auth/register" style={{ textDecoration: 'none' }}>
                    <Typography component="span" variant="body2" color="primary">
                      Đăng ký ngay
                    </Typography>
                  </Link>
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Container>
      </Box>

      <OtpVerificationDialog
        open={otpDialogOpen}
        onClose={handleOtpDialogClose}
        email={pendingEmail}
        onVerificationSuccess={handleOtpVerificationSuccess}
      />
    </>
  );
};
