import React, { useState } from 'react';
import { Container, Paper, TextField, Button, Typography, Box, Alert } from '@mui/material';
import { authApi } from '../api/auth';

const ChangePasswordPage: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await authApi.changePassword({ currentPassword, newPassword });
      setSuccess(res.message || 'Đổi mật khẩu thành công');
      setCurrentPassword('');
      setNewPassword('');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Không thể đổi mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 6 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>Đổi mật khẩu</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        <Box component="form" onSubmit={handleSubmit}>
          <TextField fullWidth type="password" label="Mật khẩu hiện tại" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} sx={{ mb: 2 }} />
          <TextField fullWidth type="password" label="Mật khẩu mới" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <Box mt={2} display="flex" justifyContent="flex-end">
            <Button type="submit" variant="contained" disabled={loading || !currentPassword || !newPassword}>
              {loading ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default ChangePasswordPage;


