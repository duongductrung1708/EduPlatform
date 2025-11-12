import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  Chip,
  Card,
  CardContent,
  Snackbar,
  Alert,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PaletteIcon from '@mui/icons-material/Palette';
import LanguageIcon from '@mui/icons-material/Language';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AdminLayout from '../components/AdminLayout';
import { useTheme } from '../contexts/ThemeContext';
import { DarkShimmerBox, ShimmerBox } from '../components/LoadingSkeleton';

interface SettingsForm {
  organizationName: string;
  contactEmail: string;
  language: string;
  timezone: string;
  weeklyReport: boolean;
  notifyTeacher: boolean;
  notifyStudent: boolean;
  themeColor: string;
}

const AdminSettingsPage: React.FC = () => {
  const { darkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [form, setForm] = useState<SettingsForm>({
    organizationName: '',
    contactEmail: '',
    language: 'vi',
    timezone: 'Asia/Ho_Chi_Minh',
    weeklyReport: true,
    notifyTeacher: true,
    notifyStudent: false,
    themeColor: 'default',
  });

  useEffect(() => {
    const timeout = setTimeout(() => {
      setForm({
        organizationName: 'EduLearn Việt Nam',
        contactEmail: 'support@edulearn.vn',
        language: 'vi',
        timezone: 'Asia/Ho_Chi_Minh',
        weeklyReport: true,
        notifyTeacher: true,
        notifyStudent: false,
        themeColor: 'default',
      });
      setLoading(false);
    }, 600);

    return () => clearTimeout(timeout);
  }, []);

  const handleChange = (field: keyof SettingsForm) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked, type } = event.target;
    setForm((prev) => ({
      ...prev,
      [field]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSelectChange = (field: keyof SettingsForm) => (event: any) => {
    const { value } = event.target;
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setSaving(false);
    setOpenSnackbar(true);
  };

  const primaryTextColor = darkMode ? '#f8fafc' : '#102a43';
  const secondaryTextColor = darkMode ? 'rgba(248, 250, 252, 0.7)' : 'rgba(16, 42, 67, 0.64)';
  const cardBackground = darkMode
    ? 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)'
    : 'linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%)';
  const surfaceBorder = darkMode ? 'rgba(148, 163, 184, 0.24)' : 'rgba(239, 91, 91, 0.12)';

  return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
            mb: 4,
          }}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                mb: 1,
                background: darkMode
                  ? 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)'
                  : 'linear-gradient(135deg, #EF5B5B 0%, #D94A4A 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Cài đặt hệ thống
            </Typography>
            <Typography variant="body1" sx={{ color: secondaryTextColor }}>
              Tùy chỉnh thông tin tổ chức, thông báo và giao diện hệ thống
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving || loading}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              py: 1.5,
              background: 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #D94A4A 0%, #EF5B5B 100%)',
              },
              '&:disabled': {
                background: darkMode ? 'rgba(148, 163, 184, 0.2)' : 'rgba(239, 91, 91, 0.3)',
              },
            }}
          >
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </Box>

        {loading ? (
          <Box>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                {darkMode ? (
                  <DarkShimmerBox height="520px" width="100%" borderRadius="24px" />
                ) : (
                  <ShimmerBox height="520px" width="100%" borderRadius="24px" />
                )}
              </Grid>
              <Grid item xs={12} md={4}>
                {darkMode ? (
                  <DarkShimmerBox height="520px" width="100%" borderRadius="24px" />
                ) : (
                  <ShimmerBox height="520px" width="100%" borderRadius="24px" />
                )}
              </Grid>
            </Grid>
          </Box>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 3,
                  background: cardBackground,
                  border: `1px solid ${surfaceBorder}`,
                  p: 3,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 700, color: primaryTextColor, mb: 3 }}>
                  Thông tin tổ chức
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      label="Tên tổ chức"
                      fullWidth
                      value={form.organizationName}
                      onChange={handleChange('organizationName')}
                      InputLabelProps={{ sx: { color: secondaryTextColor } }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Email liên hệ"
                      type="email"
                      fullWidth
                      value={form.contactEmail}
                      onChange={handleChange('contactEmail')}
                      InputLabelProps={{ sx: { color: secondaryTextColor } }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel sx={{ color: secondaryTextColor }}>Ngôn ngữ</InputLabel>
                      <Select value={form.language} label="Ngôn ngữ" onChange={handleSelectChange('language')}>
                        <MenuItem value="vi">Tiếng Việt</MenuItem>
                        <MenuItem value="en">Tiếng Anh</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel sx={{ color: secondaryTextColor }}>Múi giờ</InputLabel>
                      <Select value={form.timezone} label="Múi giờ" onChange={handleSelectChange('timezone')}>
                        <MenuItem value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh (GMT+7)</MenuItem>
                        <MenuItem value="Asia/Bangkok">Asia/Bangkok (GMT+7)</MenuItem>
                        <MenuItem value="Asia/Singapore">Asia/Singapore (GMT+8)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 4, borderColor: surfaceBorder }} />

                <Typography variant="h6" sx={{ fontWeight: 700, color: primaryTextColor, mb: 2 }}>
                  Thông báo hệ thống
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={form.weeklyReport}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, weeklyReport: event.target.checked }))
                        }
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: '#EF5B5B',
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: '#EF5B5B',
                          },
                        }}
                      />
                    }
                    label="Gửi báo cáo tổng kết hàng tuần"
                    sx={{ color: primaryTextColor }}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={form.notifyTeacher}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, notifyTeacher: event.target.checked }))
                        }
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: '#EF5B5B',
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: '#EF5B5B',
                          },
                        }}
                      />
                    }
                    label="Thông báo qua email cho giáo viên"
                    sx={{ color: primaryTextColor }}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={form.notifyStudent}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, notifyStudent: event.target.checked }))
                        }
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: '#EF5B5B',
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: '#EF5B5B',
                          },
                        }}
                      />
                    }
                    label="Thông báo qua email cho học sinh"
                    sx={{ color: primaryTextColor }}
                  />
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card
                sx={{
                  borderRadius: 3,
                  background: cardBackground,
                  border: `1px solid ${surfaceBorder}`,
                  mb: 3,
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1.5 }}>
                    <PaletteIcon sx={{ color: '#EF5B5B' }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, color: primaryTextColor }}>
                      Màu sắc giao diện
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: secondaryTextColor, mb: 2 }}>
                    Lựa chọn tông màu chủ đạo cho giao diện quản trị.
                  </Typography>
                  <Grid container spacing={1.5}>
                    {[
                      { key: 'default', label: 'Mặc định', color: 'linear-gradient(135deg, #EF5B5B, #FF7B7B)' },
                      { key: 'blue', label: 'Xanh dương', color: 'linear-gradient(135deg, #2196F3, #21CBF3)' },
                      { key: 'green', label: 'Xanh lá', color: 'linear-gradient(135deg, #4CAF50, #81C784)' },
                      { key: 'purple', label: 'Tím', color: 'linear-gradient(135deg, #9C27B0, #BA68C8)' },
                    ].map((item) => (
                      <Grid item xs={6} key={item.key}>
                        <Chip
                          label={item.label}
                          onClick={() => setForm((prev) => ({ ...prev, themeColor: item.key }))}
                          variant={form.themeColor === item.key ? 'filled' : 'outlined'}
                          sx={{
                            width: '100%',
                            justifyContent: 'center',
                            color: form.themeColor === item.key ? 'white' : primaryTextColor,
                            background: form.themeColor === item.key ? item.color : 'transparent',
                            borderColor:
                              form.themeColor === item.key
                                ? 'transparent'
                                : darkMode
                                ? 'rgba(148, 163, 184, 0.4)'
                                : 'rgba(239, 91, 91, 0.3)',
                            cursor: 'pointer',
                            fontWeight: 600,
                          }}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>

              <Card
                sx={{
                  borderRadius: 3,
                  background: cardBackground,
                  border: `1px solid ${surfaceBorder}`,
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1.5 }}>
                    <NotificationsIcon sx={{ color: '#EF5B5B' }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, color: primaryTextColor }}>
                      Tóm tắt thông báo
                    </Typography>
                  </Box>
                  <Alert
                    severity="info"
                    sx={{
                      borderRadius: 2,
                      backgroundColor: darkMode ? 'rgba(33, 150, 243, 0.12)' : 'rgba(33, 150, 243, 0.08)',
                      mb: 2,
                    }}
                  >
                    Email báo cáo sẽ được gửi vào mỗi thứ Hai hàng tuần.
                  </Alert>
                  <Alert
                    severity="warning"
                    sx={{
                      borderRadius: 2,
                      backgroundColor: darkMode ? 'rgba(255, 152, 0, 0.12)' : 'rgba(255, 152, 0, 0.08)',
                    }}
                  >
                    Tăng cường tương tác: hãy bật thông báo email cho học sinh để họ không bỏ lỡ thông tin quan trọng.
                  </Alert>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Box>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setOpenSnackbar(false)}
          severity="success"
          sx={{ width: '100%', borderRadius: 2 }}
        >
          Đã lưu cài đặt thành công!
        </Alert>
      </Snackbar>
    </AdminLayout>
  );
};

export default AdminSettingsPage;


