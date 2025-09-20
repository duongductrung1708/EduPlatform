import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  LinearProgress, 
  Chip, 
  Stack,
  Paper,
  Avatar,
  Button,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StarIcon from '@mui/icons-material/Star';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { progressApi, ProgressData } from '../../../api/progress';
import { useTheme } from '../../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';

export default function StudentProgress() {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      setLoading(true);
      setError(null);
      const progress = await progressApi.getStudentProgress();
      setProgressData(progress);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải tiến độ học tập');
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

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Đang tải tiến độ học tập...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 700, 
            mb: 1, 
            background: darkMode 
              ? 'linear-gradient(45deg, #8BC34A, #4CAF50)'
              : 'linear-gradient(45deg, #4CAF50, #8BC34A)',
            backgroundClip: 'text', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent'
          }}
        >
          📊 Tiến độ học tập
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Theo dõi quá trình học tập và thành tích của bạn
        </Typography>
      </Box>

      {/* Overall Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 3, 
              textAlign: 'center',
              background: darkMode 
                ? 'linear-gradient(135deg, #FF7B7B 0%, #EF5B5B 100%)'
                : 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
              color: 'white',
              borderRadius: 3
            }}
          >
            <Typography variant="h3" fontWeight="bold">
              {progressData.length}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Môn học đã đăng ký
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 3, 
              textAlign: 'center',
              background: 'linear-gradient(135deg, #AED6E6 0%, #87CEEB 100%)',
              color: 'white',
              borderRadius: 3
            }}
          >
            <Typography variant="h3" fontWeight="bold">
              {progressData.filter(p => p.progress.percentage === 100).length}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Môn học hoàn thành
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 3, 
              textAlign: 'center',
              background: darkMode 
                ? 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)'
                : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
              borderRadius: 3
            }}
          >
            <Typography variant="h3" fontWeight="bold">
              {Math.round(progressData.reduce((sum, p) => sum + p.progress.percentage, 0) / (progressData.length || 1))}%
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Tiến độ trung bình
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Progress Cards */}
      {progressData.length > 0 ? (
        <Grid container spacing={3}>
          {progressData.map((progress, index) => (
            <Grid item xs={12} md={6} key={progress.courseId}>
              <Card 
                sx={{ 
                  height: '100%',
                  borderRadius: 4,
                  border: '2px solid',
                  borderColor: getProgressColor(progress.progress.percentage),
                  background: darkMode 
                    ? 'linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%)'
                    : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                  }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" alignItems="center" gap={2} sx={{ mb: 2 }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: getProgressColor(progress.progress.percentage),
                        width: 50,
                        height: 50
                      }}
                    >
                      <SchoolIcon />
                    </Avatar>
                    <Box flex={1}>
                      <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>
                        {typeof progress.courseId === 'object' ? progress.courseId.title : 'Môn học'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Đăng ký: {new Date(progress.enrolledAt).toLocaleDateString('vi-VN')}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="body2" fontWeight={600}>
                        Tiến độ: {progress.progress.percentage}%
                      </Typography>
                      <Chip 
                        label={getProgressText(progress.progress.percentage)}
                        size="small"
                        sx={{ 
                          bgcolor: getProgressColor(progress.progress.percentage),
                          color: 'white',
                          fontWeight: 600
                        }}
                      />
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={progress.progress.percentage}
                      sx={{ 
                        height: 8, 
                        borderRadius: 4,
                        bgcolor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: getProgressColor(progress.progress.percentage),
                          borderRadius: 4
                        }
                      }}
                    />
                  </Box>

                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <Box textAlign="center">
                        <Typography variant="h6" fontWeight="bold" color="primary">
                          {progress.progress.completedLessons.length}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Bài học hoàn thành
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box textAlign="center">
                        <Typography variant="h6" fontWeight="bold" color="secondary">
                          {progress.progress.totalLessons}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Tổng bài học
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  {progress.rating && (
                    <Box sx={{ mb: 2 }}>
                      <Divider sx={{ mb: 1 }} />
                      <Box display="flex" alignItems="center" gap={1}>
                        <StarIcon sx={{ color: '#FFD700', fontSize: 20 }} />
                        <Typography variant="body2">
                          Đánh giá: {progress.rating}/5
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {progress.completedAt && (
                    <Box sx={{ mb: 2 }}>
                      <Divider sx={{ mb: 1 }} />
                      <Box display="flex" alignItems="center" gap={1}>
                        <CheckCircleIcon sx={{ color: '#4CAF50', fontSize: 20 }} />
                        <Typography variant="body2">
                          Hoàn thành: {new Date(progress.completedAt).toLocaleDateString('vi-VN')}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => navigate(`/courses/${progress.courseId}`)}
                    sx={{ 
                      borderRadius: 2,
                      background: darkMode 
                ? 'linear-gradient(135deg, #FF7B7B 0%, #EF5B5B 100%)'
                : 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #D94A4A 0%, #EF5B5B 100%)',
                      }
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
          elevation={2} 
          sx={{ 
            borderRadius: 4,
            textAlign: 'center',
            p: 6,
            background: darkMode 
              ? 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)'
              : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white'
          }}
        >
          <Typography variant="h2" sx={{ mb: 2 }}>
            📚
          </Typography>
          <Typography variant="h5" fontWeight={600} sx={{ mb: 2 }}>
            Chưa có tiến độ học tập
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, opacity: 0.9 }}>
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
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '2px solid rgba(255,255,255,0.3)',
              '&:hover': {
                background: 'rgba(255,255,255,0.3)',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(0,0,0,0.2)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            Khám phá khóa học
          </Button>
        </Paper>
      )}
    </Box>
  );
}
