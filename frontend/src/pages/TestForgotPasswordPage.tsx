import React, { useState } from 'react';
import { Container, Paper, Typography, Box, Button, Alert, TextField, InputAdornment, Link } from '@mui/material';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import { authApi } from '../api/auth';
import Logo from '../components/Logo';

const TestForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [step, setStep] = useState<'forgot' | 'reset'>('forgot');

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Vui lòng nhập email');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await authApi.forgotPassword(email);
      setSuccess(res.message || 'Email đã được gửi');
      if (res.token) {
        setToken(res.token);
        setStep('reset');
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Không thể gửi yêu cầu');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!token || !newPassword) {
      setError('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    if (newPassword.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await authApi.resetPassword(token, newPassword);
      setSuccess(res.message || 'Đặt lại mật khẩu thành công');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Không thể đặt lại mật khẩu');
    } finally {
      setLoading(false);
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
    }}>
      <Container maxWidth="sm">
        <Paper sx={{ p: 4, borderRadius: 3 }} elevation={8}>
          <Box textAlign="center" sx={{ mb: 3 }}>
            <Box sx={{ mb: 2 }}>
              <Logo height={60} />
            </Box>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Test Forgot Password
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Trang test chức năng quên mật khẩu
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          {step === 'forgot' ? (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Bước 1: Yêu cầu đặt lại mật khẩu
              </Typography>
              <TextField
                margin="normal"
                required
                fullWidth
                type="email"
                label="Email"
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
              <Button
                fullWidth
                variant="contained"
                onClick={handleForgotPassword}
                disabled={loading || !email}
                sx={{ mt: 3, mb: 2, py: 1.2, fontWeight: 600 }}
              >
                {loading ? 'Đang gửi...' : 'Gửi yêu cầu đặt lại mật khẩu'}
              </Button>
            </Box>
          ) : (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Bước 2: Đặt lại mật khẩu
              </Typography>
              <TextField
                margin="normal"
                required
                fullWidth
                label="Token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                disabled={loading}
                helperText="Token từ bước 1 (có thể tự động điền)"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <VpnKeyIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                type="password"
                label="Mật khẩu mới"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
                helperText="Mật khẩu phải có ít nhất 8 ký tự"
              />
              <Button
                fullWidth
                variant="contained"
                onClick={handleResetPassword}
                disabled={loading || !token || !newPassword}
                sx={{ mt: 3, mb: 2, py: 1.2, fontWeight: 600 }}
              >
                {loading ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
              </Button>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => setStep('forgot')}
                sx={{ py: 1.2, fontWeight: 600 }}
              >
                Quay lại bước 1
              </Button>
            </Box>
          )}

          <Box textAlign="center" sx={{ mt: 3 }}>
            <Link href="/auth/login" style={{ textDecoration: 'none' }}>
              <Typography variant="body2" color="primary">
                Quay lại đăng nhập
              </Typography>
            </Link>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default TestForgotPasswordPage;
