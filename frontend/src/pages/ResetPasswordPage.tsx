import React, { useEffect, useState } from 'react';
import { Container, Paper, TextField, Button, Typography, Box, Alert, InputAdornment, IconButton } from '@mui/material';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useLocation, useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';

const ResetPasswordPage: React.FC = () => {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const t = params.get('token');
    if (t) setToken(t);
  }, [location.search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newPassword) return;
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
      setTimeout(() => navigate('/auth/login'), 1000);
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
          <Typography variant="h5" sx={{ mb: 1, fontWeight: 'bold' }}>Đặt lại mật khẩu</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Dán token nhận qua email (dev: có thể tự động điền từ URL).
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <VpnKeyIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              type={showPassword ? 'text' : 'password'}
              label="Mật khẩu mới"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
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
            <Box mt={2} display="flex" justifyContent="flex-end">
              <Button type="submit" variant="contained" disabled={loading || !token || !newPassword} sx={{ py: 1.2, fontWeight: 600 }}>
                {loading ? 'Đang lưu...' : 'Đặt lại'}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default ResetPasswordPage;


