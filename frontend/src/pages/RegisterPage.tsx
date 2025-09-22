import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  IconButton,
  Alert,
} from '@mui/material';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useAuth } from '../contexts/AuthContext';
import ErrorAlert from '../components/ErrorAlert';
import OtpVerificationDialog from '../components/OtpVerificationDialog';
import Logo from '../components/Logo';

export const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (password.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự');
      return;
    }

    setLoading(true);

    try {
      const result = await register(email, name, password, role);
      
      // Check if registration requires OTP verification
      if (result.requiresVerification) {
        setRegistrationSuccess(true);
        setOtpDialogOpen(true);
      } else {
        // Direct login (fallback for admin users)
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerificationSuccess = (authData: any) => {
    // OTP verification successful, user is now logged in
    // AuthContext will automatically detect the stored tokens and update user state
    navigate('/dashboard');
  };

  const handleOtpDialogClose = () => {
    setOtpDialogOpen(false);
    // Reset form if user cancels OTP verification
    if (!registrationSuccess) {
      setEmail('');
      setName('');
      setPassword('');
      setConfirmPassword('');
    }
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
      position: 'relative',
    }}>
      <Box sx={{ position: 'absolute', top: 16, left: 16 }}>
        <Logo height={48} />
      </Box>
      <Container maxWidth="sm">
        <Paper elevation={8} sx={{ p: 4, borderRadius: 3 }}>
          <Box textAlign="center" sx={{ mb: 2 }}>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Tạo tài khoản mới
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Học sinh có thể đăng ký nhanh để tham gia lớp học
            </Typography>
          </Box>

          {error && (
            <ErrorAlert 
              error={error} 
              title="Đăng ký thất bại"
              showDetails={true}
              onClose={() => setError('')}
            />
          )}

          {registrationSuccess && (
            <Alert 
              severity="success" 
              sx={{ mb: 2, borderRadius: 2 }}
              icon={<CheckCircleIcon />}
            >
              <Typography variant="body2">
                <strong>Đăng ký thành công!</strong> Vui lòng kiểm tra email để xác thực tài khoản.
              </Typography>
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="name"
              label="Họ và tên"
              name="name"
              autoComplete="name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonOutlineIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email"
              name="email"
              autoComplete="email"
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
            <FormControl fullWidth margin="normal">
              <InputLabel id="role-label">Vai trò</InputLabel>
              <Select
                labelId="role-label"
                id="role"
                value={role}
                label="Vai trò"
                onChange={(e) => setRole(e.target.value)}
                disabled={loading}
              >
                <MenuItem value="student">Học sinh</MenuItem>
                <MenuItem value="teacher">Giáo viên</MenuItem>
                <MenuItem value="parent">Phụ huynh</MenuItem>
              </Select>
            </FormControl>
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Mật khẩu"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="new-password"
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
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Xác nhận mật khẩu"
              type={showConfirm ? 'text' : 'password'}
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowConfirm((v) => !v)} edge="end" size="small">
                      {showConfirm ? <VisibilityOff /> : <Visibility />}
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
              disabled={loading || registrationSuccess}
            >
              {loading ? 'Đang đăng ký...' : registrationSuccess ? 'Đã gửi email xác thực' : 'Đăng ký'}
            </Button>
            <Box textAlign="center">
              <Link to="/auth/login" style={{ textDecoration: 'none' }}>
                <Typography variant="body2" color="primary">
                  Đã có tài khoản? Đăng nhập ngay
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
        email={email}
        onVerificationSuccess={handleOtpVerificationSuccess}
      />
    </Box>
  );
};
