import React, { useState } from 'react';
import { Container, Paper, TextField, Button, Typography, Box, Alert, InputAdornment, Link } from '@mui/material';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';
import Logo from '../components/Logo';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await authApi.forgotPassword(email);
      setSuccess(res.message || 'Nếu email tồn tại, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.');
      if (res.token) setToken(res.token);
      
      // Navigate to success page after successful request
      setTimeout(() => {
        navigate('/auth/forgot-password/success', { 
          state: { email },
          replace: true 
        });
      }, 1500);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err?.response?.data?.message || 'Không thể gửi yêu cầu');
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
      position: 'relative',
    }}>
      <Box sx={{ position: 'absolute', top: 16, left: 16 }}>
        <Logo height={48} />
      </Box>
      <Container maxWidth="sm">
        <Paper sx={{ p: 4, borderRadius: 3 }} elevation={8}>
          <Box textAlign="center" sx={{ mb: 3 }}>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Quên mật khẩu
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Nhập email để nhận liên kết đặt lại mật khẩu
            </Typography>
          </Box>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          {token && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Token test (dev): {token}
            </Alert>
          )}
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
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
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.2, fontWeight: 600 }}
              disabled={loading || !email}
            >
              {loading ? 'Đang gửi...' : 'Gửi liên kết đặt lại mật khẩu'}
            </Button>
            <Box textAlign="center">
              <Link href="/auth/login" style={{ textDecoration: 'none' }}>
                <Typography variant="body2" color="primary">
                  Quay lại đăng nhập
                </Typography>
              </Link>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default ForgotPasswordPage;


