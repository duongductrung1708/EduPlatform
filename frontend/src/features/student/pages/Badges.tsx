import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Avatar, 
  Chip, 
  Stack,
  Paper,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import StarIcon from '@mui/icons-material/Star';
import SchoolIcon from '@mui/icons-material/School';
import { progressApi, BadgeData } from '../../../api/progress';
import { useTheme } from '../../../contexts/ThemeContext';

export default function StudentBadges() {
  const { darkMode } = useTheme();
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBadges();
  }, []);

  const loadBadges = async () => {
    try {
      setLoading(true);
      setError(null);
      const badgesData = await progressApi.getStudentBadges();
      setBadges(badgesData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải danh sách huy hiệu');
    } finally {
      setLoading(false);
    }
  };

  const getBadgeIcon = (badgeName: string) => {
    if (badgeName.toLowerCase().includes('hoàn thành')) return '🏆';
    if (badgeName.toLowerCase().includes('xuất sắc')) return '⭐';
    if (badgeName.toLowerCase().includes('kiên trì')) return '🔥';
    if (badgeName.toLowerCase().includes('học tập')) return '📚';
    return '🎖️';
  };

  const getBadgeColor = (badge: any) => {
    switch (badge.criteria.kind) {
      case 'course_completion': return '#4CAF50';
      case 'quiz_perfect': return '#FF9800';
      case 'streak': return '#F44336';
      default: return '#9C27B0';
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Đang tải huy hiệu...
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
              ? 'linear-gradient(45deg, #FFA500, #FFD700)'
              : 'linear-gradient(45deg, #FFD700, #FFA500)',
            backgroundClip: 'text', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent'
          }}
        >
          🏆 Huy hiệu của tôi
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Những thành tích bạn đã đạt được trong hành trình học tập
        </Typography>
      </Box>

      {/* Stats */}
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
              {badges.length}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Tổng huy hiệu
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
              {badges.filter(b => b.badge.criteria.kind === 'course_completion').length}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Hoàn thành môn học
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
              {badges.filter(b => b.badge.criteria.kind === 'quiz_perfect').length}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Điểm tuyệt đối
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Badges Grid */}
      {badges.length > 0 ? (
        <Grid container spacing={3}>
          {badges.map((badgeData, index) => (
            <Grid item xs={12} sm={6} md={4} key={badgeData.badge._id}>
              <Card 
                sx={{ 
                  height: '100%',
                  borderRadius: 4,
                  border: '2px solid',
                  borderColor: getBadgeColor(badgeData.badge),
                  background: darkMode 
                    ? 'linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%)'
                    : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                  }
                }}
              >
                <CardContent sx={{ p: 3, textAlign: 'center' }}>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      mx: 'auto',
                      mb: 2,
                      bgcolor: getBadgeColor(badgeData.badge),
                      fontSize: '2rem',
                      border: '4px solid',
                      borderColor: 'background.paper',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                    }}
                  >
                    {getBadgeIcon(badgeData.badge.name)}
                  </Avatar>
                  
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                    {badgeData.badge.name}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                    {badgeData.badge.description}
                  </Typography>

                  <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 2 }}>
                    <Chip 
                      label={badgeData.badge.criteria.kind === 'course_completion' ? 'Hoàn thành' : 
                             badgeData.badge.criteria.kind === 'quiz_perfect' ? 'Xuất sắc' :
                             badgeData.badge.criteria.kind === 'streak' ? 'Kiên trì' : 'Đặc biệt'}
                      size="small"
                      sx={{ 
                        bgcolor: getBadgeColor(badgeData.badge),
                        color: 'white',
                        fontWeight: 600
                      }}
                    />
                  </Stack>

                  {badgeData.course && (
                    <Box sx={{ mb: 2 }}>
                      <Divider sx={{ mb: 1 }} />
                      <Typography variant="caption" color="text.secondary">
                        Môn học: {badgeData.course.title}
                      </Typography>
                    </Box>
                  )}

                  <Typography variant="caption" color="text.secondary">
                    Đạt được: {new Date(badgeData.earnedAt).toLocaleDateString('vi-VN')}
                  </Typography>
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
            🎯
          </Typography>
          <Typography variant="h5" fontWeight={600} sx={{ mb: 2 }}>
            Chưa có huy hiệu nào
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, opacity: 0.9 }}>
            Hãy hoàn thành các môn học và bài tập để nhận được huy hiệu đầu tiên!
          </Typography>
        </Paper>
      )}
    </Box>
  );
}
