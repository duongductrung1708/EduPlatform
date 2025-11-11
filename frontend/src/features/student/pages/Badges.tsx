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
  Skeleton,
} from '@mui/material';
import { progressApi, BadgeData } from '../../../api/progress';
import { useTheme } from '../../../contexts/ThemeContext';

export default function StudentBadges() {
  const { darkMode } = useTheme();
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Theme colors
  const primaryTextColor = darkMode ? '#f8fafc' : '#102a43';
  const secondaryTextColor = darkMode ? 'rgba(248, 250, 252, 0.7)' : 'rgba(16, 42, 67, 0.64)';
  const cardBackground = darkMode
    ? 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)'
    : 'linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%)';
  const surfaceBorder = darkMode ? 'rgba(148, 163, 184, 0.2)' : 'rgba(79, 70, 229, 0.12)';
  const skeletonBaseColor = darkMode ? 'rgba(148, 163, 184, 0.2)' : 'rgba(148, 163, 184, 0.25)';

  useEffect(() => {
    loadBadges();
  }, []);

  const loadBadges = async () => {
    try {
      setLoading(true);
      setError(null);
      const badgesData = await progressApi.getStudentBadges();
      // Normalize data defensively
      const normalized: BadgeData[] = (Array.isArray(badgesData) ? badgesData : [])
        .filter((b): b is BadgeData => {
          const isValid = !!b && !!b.badge;
          return isValid;
        })
        .map(
          (b): BadgeData => ({
            ...b,
            earnedAt: b.earnedAt
              ? typeof b.earnedAt === 'string'
                ? new Date(b.earnedAt)
                : b.earnedAt instanceof Date
                  ? b.earnedAt
                  : new Date(b.earnedAt)
              : new Date(),
          }),
        );
      setBadges(normalized);
    } catch (err: any) {
      const apiMsg = err?.response?.data?.message || err?.response?.data?.error || err?.message;
      setError(apiMsg || 'Không thể tải danh sách huy hiệu');
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
      case 'course_completion':
        return '#4CAF50';
      case 'quiz_perfect':
        return '#FF9800';
      case 'streak':
        return '#F44336';
      default:
        return '#9C27B0';
    }
  };

  const renderLoadingSkeleton = () => {
    const statsSkeleton = Array.from({ length: 3 });
    const badgesSkeleton = Array.from({ length: 6 });

    return (
      <Box sx={{ p: { xs: 2, md: 3 }, color: primaryTextColor }}>
        {/* Header Skeleton */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Skeleton
            variant="text"
            height={48}
            width="40%"
            sx={{ bgcolor: skeletonBaseColor, mx: 'auto', mb: 1 }}
            animation="wave"
          />
          <Skeleton
            variant="text"
            height={24}
            width="60%"
            sx={{ bgcolor: skeletonBaseColor, mx: 'auto' }}
            animation="wave"
          />
        </Box>

        {/* Stats Skeleton */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {statsSkeleton.map((_, index) => (
            <Grid item xs={12} sm={4} key={`stat-skeleton-${index}`}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  background: cardBackground,
                  border: `1px solid ${surfaceBorder}`,
                }}
              >
                <Skeleton
                  variant="text"
                  height={56}
                  width="60%"
                  sx={{ bgcolor: skeletonBaseColor, mb: 1 }}
                  animation="wave"
                />
                <Skeleton
                  variant="text"
                  height={20}
                  width="80%"
                  sx={{ bgcolor: skeletonBaseColor }}
                  animation="wave"
                />
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Badges Grid Skeleton */}
        <Grid container spacing={3}>
          {badgesSkeleton.map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={`badge-skeleton-${index}`}>
              <Card
                sx={{
                  height: '100%',
                  borderRadius: 4,
                  border: `1px solid ${surfaceBorder}`,
                  background: cardBackground,
                }}
              >
                <CardContent sx={{ p: 3, textAlign: 'center' }}>
                  <Skeleton
                    variant="circular"
                    width={80}
                    height={80}
                    sx={{ bgcolor: skeletonBaseColor, mx: 'auto', mb: 2 }}
                    animation="wave"
                  />
                  <Skeleton
                    variant="text"
                    height={28}
                    width="70%"
                    sx={{ bgcolor: skeletonBaseColor, mx: 'auto', mb: 1 }}
                    animation="wave"
                  />
                  <Skeleton
                    variant="text"
                    height={20}
                    width="90%"
                    sx={{ bgcolor: skeletonBaseColor, mx: 'auto', mb: 1 }}
                    animation="wave"
                  />
                  <Skeleton
                    variant="text"
                    height={20}
                    width="60%"
                    sx={{ bgcolor: skeletonBaseColor, mx: 'auto', mb: 2 }}
                    animation="wave"
                  />
                  <Skeleton
                    variant="rectangular"
                    height={24}
                    width={100}
                    sx={{ bgcolor: skeletonBaseColor, mx: 'auto', borderRadius: 1 }}
                    animation="wave"
                  />
                </CardContent>
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
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, color: primaryTextColor }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            mb: 1,
            color: primaryTextColor,
            textShadow: darkMode
              ? '0px 12px 32px rgba(15,23,42,0.55)'
              : '0px 12px 32px rgba(79,70,229,0.28)',
          }}
        >
          🏆 Huy hiệu của tôi
        </Typography>
        <Typography variant="body1" sx={{ color: secondaryTextColor }}>
          Những thành tích bạn đã đạt được trong hành trình học tập
        </Typography>
      </Box>

      {/* Stats */}
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
              {badges.length}
            </Typography>
            <Typography variant="body2" sx={{ color: '#ffffff', opacity: 0.85 }}>
              Tổng huy hiệu
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
                ? '0 20px 40px rgba(190, 24, 93, 0.25)'
                : '0 20px 45px rgba(236, 72, 153, 0.3)',
            }}
          >
            <Typography variant="h3" fontWeight="bold" sx={{ color: '#ffffff' }}>
              {badges.filter((b) => b.badge.criteria.kind === 'course_completion').length}
            </Typography>
            <Typography variant="body2" sx={{ color: '#ffffff', opacity: 0.85 }}>
              Hoàn thành môn học
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
              {badges.filter((b) => b.badge.criteria.kind === 'quiz_perfect').length}
            </Typography>
            <Typography variant="body2" sx={{ color: '#ffffff', opacity: 0.85 }}>
              Điểm tuyệt đối
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Badges Grid */}
      {badges.length > 0 ? (
        <Grid container spacing={3}>
          {badges.map((badgeData, index) => (
            <Grid item xs={12} sm={6} md={4} key={badgeData.badge._id || `badge-${index}`}>
              <Card
                sx={{
                  height: '100%',
                  borderRadius: 4,
                  border: `1px solid ${surfaceBorder}`,
                  background: cardBackground,
                  transition: 'all 0.3s ease',
                  boxShadow: darkMode
                    ? '0 16px 36px rgba(15, 23, 42, 0.45)'
                    : '0 24px 36px rgba(148, 163, 184, 0.25)',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: darkMode
                      ? '0 24px 48px rgba(15, 23, 42, 0.55)'
                      : '0 32px 52px rgba(100, 116, 139, 0.3)',
                  },
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
                      borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    }}
                  >
                    {getBadgeIcon(badgeData.badge.name)}
                  </Avatar>

                  <Typography variant="h6" fontWeight={600} sx={{ mb: 1, color: primaryTextColor }}>
                    {badgeData.badge.name}
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{ mb: 2, minHeight: 40, color: secondaryTextColor }}
                  >
                    {badgeData.badge.description}
                  </Typography>

                  <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 2 }}>
                    <Chip
                      label={
                        badgeData.badge.criteria.kind === 'course_completion'
                          ? 'Hoàn thành'
                          : badgeData.badge.criteria.kind === 'quiz_perfect'
                            ? 'Xuất sắc'
                            : badgeData.badge.criteria.kind === 'streak'
                              ? 'Kiên trì'
                              : 'Đặc biệt'
                      }
                      size="small"
                      sx={{
                        bgcolor: getBadgeColor(badgeData.badge),
                        color: 'white',
                        fontWeight: 600,
                      }}
                    />
                  </Stack>

                  {badgeData.course && (
                    <Box sx={{ mb: 2 }}>
                      <Divider sx={{ mb: 1, borderColor: surfaceBorder }} />
                      <Typography variant="caption" sx={{ color: secondaryTextColor }}>
                        Môn học:{' '}
                        {typeof badgeData.course === 'object' ? badgeData.course.title : 'N/A'}
                      </Typography>
                    </Box>
                  )}

                  <Typography variant="caption" sx={{ color: secondaryTextColor }}>
                    Đạt được: {new Date(badgeData.earnedAt).toLocaleDateString('vi-VN')}
                  </Typography>
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
            p: 6,
            background: cardBackground,
            color: '#ffffff',
            boxShadow: darkMode
              ? '0 20px 40px rgba(190, 24, 93, 0.25)'
              : '0 20px 45px rgba(236, 72, 153, 0.3)',
          }}
        >
          <Typography variant="h2" sx={{ mb: 2, color: primaryTextColor }}>
            🎯
          </Typography>
          <Typography variant="h5" fontWeight={600} sx={{ mb: 2, color: primaryTextColor }}>
            Chưa có huy hiệu nào
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, opacity: 0.9, color: primaryTextColor }}>
            Hãy hoàn thành các môn học và bài tập để nhận được huy hiệu đầu tiên!
          </Typography>
        </Paper>
      )}
    </Box>
  );
}
