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
  IconButton,
  Tooltip,
  CircularProgress,
  Alert
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AddIcon from '@mui/icons-material/Add';
import { classesApi } from '../../../api/admin';
import { useNavigate } from 'react-router-dom';
import { SkeletonStats, SkeletonGrid } from '../../../components/LoadingSkeleton';
import { useTheme } from '../../../contexts/ThemeContext';

export default function StudentClassrooms() {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadClassrooms = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Simulate loading delay for better UX
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const res = await classesApi.listMy(1, 50);
        setClassrooms(res.items || []);
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Không thể tải danh sách lớp học');
      } finally {
        setLoading(false);
      }
    };

    loadClassrooms();
  }, []);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ 
          mb: 4, 
          fontWeight: 700,
          background: darkMode 
            ? 'linear-gradient(135deg, #FF7B7B 0%, #EF5B5B 100%)'
            : 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Lớp học của tôi
        </Typography>
        <SkeletonGrid />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ 
          mb: 4, 
          fontWeight: 700,
          background: darkMode 
            ? 'linear-gradient(135deg, #FF7B7B 0%, #EF5B5B 100%)'
            : 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Lớp học của tôi
        </Typography>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      </Box>
    );
  }

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
          🎓 Lớp học của tôi 🎓
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500 }}>
          Khám phá và học tập cùng bạn bè!
        </Typography>
      </Box>

      {/* Join Class Button */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<AddIcon />}
          onClick={() => navigate('/join-class')}
          sx={{ 
            borderRadius: 3,
            py: 1.5,
            px: 4,
            background: darkMode 
            ? 'linear-gradient(135deg, #FF7B7B 0%, #EF5B5B 100%)'
            : 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #D94A4A 0%, #EF5B5B 100%)',
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 25px rgba(239, 91, 91, 0.3)'
            },
            transition: 'all 0.3s ease'
          }}
        >
          Tham gia lớp học mới
        </Button>
      </Box>

      {/* Classrooms Grid */}
      {classrooms.length > 0 ? (
        <Paper 
          elevation={0} 
          sx={{ 
            p: 4, 
            borderRadius: 4,
            background: darkMode 
              ? 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)'
              : 'linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%)',
            border: '1px solid rgba(239, 91, 91, 0.1)'
          }}
        >
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, textAlign: 'center' }}>
            Danh sách lớp học
          </Typography>
          <Grid container spacing={3}>
            {classrooms.map((c) => (
              <Grid item xs={12} sm={6} md={4} key={c._id}>
                <Card 
                  sx={{ 
                    height: '100%',
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 0.3s ease', 
                    '&:hover': { 
                      transform: 'translateY(-8px)', 
                      boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                      borderColor: darkMode ? '#FF7B7B' : '#EF5B5B'
                    } 
                  }}
                >
                  <CardContent sx={{ p: 3, textAlign: 'center' }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: darkMode ? '#FF7B7B' : '#EF5B5B', 
                        width: 60, 
                        height: 60,
                        mx: 'auto', 
                        mb: 2,
                        fontSize: '1.5rem'
                      }}
                    >
                      <SchoolIcon />
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
                        icon={<PeopleIcon />}
                        label={`${c.studentsCount || 0} bạn`} 
                        sx={{ borderColor: darkMode ? '#FF7B7B' : '#EF5B5B', color: darkMode ? '#FF7B7B' : '#EF5B5B' }}
                        variant="outlined" 
                      />
                      <Chip 
                        size="small" 
                        icon={<AssignmentIcon />}
                        label={`${c.assignmentsCount || 0} bài tập`} 
                        sx={{ borderColor: '#AED6E6', color: '#AED6E6' }}
                        variant="outlined" 
                      />
                    </Stack>
                    
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => navigate(`/student/classrooms/${c._id}`)}
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
                      Vào lớp học
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      ) : (
        <Paper 
          elevation={0} 
          sx={{ 
            p: 6, 
            textAlign: 'center',
            borderRadius: 4,
            background: darkMode 
              ? 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)'
              : 'linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%)',
            border: '1px solid rgba(239, 91, 91, 0.1)'
          }}
        >
          <SchoolIcon sx={{ fontSize: 80, color: darkMode ? '#FF7B7B' : '#EF5B5B', mb: 2 }} />
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
            Chưa có lớp học nào
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Hãy tham gia lớp học để bắt đầu học tập cùng bạn bè!
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
              background: darkMode 
            ? 'linear-gradient(135deg, #FF7B7B 0%, #EF5B5B 100%)'
            : 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #D94A4A 0%, #EF5B5B 100%)',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(239, 91, 91, 0.3)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            Tham gia lớp học
          </Button>
        </Paper>
      )}
    </Box>
  );
}
