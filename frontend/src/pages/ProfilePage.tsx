import React, { useEffect, useState } from 'react';
import { Box, Container, TextField, Typography, Button, Paper, Avatar, Grid, Alert, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { usersApi, CurrentUserResponse, UpdateMePayload } from '../api/users';
import { useAuth } from '../contexts/AuthContext';

const ProfilePage: React.FC = () => {
  const { user, setUserProfile } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<CurrentUserResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const me = await usersApi.getMe();
        if (mounted) setProfile(me);
      } catch (e: any) {
        if (mounted) setError(e.response?.data?.message || 'Không tải được hồ sơ');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile(prev => prev ? { ...prev, [name]: value } as CurrentUserResponse : prev);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    const payload: UpdateMePayload = {
      name: profile.name,
      avatar: profile.avatar,
      phone: profile.phone,
      address: profile.address,
      gender: profile.gender,
    };
    try {
      const updated = await usersApi.updateMe(payload);
      setProfile(updated);
      setUserProfile({
        name: updated.name,
        avatar: updated.avatar,
        phone: updated.phone as any,
        // email and role typically unchanged; keep existing
      } as any);
      setSuccess('Đã lưu hồ sơ thành công');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Không thể lưu thay đổi');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm">
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
          <Avatar src={profile?.avatar} sx={{ width: 80, height: 80, mb: 1 }} />
          <Typography variant="h5">Hồ sơ của tôi</Typography>
          <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
        </Box>

        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Box component="form" onSubmit={handleSave}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField name="name" label="Họ và tên" fullWidth value={profile?.name || ''} onChange={handleChange} />
            </Grid>
            <Grid item xs={12}>
              <TextField name="avatar" label="Ảnh đại diện (URL)" fullWidth value={profile?.avatar || ''} onChange={handleChange} />
            </Grid>
            <Grid item xs={12}>
              <TextField name="phone" label="Số điện thoại" fullWidth value={profile?.phone || ''} onChange={handleChange} />
            </Grid>
            <Grid item xs={12}>
              <TextField name="address" label="Địa chỉ" fullWidth value={profile?.address || ''} onChange={handleChange} />
            </Grid>
            <Grid item xs={12}>
              <TextField name="gender" label="Giới tính" fullWidth value={profile?.gender || ''} onChange={handleChange} />
            </Grid>
          </Grid>

          <Box mt={3} display="flex" justifyContent="flex-end">
            <Button variant="text" sx={{ mr: 1 }} onClick={() => navigate('/change-password')}>
              Đổi mật khẩu
            </Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default ProfilePage;


