import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Chip,
  Button,
  Alert,
  Tooltip,
  IconButton,
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import LockIcon from '@mui/icons-material/Lock';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import ShieldIcon from '@mui/icons-material/Shield';
import HistoryIcon from '@mui/icons-material/History';
import RefreshIcon from '@mui/icons-material/Refresh';
import WarningIcon from '@mui/icons-material/Warning';
import AdminLayout from '../components/AdminLayout';
import { useTheme } from '../contexts/ThemeContext';
import { DarkShimmerBox, ShimmerBox } from '../components/LoadingSkeleton';

interface SecuritySetting {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  icon: React.ReactNode;
}

interface SecurityLog {
  id: string;
  action: string;
  user: string;
  time: string;
  status: 'success' | 'warning' | 'danger';
}

const AdminSecurityPage: React.FC = () => {
  const { darkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<SecuritySetting[]>([]);
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [lastAudit, setLastAudit] = useState<string>('08/11/2025 14:35');

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSettings([
        {
          id: 'twoFactor',
          title: 'Xác thực hai lớp (2FA)',
          description: 'Yêu cầu mã xác thực khi đăng nhập vào tài khoản quản trị.',
          enabled: true,
          icon: <FingerprintIcon />,
        },
        {
          id: 'loginAlerts',
          title: 'Cảnh báo đăng nhập bất thường',
          description: 'Gửi email khi phát hiện đăng nhập từ thiết bị hoặc vị trí lạ.',
          enabled: true,
          icon: <NotificationsActiveIcon />,
        },
        {
          id: 'apiAccess',
          title: 'Giới hạn truy cập API',
          description: 'Vô hiệu hóa yêu cầu API không hợp lệ sau 5 lần thử.',
          enabled: true,
          icon: <ShieldIcon />,
        },
        {
          id: 'passwordPolicy',
          title: 'Chính sách mật khẩu mạnh',
          description: 'Yêu cầu mật khẩu tối thiểu 10 ký tự, bao gồm số và ký tự đặc biệt.',
          enabled: true,
          icon: <LockIcon />,
        },
      ]);

      setLogs([
        {
          id: '1',
          action: 'Thiết lập lại mật khẩu quản trị',
          user: 'admin@example.com',
          time: '12/11/2025 09:40',
          status: 'success',
        },
        {
          id: '2',
          action: 'Cảnh báo đăng nhập thất bại 5 lần',
          user: 'teacher1@example.com',
          time: '11/11/2025 21:14',
          status: 'warning',
        },
        {
          id: '3',
          action: 'Chặn truy cập API không hợp lệ',
          user: 'N/A',
          time: '11/11/2025 18:02',
          status: 'success',
        },
        {
          id: '4',
          action: 'Cảnh báo: đăng nhập từ IP lạ',
          user: 'admin@example.com',
          time: '10/11/2025 06:21',
          status: 'warning',
        },
      ]);

      setLoading(false);
    }, 700);

    return () => clearTimeout(timeout);
  }, []);

  const primaryTextColor = darkMode ? '#f8fafc' : '#102a43';
  const secondaryTextColor = darkMode ? 'rgba(248, 250, 252, 0.7)' : 'rgba(16, 42, 67, 0.64)';
  const cardBackground = darkMode
    ? 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)'
    : 'linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%)';
  const surfaceBorder = darkMode ? 'rgba(148, 163, 184, 0.24)' : 'rgba(239, 91, 91, 0.12)';

  const handleToggle = (id: string) => {
    setSettings((prev) =>
      prev.map((setting) => (setting.id === id ? { ...setting, enabled: !setting.enabled } : setting)),
    );
  };

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
              Bảo mật hệ thống
            </Typography>
            <Typography variant="body1" sx={{ color: secondaryTextColor }}>
              Tăng cường bảo vệ dữ liệu và kiểm soát truy cập cho hệ thống quản trị
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              borderColor: surfaceBorder,
              color: primaryTextColor,
              '&:hover': {
                borderColor: '#EF5B5B',
                backgroundColor: darkMode ? 'rgba(239, 91, 91, 0.1)' : 'rgba(239, 91, 91, 0.08)',
              },
            }}
          >
            Kiểm tra bảo mật lại
          </Button>
        </Box>

        {loading ? (
          <Box>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {[...Array(3)].map((_, index) => (
                <Grid item xs={12} md={4} key={index}>
                  {darkMode ? (
                    <DarkShimmerBox height="200px" width="100%" borderRadius="16px" />
                  ) : (
                    <ShimmerBox height="200px" width="100%" borderRadius="16px" />
                  )}
                </Grid>
              ))}
            </Grid>
            {darkMode ? (
              <DarkShimmerBox height="380px" width="100%" borderRadius="24px" />
            ) : (
              <ShimmerBox height="380px" width="100%" borderRadius="24px" />
            )}
          </Box>
        ) : (
          <>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={4}>
                <Card
                  sx={{
                    height: '100%',
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #2196F3 0%, #21CBF3 100%)',
                    color: 'white',
                    boxShadow: '0 8px 24px rgba(33, 150, 243, 0.3)',
                    border: 'none',
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Avatar
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.2)',
                        width: 56,
                        height: 56,
                        mb: 2,
                      }}
                    >
                      <SecurityIcon sx={{ color: 'white' }} />
                    </Avatar>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      Mức độ bảo vệ hiện tại
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      Cao
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                      4/5 biện pháp đang được kích hoạt
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card
                  sx={{
                    height: '100%',
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #4CAF50 0%, #81C784 100%)',
                    color: 'white',
                    boxShadow: '0 8px 24px rgba(76, 175, 80, 0.3)',
                    border: 'none',
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Avatar
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.2)',
                        width: 56,
                        height: 56,
                        mb: 2,
                      }}
                    >
                      <HistoryIcon sx={{ color: 'white' }} />
                    </Avatar>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      Lần kiểm tra gần nhất
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {lastAudit}
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                      Đã ghi lại 12 sự kiện bảo mật trong 7 ngày qua
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card
                  sx={{
                    height: '100%',
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #FF9800 0%, #FFB74D 100%)',
                    color: 'white',
                    boxShadow: '0 8px 24px rgba(255, 152, 0, 0.3)',
                    border: 'none',
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Avatar
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.2)',
                        width: 56,
                        height: 56,
                        mb: 2,
                      }}
                    >
                      <WarningIcon sx={{ color: 'white' }} />
                    </Avatar>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      Cảnh báo cần chú ý
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      2 cảnh báo
                    </Typography>
                    <Chip
                      label="Ưu tiên xử lý"
                      size="small"
                      sx={{
                        mt: 2,
                        color: 'white',
                        backgroundColor: 'rgba(255,255,255,0.2)',
                      }}
                    />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    background: cardBackground,
                    border: `1px solid ${surfaceBorder}`,
                    overflow: 'hidden',
                  }}
                >
                  <Box sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: primaryTextColor, mb: 1 }}>
                      Biện pháp bảo mật
                    </Typography>
                    <Typography variant="body2" sx={{ color: secondaryTextColor }}>
                      Bật/tắt các chính sách bảo mật quan trọng cho hệ thống
                    </Typography>
                  </Box>
                  <Divider sx={{ borderColor: surfaceBorder }} />
                  <List disablePadding>
                    {settings.map((setting, index) => (
                      <React.Fragment key={setting.id}>
                        <ListItem
                          sx={{
                            px: 3,
                            py: 2,
                            alignItems: 'flex-start',
                            '&:hover': {
                              backgroundColor: darkMode
                                ? 'rgba(239, 91, 91, 0.08)'
                                : 'rgba(239, 91, 91, 0.06)',
                            },
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar
                              sx={{
                                bgcolor: darkMode ? 'rgba(239, 91, 91, 0.22)' : 'rgba(239, 91, 91, 0.12)',
                                color: '#EF5B5B',
                              }}
                            >
                              {setting.icon}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography
                                variant="subtitle1"
                                sx={{ fontWeight: 600, color: primaryTextColor }}
                              >
                                {setting.title}
                              </Typography>
                            }
                            secondary={
                              <Typography variant="body2" sx={{ color: secondaryTextColor }}>
                                {setting.description}
                              </Typography>
                            }
                          />
                          <FormControlLabel
                            control={
                              <Switch
                                checked={setting.enabled}
                                onChange={() => handleToggle(setting.id)}
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
                            label=""
                          />
                        </ListItem>
                        {index < settings.length - 1 && <Divider component="li" sx={{ borderColor: surfaceBorder }} />}
                      </React.Fragment>
                    ))}
                  </List>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    background: cardBackground,
                    border: `1px solid ${surfaceBorder}`,
                    overflow: 'hidden',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: primaryTextColor, mb: 1 }}>
                        Nhật ký sự kiện
                      </Typography>
                      <Typography variant="body2" sx={{ color: secondaryTextColor }}>
                        Theo dõi các sự kiện bảo mật gần đây
                      </Typography>
                    </Box>
                    <Tooltip title="Làm mới">
                      <IconButton
                        size="small"
                        sx={{
                          color: secondaryTextColor,
                          '&:hover': {
                            color: '#EF5B5B',
                          },
                        }}
                      >
                        <RefreshIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Divider sx={{ borderColor: surfaceBorder }} />
                  <List sx={{ flex: 1, overflow: 'auto' }}>
                    {logs.map((log, index) => (
                      <React.Fragment key={log.id}>
                        <ListItem
                          sx={{
                            px: 3,
                            py: 2,
                            alignItems: 'flex-start',
                            '&:hover': {
                              backgroundColor: darkMode
                                ? 'rgba(239, 91, 91, 0.08)'
                                : 'rgba(239, 91, 91, 0.06)',
                            },
                          }}
                        >
                          <Avatar
                            sx={{
                              bgcolor:
                                log.status === 'success'
                                  ? 'rgba(76, 175, 80, 0.18)'
                                  : log.status === 'warning'
                                  ? 'rgba(255, 152, 0, 0.18)'
                                  : 'rgba(239, 91, 91, 0.18)',
                              color:
                                log.status === 'success'
                                  ? '#4CAF50'
                                  : log.status === 'warning'
                                  ? '#FF9800'
                                  : '#EF5B5B',
                              mr: 2,
                            }}
                          >
                            <SecurityIcon />
                          </Avatar>
                          <ListItemText
                            primary={
                              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: primaryTextColor }}>
                                {log.action}
                              </Typography>
                            }
                            secondary={
                              <>
                                <Typography variant="body2" sx={{ color: secondaryTextColor }}>
                                  Người thực hiện: {log.user}
                                </Typography>
                                <Typography variant="caption" sx={{ color: secondaryTextColor }}>
                                  Thời gian: {log.time}
                                </Typography>
                              </>
                            }
                          />
                          <Chip
                            label={
                              log.status === 'success'
                                ? 'Thành công'
                                : log.status === 'warning'
                                ? 'Cảnh báo'
                                : 'Nguy hiểm'
                            }
                            size="small"
                            sx={{
                              color:
                                log.status === 'success'
                                  ? '#2e7d32'
                                  : log.status === 'warning'
                                  ? '#ed6c02'
                                  : '#b71c1c',
                              backgroundColor:
                                log.status === 'success'
                                  ? 'rgba(76, 175, 80, 0.15)'
                                  : log.status === 'warning'
                                  ? 'rgba(255, 152, 0, 0.15)'
                                  : 'rgba(239, 91, 91, 0.15)',
                            }}
                          />
                        </ListItem>
                        {index < logs.length - 1 && <Divider component="li" sx={{ borderColor: surfaceBorder }} />}
                      </React.Fragment>
                    ))}
                  </List>
                </Paper>
              </Grid>
            </Grid>

            <Alert
              severity="info"
              sx={{
                mt: 4,
                borderRadius: 3,
                backgroundColor: darkMode ? 'rgba(33, 150, 243, 0.12)' : 'rgba(33, 150, 243, 0.08)',
                color: primaryTextColor,
                border: `1px solid ${darkMode ? 'rgba(33, 150, 243, 0.3)' : 'rgba(33, 150, 243, 0.2)'}`,
              }}
              icon={<ShieldIcon />}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Gợi ý bảo mật
              </Typography>
              <Typography variant="body2">
                Hãy thường xuyên sao lưu dữ liệu, rà soát quyền truy cập và kiểm tra nhật ký để đảm bảo an
                toàn tuyệt đối cho hệ thống.
              </Typography>
            </Alert>
          </>
        )}
      </Box>
    </AdminLayout>
  );
};

export default AdminSecurityPage;


