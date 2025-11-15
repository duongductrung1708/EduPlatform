import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  Container,
  TextField,
  Typography,
  Button,
  Paper,
  Avatar,
  Grid,
  Alert,
  CircularProgress,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { usersApi, CurrentUserResponse, UpdateMePayload } from '../api/users';
import { useAuth } from '../contexts/AuthContext';
import { uploadsApi } from '../api/uploads';

const ProfilePage: React.FC = () => {
  const { user, setUserProfile } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<CurrentUserResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState<boolean>(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const me = await usersApi.getMe();
        if (mounted) setProfile(me);
      } catch (e: unknown) {
        const err = e as { response?: { data?: { message?: string } } };
        if (mounted) setError(err.response?.data?.message || 'Không tải được hồ sơ');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => (prev ? ({ ...prev, [name]: value } as CurrentUserResponse) : prev));
  };

  const handleGenderChange = (e: { target: { value: string } }) => {
    const value = e.target.value;
    setProfile((prev) => (prev ? ({ ...prev, gender: value } as CurrentUserResponse) : prev));
  };

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn file ảnh');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Kích thước ảnh tối đa là 5MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    setUploadingAvatar(true);
    setError(null);
    try {
      const result = await uploadsApi.uploadFile(file, 'avatars');
      setProfile((prev) =>
        prev ? ({ ...prev, avatar: result.url } as CurrentUserResponse) : prev,
      );
      setSuccess('Đã upload ảnh đại diện thành công');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Lỗi khi upload ảnh');
      setAvatarPreview(null);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    const payload: UpdateMePayload = {
      name: profile.name,
      avatarUrl: profile.avatar,
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
        phone: updated.phone,
        // email and role typically unchanged; keep existing
      });
      setSuccess('Đã lưu hồ sơ thành công');
      // Auto hide success message after 5 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 5000);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || 'Không thể lưu thay đổi');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseSuccess = () => {
    setSuccess(null);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error && !profile) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Box display="flex" alignItems="center" mb={3}>
            <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h5">Hồ sơ của tôi</Typography>
          </Box>
          <Alert severity="error">{error}</Alert>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5">Hồ sơ của tôi</Typography>
        </Box>

        <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
          <Box sx={{ position: 'relative', mb: 2 }}>
            <Avatar
              src={avatarPreview || profile?.avatar || ''}
              sx={{
                width: 120,
                height: 120,
                cursor: 'pointer',
                border: '3px solid',
                borderColor: 'primary.main',
                '&:hover': {
                  opacity: 0.8,
                },
              }}
              onClick={handleAvatarClick}
            />
            {uploadingAvatar && (
              <CircularProgress
                size={24}
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              />
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarSelect}
              style={{ display: 'none' }}
              disabled={uploadingAvatar}
            />
          </Box>
          <Button
            variant="outlined"
            startIcon={<CloudUploadIcon />}
            onClick={handleAvatarClick}
            disabled={uploadingAvatar}
            sx={{ mb: 1 }}
          >
            {uploadingAvatar ? 'Đang upload...' : 'Chọn ảnh đại diện'}
          </Button>
          <Typography variant="body2" color="text.secondary">
            {user?.email}
          </Typography>
        </Box>

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={handleCloseSuccess}>
            {success}
          </Alert>
        )}
        {error && profile && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSave}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                name="name"
                label="Họ và tên"
                fullWidth
                value={profile?.name || ''}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="phone"
                label="Số điện thoại"
                fullWidth
                value={profile?.phone || ''}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="address"
                label="Địa chỉ"
                fullWidth
                value={profile?.address || ''}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Giới tính</InputLabel>
                <Select
                  value={profile?.gender || ''}
                  label="Giới tính"
                  onChange={handleGenderChange}
                >
                  <MenuItem value="Nam">Nam</MenuItem>
                  <MenuItem value="Nữ">Nữ</MenuItem>
                  <MenuItem value="Khác">Khác</MenuItem>
                </Select>
              </FormControl>
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
