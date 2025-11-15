import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Stack, 
  Avatar,
  Paper,
  Chip,
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import AddIcon from '@mui/icons-material/Add';
import StarIcon from '@mui/icons-material/Star';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import { classesApi } from '../../../api/admin';
import { useNavigate } from 'react-router-dom';
import { SkeletonStats, SkeletonGrid } from '../../../components/LoadingSkeleton';
import { useTheme } from '../../../contexts/ThemeContext';

export default function StudentOverview() {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{ enrolledClasses: number; pendingAssignments: number; notifications: number }>({ 
    enrolledClasses: 0, 
    pendingAssignments: 0, 
    notifications: 0 
  });
  const [recentClasses, setRecentClasses] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Simulate loading delay for better UX
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const res = await classesApi.listMy(1, 50);
        const classes = res.items || [];
        setStats({ 
          enrolledClasses: classes.length, 
          pendingAssignments: classes.reduce((sum, c) => sum + (c.assignmentsCount || 0), 0),
          notifications: 0 
        });
        setRecentClasses(classes.slice(0, 3));
      } catch (error: unknown) {
        const err = error as { response?: { status?: number; data?: { message?: string } } };
        // Handle 401 gracefully - user might not be authenticated
        if (err.response?.status === 401) {
          setStats({ 
            enrolledClasses: 0, 
            pendingAssignments: 0,
            notifications: 0 
          });
          setRecentClasses([]);
        } else {
          console.error('Failed to load overview data:', error);
        }
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography 
          variant="h3" 
          sx={{ 
            fontWeight: 800, 
            mb: 2, 
            background: darkMode 
              ? 'linear-gradient(135deg, #FF7B7B 0%, #EF5B5B 50%, #AED6E6 100%)'
              : 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 50%, #AED6E6 100%)',
            backgroundSize: '200% 200%',
            backgroundClip: 'text', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent',
            animation: 'gradient 3s ease-in-out infinite'
          }}
        >
          🎉 Chào mừng bạn! 🎉
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500 }}>
          Hãy khám phá và học tập thật vui nhé!
        </Typography>
      </Box>

      {/* Stats Cards */}
      {loading ? (
        <SkeletonStats count={3} />
      ) : (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <Card 
              sx={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 4,
                boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: -20,
                  right: -20,
                  width: '80px',
                  height: '80px',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '50%',
                  transform: 'rotate(45deg)'
                }
              }}
            >
              <CardContent sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 60, height: 60, mx: 'auto', mb: 2 }}>
                  <SchoolIcon sx={{ fontSize: 32, color: 'white' }} />
                </Avatar>
                <Typography variant="h2" fontWeight="bold" sx={{ mb: 1, color: 'white' }}>
                  {stats.enrolledClasses}
                </Typography>
                <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  Lớp đã tham gia
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Card 
              sx={{ 
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 4,
                boxShadow: '0 8px 32px rgba(240, 147, 251, 0.3)',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: -20,
                  right: -20,
                  width: '80px',
                  height: '80px',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '50%',
                  transform: 'rotate(45deg)'
                }
              }}
            >
              <CardContent sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 60, height: 60, mx: 'auto', mb: 2 }}>
                  <AssignmentTurnedInIcon sx={{ fontSize: 32, color: 'white' }} />
                </Avatar>
                <Typography variant="h2" fontWeight="bold" sx={{ mb: 1, color: 'white' }}>
                  {stats.pendingAssignments}
                </Typography>
                <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  Bài tập cần làm
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Card 
              sx={{ 
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 4,
                boxShadow: '0 8px 32px rgba(79, 172, 254, 0.3)',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: -20,
                  right: -20,
                  width: '80px',
                  height: '80px',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '50%',
                  transform: 'rotate(45deg)'
                }
              }}
            >
              <CardContent sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 60, height: 60, mx: 'auto', mb: 2 }}>
                  <EmojiEventsIcon sx={{ fontSize: 32, color: 'white' }} />
                </Avatar>
                <Typography variant="h2" fontWeight="bold" sx={{ mb: 1, color: 'white' }}>
                  {stats.notifications}
                </Typography>
                <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  Thành tích mới
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Quick Actions */}
      <Paper 
        elevation={3} 
        sx={{ 
          borderRadius: 4,
          mb: 4,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
            🚀 Bắt đầu học tập ngay!
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<SchoolIcon />}
                onClick={() => navigate('/student')}
                sx={{ 
                  py: 2,
                  borderRadius: 3,
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
                Lớp của tôi
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<GroupAddIcon />}
                onClick={() => navigate('/join-class')}
                sx={{ 
                  py: 2,
                  borderRadius: 3,
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
                Tham gia lớp mới
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<StarIcon />}
                onClick={() => navigate('/student/courses')}
                sx={{ 
                  py: 2,
                  borderRadius: 3,
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
                Môn học
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<EmojiEventsIcon />}
                onClick={() => navigate('/student/badges')}
                sx={{ 
                  py: 2,
                  borderRadius: 3,
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
                Huy hiệu
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>

        {/* Recent Classes */}
        {loading ? (
          <Paper 
            elevation={2} 
            sx={{ 
              borderRadius: 4,
              overflow: 'hidden',
              border: '2px solid',
              borderColor: 'divider'
            }}
          >
            <Box 
              sx={{ 
                p: 2, 
                background: 'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%)',
                color: 'white'
              }}
            >
              <Box display="flex" alignItems="center" gap={1}>
                <SchoolIcon />
                <Typography variant="h6" fontWeight={600}>
                  🎓 Lớp học gần đây
                </Typography>
              </Box>
            </Box>
            <Box sx={{ p: 3 }}>
              <SkeletonGrid count={3} columns={{ xs: 12, sm: 6, md: 4 }} showAvatar={true} showChips={true} showButton={true} />
            </Box>
          </Paper>
        ) : recentClasses.length > 0 ? (
          <Paper 
            elevation={2} 
            sx={{ 
              borderRadius: 4,
              overflow: 'hidden',
              border: '2px solid',
              borderColor: 'divider'
            }}
          >
            <Box 
              sx={{ 
                p: 2, 
                background: 'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%)',
                color: 'white'
              }}
            >
              <Box display="flex" alignItems="center" gap={1}>
                <SchoolIcon />
                <Typography variant="h6" fontWeight={600}>
                  🎓 Lớp học gần đây
                </Typography>
              </Box>
            </Box>
            <Box sx={{ p: 3 }}>
              <Grid container spacing={2}>
                {recentClasses.map((c) => (
                  <Grid key={c._id} item xs={12} sm={6} md={4}>
                    <Card 
                      sx={{ 
                        borderRadius: 3,
                        border: '2px solid',
                        borderColor: 'divider',
                        '&:hover': {
                          boxShadow: 4,
                          transform: 'translateY(-4px)',
                          transition: 'all 0.3s ease'
                        }
                      }}
                    >
                      <CardContent sx={{ textAlign: 'center', p: 3 }}>
                        <Avatar 
                          sx={{ 
                            bgcolor: '#EF5B5B', 
                            width: 60, 
                            height: 60, 
                            mx: 'auto', 
                            mb: 2,
                            fontSize: '1.5rem'
                          }}
                        >
                          📚
                        </Avatar>
                        <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                          {c.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {c.teacherNames ? `Giáo viên: ${c.teacherNames}` : ''}
                        </Typography>
                        <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 2 }}>
                          <Chip 
                            size="small" 
                            label={`${c.studentsCount || 0} bạn`} 
                            sx={{ borderColor: '#EF5B5B', color: '#EF5B5B' }}
                            variant="outlined" 
                          />
                          <Chip 
                            size="small" 
                            label={`${c.assignmentsCount || 0} bài tập`} 
                            sx={{ borderColor: '#AED6E6', color: '#AED6E6' }}
                            variant="outlined" 
                          />
                        </Stack>
                        <Button
                          variant="contained"
                          onClick={() => navigate(`/student/classrooms/${c._id}`)}
                          sx={{ 
                            borderRadius: 2,
                            background: 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
                            '&:hover': {
                              background: 'linear-gradient(135deg, #D94A4A 0%, #EF5B5B 100%)',
                            }
                          }}
                        >
                          Vào lớp học
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Paper>
        ) : null}

      {/* Empty State */}
      {recentClasses.length === 0 && (
        <Paper 
          elevation={2} 
          sx={{ 
            borderRadius: 4,
            textAlign: 'center',
            p: 6,
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white'
          }}
        >
          <Typography variant="h2" sx={{ mb: 2 }}>
            🎈
          </Typography>
          <Typography variant="h5" fontWeight={600} sx={{ mb: 2 }}>
            Chưa có lớp học nào
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, opacity: 0.9 }}>
            Hãy tham gia lớp học đầu tiên để bắt đầu hành trình học tập thú vị!
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            onClick={() => navigate('/join-class')}
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
            Tham gia lớp học ngay!
          </Button>
        </Paper>
      )}
    </Box>
  );
}


