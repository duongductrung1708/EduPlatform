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
import { adminApi } from '../api/admin';
import { Snackbar } from '@mui/material';

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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [settings, setSettings] = useState<SecuritySetting[]>([]);
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [lastAudit, setLastAudit] = useState<string>('');
  const [securityLevel, setSecurityLevel] = useState<string>('Cao');
  const [warningCount, setWarningCount] = useState<number>(0);

  const fetchSecurityData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [settingsData, logsData] = await Promise.all([
        adminApi.getSecuritySettings(),
        adminApi.getSecurityLogs(1, 10),
      ]);
      const settingsList = settingsData.settings || settingsData || [];
      // Map settings to include icons
      interface SecuritySetting {
        id: string;
        title: string;
        enabled: boolean;
        description?: string;
        [key: string]: unknown;
      }
      const settingsWithIcons = settingsList.map((setting: SecuritySetting) => {
        let icon = <SecurityIcon />;
        if (setting.id === 'twoFactor') icon = <FingerprintIcon />;
        else if (setting.id === 'loginAlerts') icon = <NotificationsActiveIcon />;
        else if (setting.id === 'apiAccess') icon = <ShieldIcon />;
        else if (setting.id === 'passwordPolicy') icon = <LockIcon />;
        return { ...setting, icon };
      });
      setSettings(settingsWithIcons);
      setLogs(logsData.logs || logsData.items || []);
      if (settingsData.lastAudit) setLastAudit(settingsData.lastAudit);

      // Calculate warning count from logs
      const warnings = (logsData.logs || logsData.items || []).filter(
        (log: SecurityLog) => log.status === 'warning' || log.status === 'danger',
      ).length;
      setWarningCount(warnings);

      // Calculate security level based on enabled settings
      const enabledCount = settingsWithIcons.filter((s: SecuritySetting) => s.enabled).length;
      const totalCount = settingsWithIcons.length;
      if (totalCount > 0) {
        const enabledRatio = enabledCount / totalCount;
        if (enabledRatio >= 0.8) setSecurityLevel('Cao');
        else if (enabledRatio >= 0.5) setSecurityLevel('Trung bình');
        else setSecurityLevel('Thấp');
      }
    } catch (err: unknown) {
      console.error('Error fetching security data:', err);
      setError('Không thể tải dữ liệu bảo mật. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const primaryTextColor = darkMode ? '#f8fafc' : '#102a43';
  const secondaryTextColor = darkMode ? 'rgba(248, 250, 252, 0.7)' : 'rgba(16, 42, 67, 0.64)';
  const cardBackground = darkMode
    ? 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)'
    : 'linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%)';
  const surfaceBorder = darkMode ? 'rgba(148, 163, 184, 0.24)' : 'rgba(239, 91, 91, 0.12)';

  const handleToggle = async (id: string) => {
    const setting = settings.find((s) => s.id === id);
    if (!setting) return;
    const newEnabled = !setting.enabled;

    // Optimistic update
    setSettings((prev) => prev.map((s) => (s.id === id ? { ...s, enabled: newEnabled } : s)));

    try {
      await adminApi.updateSecuritySetting(id, newEnabled);
      setSuccess(`Đã ${newEnabled ? 'bật' : 'tắt'} ${setting.title} thành công!`);
    } catch (err: unknown) {
      // Revert on error
      setSettings((prev) => prev.map((s) => (s.id === id ? { ...s, enabled: !newEnabled } : s)));
      setError(`Không thể ${newEnabled ? 'bật' : 'tắt'} ${setting.title}`);
    }
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
            onClick={async () => {
              try {
                const result = await adminApi.runSecurityAudit();
                if (result.securityLevel) setSecurityLevel(result.securityLevel);
                setSuccess('Đã chạy kiểm tra bảo mật thành công!');
                fetchSecurityData();
              } catch (err) {
                setError('Không thể chạy kiểm tra bảo mật');
              }
            }}
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
                  <Card
                    sx={{
                      height: '100%',
                      borderRadius: 3,
                      background: cardBackground,
                      border: `1px solid ${surfaceBorder}`,
                      p: 3,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      {darkMode ? (
                        <DarkShimmerBox height="56px" width="56px" borderRadius="50%" />
                      ) : (
                        <ShimmerBox height="56px" width="56px" borderRadius="50%" />
                      )}
                      <Box sx={{ flex: 1, ml: 2 }}>
                        {darkMode ? (
                          <>
                            <Box sx={{ mb: 1 }}>
                              <DarkShimmerBox height="16px" width="80%" borderRadius="4px" />
                            </Box>
                            <DarkShimmerBox height="32px" width="60%" borderRadius="4px" />
                            <Box sx={{ mt: 1 }}>
                              <DarkShimmerBox height="14px" width="90%" borderRadius="4px" />
                            </Box>
                          </>
                        ) : (
                          <>
                            <Box sx={{ mb: 1 }}>
                              <ShimmerBox height="16px" width="80%" borderRadius="4px" />
                            </Box>
                            <ShimmerBox height="32px" width="60%" borderRadius="4px" />
                            <Box sx={{ mt: 1 }}>
                              <ShimmerBox height="14px" width="90%" borderRadius="4px" />
                            </Box>
                          </>
                        )}
                      </Box>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    background: cardBackground,
                    border: `1px solid ${surfaceBorder}`,
                    p: 3,
                  }}
                >
                  <Box sx={{ mb: 2 }}>
                    {darkMode ? (
                      <DarkShimmerBox height="24px" width="200px" borderRadius="4px" />
                    ) : (
                      <ShimmerBox height="24px" width="200px" borderRadius="4px" />
                    )}
                  </Box>
                  {[...Array(4)].map((_, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        py: 2,
                        borderBottom: index < 3 ? `1px solid ${surfaceBorder}` : 'none',
                      }}
                    >
                      {darkMode ? (
                        <>
                          <Box sx={{ mr: 2 }}>
                            <DarkShimmerBox height="40px" width="40px" borderRadius="4px" />
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ mb: 0.5 }}>
                              <DarkShimmerBox height="16px" width="70%" borderRadius="4px" />
                            </Box>
                            <DarkShimmerBox height="14px" width="90%" borderRadius="4px" />
                          </Box>
                          <DarkShimmerBox height="36px" width="50px" borderRadius="4px" />
                        </>
                      ) : (
                        <>
                          <Box sx={{ mr: 2 }}>
                            <ShimmerBox height="40px" width="40px" borderRadius="4px" />
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ mb: 0.5 }}>
                              <ShimmerBox height="16px" width="70%" borderRadius="4px" />
                            </Box>
                            <ShimmerBox height="14px" width="90%" borderRadius="4px" />
                          </Box>
                          <ShimmerBox height="36px" width="50px" borderRadius="4px" />
                        </>
                      )}
                    </Box>
                  ))}
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    background: cardBackground,
                    border: `1px solid ${surfaceBorder}`,
                    p: 3,
                  }}
                >
                  <Box sx={{ mb: 2 }}>
                    {darkMode ? (
                      <DarkShimmerBox height="24px" width="200px" borderRadius="4px" />
                    ) : (
                      <ShimmerBox height="24px" width="200px" borderRadius="4px" />
                    )}
                  </Box>
                  {[...Array(5)].map((_, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        py: 2,
                        borderBottom: index < 4 ? `1px solid ${surfaceBorder}` : 'none',
                      }}
                    >
                      {darkMode ? (
                        <>
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ mb: 0.5 }}>
                              <DarkShimmerBox height="16px" width="80%" borderRadius="4px" />
                            </Box>
                            <DarkShimmerBox height="14px" width="50%" borderRadius="4px" />
                          </Box>
                          <DarkShimmerBox height="24px" width="60px" borderRadius="4px" />
                        </>
                      ) : (
                        <>
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ mb: 0.5 }}>
                              <ShimmerBox height="16px" width="80%" borderRadius="4px" />
                            </Box>
                            <ShimmerBox height="14px" width="50%" borderRadius="4px" />
                          </Box>
                          <ShimmerBox height="24px" width="60px" borderRadius="4px" />
                        </>
                      )}
                    </Box>
                  ))}
                </Paper>
              </Grid>
            </Grid>
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
                    <Typography variant="body2" sx={{ mb: 0.5, color: 'white' }}>
                      Mức độ bảo vệ hiện tại
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'white' }}>
                      {securityLevel}
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'white' }}>
                      {settings.filter((s) => s.enabled).length}/{settings.length} biện pháp đang
                      được kích hoạt
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
                    <Typography variant="body2" sx={{ mb: 0.5, color: 'white' }}>
                      Lần kiểm tra gần nhất
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'white' }}>
                      {lastAudit}
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'white' }}>
                      Đã ghi lại {logs.length} sự kiện bảo mật
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
                    <Typography variant="body2" sx={{ mb: 0.5, color: 'white' }}>
                      Cảnh báo cần chú ý
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'white' }}>
                      {warningCount} cảnh báo
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
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 700, color: primaryTextColor, mb: 1 }}
                    >
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
                                bgcolor: darkMode
                                  ? 'rgba(239, 91, 91, 0.22)'
                                  : 'rgba(239, 91, 91, 0.12)',
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
                        {index < settings.length - 1 && (
                          <Divider component="li" sx={{ borderColor: surfaceBorder }} />
                        )}
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
                  <Box
                    sx={{
                      p: 3,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Box>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 700, color: primaryTextColor, mb: 1 }}
                      >
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
                              <Typography
                                variant="subtitle1"
                                sx={{ fontWeight: 600, color: primaryTextColor }}
                              >
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
                        {index < logs.length - 1 && (
                          <Divider component="li" sx={{ borderColor: surfaceBorder }} />
                        )}
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
                Hãy thường xuyên sao lưu dữ liệu, rà soát quyền truy cập và kiểm tra nhật ký để đảm
                bảo an toàn tuyệt đối cho hệ thống.
              </Typography>
            </Alert>
          </>
        )}

        <Snackbar
          open={!!error}
          autoHideDuration={5000}
          onClose={() => setError(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setError(null)}
            severity="error"
            sx={{ width: '100%', borderRadius: 2 }}
          >
            {error}
          </Alert>
        </Snackbar>

        <Snackbar
          open={!!success}
          autoHideDuration={3000}
          onClose={() => setSuccess(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setSuccess(null)}
            severity="success"
            sx={{ width: '100%', borderRadius: 2 }}
          >
            {success}
          </Alert>
        </Snackbar>
      </Box>
    </AdminLayout>
  );
};

export default AdminSecurityPage;
