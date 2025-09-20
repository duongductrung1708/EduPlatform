import React, { useState } from 'react';
import { Container, Paper, TextField, Button, Typography, Box, Alert, InputAdornment } from '@mui/material';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import { authApi } from '../api/auth';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await authApi.forgotPassword(email);
      setSuccess(res.message || 'Nếu email tồn tại, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.');
      if (res.token) setToken(res.token);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Không thể gửi yêu cầu');
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
          <Typography variant="h5" sx={{ mb: 1, fontWeight: 'bold' }}>Quên mật khẩu</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Nhập email để nhận liên kết đặt lại mật khẩu.
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          {token && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Token test (dev): {token}
            </Alert>
          )}
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              type="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <MailOutlineIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            <Box mt={2} display="flex" justifyContent="flex-end">
              <Button type="submit" variant="contained" disabled={loading || !email} sx={{ py: 1.2, fontWeight: 600 }}>
                {loading ? 'Đang gửi...' : 'Gửi liên kết' }
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default ForgotPasswordPage;


