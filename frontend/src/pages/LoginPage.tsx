import React, { useState } from 'react';
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

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      const errorMessage = err.message || 'Đăng nhập thất bại';
      
      // Check if error is about unverified account
      if (errorMessage.includes('chưa được xác thực') || errorMessage.includes('chưa được kích hoạt')) {
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
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: (t) => t.palette.mode === 'dark'
        ? 'linear-gradient(135deg, #0f172a 0%, #111827 100%)'
        : 'linear-gradient(135deg, #e3f2fd 0%, #f5f7ff 100%)',
      p: 2,
    }}>
      <Container maxWidth="xs">
        <Paper elevation={8} sx={{
          p: 4,
          borderRadius: 3,
          backdropFilter: 'blur(6px)',
        }}>
          <Box textAlign="center" sx={{ mb: 2 }}>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Chào mừng trở lại
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Đăng nhập để tiếp tục học tập và giảng dạy
            </Typography>
          </Box>

          {error && (
            <ErrorAlert 
              error={error} 
              title="Đăng nhập thất bại"
              showDetails={true}
              onClose={() => setError('')}
            />
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <TextField
              margin="normal"
              required
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
              required
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
                    <IconButton onClick={() => setShowPassword((v) => !v)} edge="end" size="small">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.2, fontWeight: 600 }}
              disabled={loading}
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Link to="/auth/register" style={{ textDecoration: 'none' }}>
                <Typography variant="body2" color="primary">
                  Chưa có tài khoản? Đăng ký ngay
                </Typography>
              </Link>
              <Link to="/auth/forgot-password" style={{ textDecoration: 'none' }}>
                <Typography variant="body2" color="primary">
                  Quên mật khẩu?
                </Typography>
              </Link>
            </Box>
          </Box>
        </Paper>
      </Container>

      {/* OTP Verification Dialog */}
      <OtpVerificationDialog
        open={otpDialogOpen}
        onClose={handleOtpDialogClose}
        email={pendingEmail}
        onVerificationSuccess={handleOtpVerificationSuccess}
      />
    </Box>
  );
};
