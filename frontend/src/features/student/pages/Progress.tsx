import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Paper,
  Avatar,
  Button,
  Divider,
  Alert,
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StarIcon from '@mui/icons-material/Star';
import { progressApi, ProgressData } from '../../../api/progress';
import { useTheme } from '../../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { ShimmerBox, DarkShimmerBox } from '../../../components/LoadingSkeleton';

export default function StudentProgress() {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const primaryTextColor = darkMode ? '#f8fafc' : '#102a43';
  const secondaryTextColor = darkMode ? 'rgba(248, 250, 252, 0.7)' : 'rgba(16, 42, 67, 0.64)';
  const cardBackground = darkMode
    ? 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)'
    : 'linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%)';
  const surfaceBorder = darkMode ? 'rgba(148, 163, 184, 0.2)' : 'rgba(239, 91, 91, 0.12)';

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      setLoading(true);
      setError(null);
      const progress = await progressApi.getStudentProgress();

      // Normalize data defensively
      const normalized = (Array.isArray(progress) ? progress : [])
        .filter((p): p is ProgressData => {
          const isValid = !!p && !!p.progress && !!p.courseId;
          return isValid;
        })
        .map((p) => {
          const normalizedItem = {
            ...p,
            // Ensure percentage is a number between 0-100
            progress: {
              ...p.progress,
              percentage: Math.max(0, Math.min(100, Number(p.progress.percentage) || 0)),
              totalLessons: Number(p.progress.totalLessons) || 0,
              totalModules: Number(p.progress.totalModules) || 0,
              completedLessons: Array.isArray(p.progress.completedLessons)
                ? p.progress.completedLessons.map(String)
                : [],
              completedModules: Array.isArray(p.progress.completedModules)
                ? p.progress.completedModules.map(String)
                : [],
            },
            enrolledAt: p.enrolledAt ? String(p.enrolledAt) : new Date().toISOString(),
            completedAt: p.completedAt ? String(p.completedAt) : undefined,
          };
          return normalizedItem;
        });

      setProgressData(normalized);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string; error?: string } }; message?: string };
      const apiMsg = error?.response?.data?.message || error?.response?.data?.error || error?.message;
      setError(apiMsg || 'Không thể tải tiến độ học tập');
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return '#4CAF50';
    if (percentage >= 75) return '#8BC34A';
    if (percentage >= 50) return '#FF9800';
    if (percentage >= 25) return '#FF5722';
    return '#F44336';
  };

  const getProgressText = (percentage: number) => {
    if (percentage >= 100) return 'Hoàn thành';
    if (percentage >= 75) return 'Gần hoàn thành';
    if (percentage >= 50) return 'Đang tiến bộ';
    if (percentage >= 25) return 'Bắt đầu';
    return 'Mới bắt đầu';
  };

  const renderLoadingSkeleton = () => {
    const statsSkeleton = Array.from({ length: 3 });
    const cardsSkeleton = Array.from({ length: 2 });

    return (
      <Box
        sx={{
          p: { xs: 2, md: 3 },
          minHeight: '100vh',
          color: primaryTextColor,
        }}
      >
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
            {darkMode ? (
              <DarkShimmerBox height="52px" width="280px" borderRadius="4px" />
            ) : (
              <ShimmerBox height="52px" width="280px" borderRadius="4px" />
            )}
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            {darkMode ? (
              <DarkShimmerBox height="28px" width="360px" borderRadius="4px" />
            ) : (
              <ShimmerBox height="28px" width="360px" borderRadius="4px" />
            )}
          </Box>
        </Box>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          {statsSkeleton.map((_, index) => (
            <Grid item xs={12} sm={4} key={`stats-skeleton-${index}`}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  background: cardBackground,
                  border: `1px solid ${surfaceBorder}`,
                  textAlign: 'center',
                }}
              >
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                  {darkMode ? (
                    <Box sx={{ mx: 'auto' }}>
                      <DarkShimmerBox height="44px" width="60%" borderRadius="4px" />
                    </Box>
                  ) : (
                    <Box sx={{ mx: 'auto' }}>
                      <ShimmerBox height="44px" width="60%" borderRadius="4px" />
                    </Box>
                  )}
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  {darkMode ? (
                    <Box sx={{ mx: 'auto' }}>
                      <DarkShimmerBox height="24px" width="70%" borderRadius="4px" />
                    </Box>
                  ) : (
                    <Box sx={{ mx: 'auto' }}>
                      <ShimmerBox height="24px" width="70%" borderRadius="4px" />
                    </Box>
                  )}
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3}>
          {cardsSkeleton.map((_, index) => (
            <Grid item xs={12} md={6} key={`progress-skeleton-${index}`}>
              <Card
                sx={{
                  height: '100%',
                  borderRadius: 4,
                  background: cardBackground,
                  border: `1px solid ${surfaceBorder}`,
                  p: 3,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  {darkMode ? (
                    <DarkShimmerBox height="52px" width="52px" borderRadius="50%" />
                  ) : (
                    <ShimmerBox height="52px" width="52px" borderRadius="50%" />
                  )}
                  <Box sx={{ flex: 1 }}>
                    {darkMode ? (
                      <>
                        <Box sx={{ mb: 1 }}>
                          <DarkShimmerBox height="24px" width="80%" borderRadius="4px" />
                        </Box>
                        <DarkShimmerBox height="20px" width="60%" borderRadius="4px" />
                      </>
                    ) : (
                      <>
                        <Box sx={{ mb: 1 }}>
                          <ShimmerBox height="24px" width="80%" borderRadius="4px" />
                        </Box>
                        <ShimmerBox height="20px" width="60%" borderRadius="4px" />
                      </>
                    )}
                  </Box>
                </Box>
                <Box sx={{ mb: 3 }}>
                  {darkMode ? (
                    <DarkShimmerBox height="8px" width="100%" borderRadius="4px" />
                  ) : (
                    <ShimmerBox height="8px" width="100%" borderRadius="4px" />
                  )}
                </Box>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      {darkMode ? (
                        <DarkShimmerBox height="32px" width="80%" borderRadius="4px" />
                      ) : (
                        <ShimmerBox height="32px" width="80%" borderRadius="4px" />
                      )}
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      {darkMode ? (
                        <DarkShimmerBox height="32px" width="80%" borderRadius="4px" />
                      ) : (
                        <ShimmerBox height="32px" width="80%" borderRadius="4px" />
                      )}
                    </Box>
                  </Grid>
                </Grid>
                {darkMode ? (
                  <DarkShimmerBox height="44px" width="100%" borderRadius="8px" />
                ) : (
                  <ShimmerBox height="44px" width="100%" borderRadius="8px" />
                )}
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  if (loading) {
    return renderLoadingSkeleton();
  }

  if (error) {
    return (
      <Box
        sx={{
          p: 3,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Alert
          severity="error"
          sx={{
            px: 3,
            py: 2,
            borderRadius: 2,
            fontWeight: 500,
          }}
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: { xs: 2, md: 3 },
        minHeight: '100vh',
        color: primaryTextColor,
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: 700,
            mb: 1,
            color: primaryTextColor,
            background: darkMode
              ? 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)'
              : 'linear-gradient(135deg, #EF5B5B 0%, #D94A4A 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          📊 Tiến độ học tập
        </Typography>
        <Typography variant="body1" sx={{ color: secondaryTextColor }}>
          Theo dõi quá trình học tập và thành tích của bạn
        </Typography>
      </Box>

      {/* Overall Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              textAlign: 'center',
              borderRadius: 3,
              background: darkMode
                ? 'linear-gradient(135deg, #FF7B7B 0%, #EF5B5B 100%)'
                : 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
              color: '#ffffff',
              boxShadow: darkMode
                ? '0 20px 40px rgba(190, 24, 93, 0.25)'
                : '0 20px 45px rgba(236, 72, 153, 0.3)',
            }}
          >
            <Typography variant="h3" fontWeight="bold" sx={{ color: '#ffffff' }}>
              {progressData.length}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.85, color: '#ffffff' }}>
              Môn học đã đăng ký
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              textAlign: 'center',
              borderRadius: 3,
              background: darkMode
                ? 'linear-gradient(135deg, #AED6E6 0%, #87CEEB 100%)'
                : 'linear-gradient(135deg, #9BC4E6 0%, #7BB3E6 100%)',
              color: '#ffffff',
              boxShadow: darkMode
                ? '0 20px 40px rgba(37, 99, 235, 0.25)'
                : '0 20px 45px rgba(96, 165, 250, 0.3)',
            }}
          >
            <Typography variant="h3" fontWeight="bold" sx={{ color: '#ffffff' }}>
              {progressData.filter((p) => p.progress.percentage === 100).length}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.85, color: '#ffffff' }}>
              Môn học hoàn thành
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              textAlign: 'center',
              borderRadius: 3,
              background: darkMode
                ? 'linear-gradient(135deg, #FF7B7B 0%, #EF5B5B 100%)'
                : 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
              color: '#ffffff',
              boxShadow: darkMode
                ? '0 20px 40px rgba(190, 24, 93, 0.25)'
                : '0 20px 45px rgba(236, 72, 153, 0.3)',
            }}
          >
            <Typography variant="h3" fontWeight="bold" sx={{ color: '#ffffff' }}>
              {Math.round(
                progressData.reduce((sum, p) => sum + p.progress.percentage, 0) /
                  (progressData.length || 1),
              )}
              %
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.85, color: '#ffffff' }}>
              Tiến độ trung bình
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Progress Cards */}
      {progressData.length > 0 ? (
        <Grid container spacing={3}>
          {progressData.map((progress, index) => (
            <Grid
              item
              xs={12}
              md={6}
              key={String(
                typeof progress.courseId === 'object' && progress.courseId
                  ? progress.courseId._id
                  : progress.courseId || `progress-${index}`,
              )}
            >
              <Card
                sx={{
                  height: '100%',
                  borderRadius: 4,
                  border: `1px solid ${surfaceBorder}`,
                  background: cardBackground,
                  color: primaryTextColor,
                  transition: 'all 0.3s ease',
                  boxShadow: darkMode
                    ? '0 4px 20px rgba(0, 0, 0, 0.3)'
                    : '0 4px 20px rgba(239, 91, 91, 0.1)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 'inherit',
                    border: `2px solid ${getProgressColor(progress.progress.percentage)}`,
                    opacity: 0.35,
                    pointerEvents: 'none',
                  },
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: darkMode
                      ? '0 8px 30px rgba(0, 0, 0, 0.4)'
                      : '0 8px 30px rgba(239, 91, 91, 0.2)',
                  },
                }}
              >
                <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                  <Box display="flex" alignItems="center" gap={2} sx={{ mb: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: getProgressColor(progress.progress.percentage),
                        width: 50,
                        height: 50,
                      }}
                    >
                      <SchoolIcon />
                    </Avatar>
                    <Box flex={1}>
                      <Typography
                        variant="h6"
                        fontWeight={600}
                        sx={{ mb: 0.5, color: primaryTextColor }}
                      >
                        {typeof progress.courseId === 'object' && progress.courseId
                          ? progress.courseId.title || 'Môn học'
                          : 'Môn học'}
                      </Typography>
                      <Typography variant="body2" sx={{ color: secondaryTextColor }}>
                        Đăng ký: {new Date(progress.enrolledAt).toLocaleDateString('vi-VN')}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ mb: 1 }}
                    >
                      <Typography variant="body2" fontWeight={600} sx={{ color: primaryTextColor }}>
                        Tiến độ: {progress.progress.percentage}%
                      </Typography>
                      <Chip
                        label={getProgressText(progress.progress.percentage)}
                        size="small"
                        sx={{
                          bgcolor: getProgressColor(progress.progress.percentage),
                          color: 'white',
                          fontWeight: 600,
                          boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
                        }}
                      />
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={progress.progress.percentage}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: darkMode
                          ? 'rgba(148, 163, 184, 0.16)'
                          : 'rgba(148, 163, 184, 0.2)',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: getProgressColor(progress.progress.percentage),
                          borderRadius: 4,
                        },
                      }}
                    />
                  </Box>

                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <Box textAlign="center">
                        <Typography variant="h6" fontWeight="bold" sx={{ color: primaryTextColor }}>
                          {progress.progress.completedLessons.length}
                        </Typography>
                        <Typography variant="caption" sx={{ color: secondaryTextColor }}>
                          Bài học hoàn thành
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box textAlign="center">
                        <Typography variant="h6" fontWeight="bold" sx={{ color: primaryTextColor }}>
                          {progress.progress.totalLessons}
                        </Typography>
                        <Typography variant="caption" sx={{ color: secondaryTextColor }}>
                          Tổng bài học
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  {progress.rating && (
                    <Box sx={{ mb: 2 }}>
                      <Divider sx={{ mb: 1, borderColor: surfaceBorder }} />
                      <Box display="flex" alignItems="center" gap={1}>
                        <StarIcon sx={{ color: '#FFD700', fontSize: 20 }} />
                        <Typography variant="body2" sx={{ color: primaryTextColor }}>
                          Đánh giá: {progress.rating}/5
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {progress.completedAt && (
                    <Box sx={{ mb: 2 }}>
                      <Divider sx={{ mb: 1, borderColor: surfaceBorder }} />
                      <Box display="flex" alignItems="center" gap={1}>
                        <CheckCircleIcon sx={{ color: '#4CAF50', fontSize: 20 }} />
                        <Typography variant="body2" sx={{ color: primaryTextColor }}>
                          Hoàn thành: {new Date(progress.completedAt).toLocaleDateString('vi-VN')}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => {
                      const course =
                        typeof progress.courseId === 'object' && progress.courseId
                          ? progress.courseId
                          : null;
                      const slugOrId =
                        course?.slug || course?._id || String(progress.courseId || '');
                      if (slugOrId) {
                        navigate(`/courses/${slugOrId}`);
                      }
                    }}
                    sx={{
                      borderRadius: 2,
                      background: darkMode
                        ? 'linear-gradient(135deg, #FF7B7B 0%, #EF5B5B 100%)'
                        : 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
                      color: '#ffffff',
                      fontWeight: 600,
                      boxShadow: darkMode
                        ? '0 20px 40px rgba(190, 24, 93, 0.25)'
                        : '0 20px 45px rgba(236, 72, 153, 0.3)',
                      '&:hover': {
                        background: darkMode
                          ? 'linear-gradient(135deg, #FF7B7B 0%, #EF5B5B 100%)'
                          : 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
                        boxShadow: darkMode
                          ? '0 20px 40px rgba(190, 24, 93, 0.25)'
                          : '0 20px 45px rgba(236, 72, 153, 0.3)',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {progress.progress.percentage === 100 ? 'Xem lại khóa học' : 'Tiếp tục học'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper
          elevation={0}
          sx={{
            borderRadius: 4,
            textAlign: 'center',
            p: { xs: 4, md: 6 },
            background: cardBackground,
            color: primaryTextColor,
            border: `1px solid ${surfaceBorder}`,
            boxShadow: darkMode
              ? '0 24px 48px rgba(15, 23, 42, 0.5)'
              : '0 28px 52px rgba(148, 163, 184, 0.3)',
          }}
        >
          <Typography variant="h2" sx={{ mb: 2, color: primaryTextColor }}>
            📚
          </Typography>
          <Typography variant="h5" fontWeight={600} sx={{ mb: 2, color: primaryTextColor }}>
            Chưa có tiến độ học tập
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, color: secondaryTextColor }}>
            Hãy đăng ký các khóa học để bắt đầu hành trình học tập của bạn!
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/student/courses')}
            sx={{
              borderRadius: 3,
              py: 1.5,
              px: 4,
              background: darkMode
                ? 'linear-gradient(135deg, #FF7B7B 0%, #EF5B5B 100%)'
                : 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
              color: '#ffffff',
              fontWeight: 600,
              boxShadow: darkMode
                ? '0 20px 40px rgba(190, 24, 93, 0.25)'
                : '0 20px 45px rgba(236, 72, 153, 0.3)',
              '&:hover': {
                background: darkMode
                  ? 'linear-gradient(135deg, #FF7B7B 0%, #EF5B5B 100%)'
                  : 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
                transform: 'translateY(-2px)',
                boxShadow: darkMode
                  ? '0 20px 40px rgba(190, 24, 93, 0.25)'
                  : '0 20px 45px rgba(236, 72, 153, 0.3)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            Khám phá khóa học
          </Button>
        </Paper>
      )}
    </Box>
  );
}
