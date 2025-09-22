import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Stack, 
  Chip, 
  Avatar,
  Paper,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import ClassIcon from '@mui/icons-material/Class';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PublicIcon from '@mui/icons-material/Public';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SchoolIcon from '@mui/icons-material/School';
import { classesApi } from '../../../api/admin';
import { coursesApi, CourseItem } from '../../../api/courses';
import { useNavigate } from 'react-router-dom';

export default function TeacherOverview() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<{ classrooms: number; students: number; assignments: number }>({ classrooms: 0, students: 0, assignments: 0 });
  const [recentClasses, setRecentClasses] = useState<any[]>([]);
  const [publicCourses, setPublicCourses] = useState<CourseItem[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await classesApi.listMy(1, 50);
        const classrooms = res.items || [];
        const students = classrooms.reduce((sum, c: any) => sum + (c.studentsCount ?? (c.studentIds?.length || 0)), 0);
        const assignments = classrooms.reduce((sum, c: any) => sum + (c.assignmentsCount || 0), 0);
        setStats({ classrooms: classrooms.length, students, assignments });
        setRecentClasses(classrooms.slice(0, 5));
      } catch (error: any) {
        // Handle 401 gracefully - user might not be authenticated
        if (error.response?.status === 401) {
          setStats({ classrooms: 0, students: 0, assignments: 0 });
          setRecentClasses([]);
        }
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await coursesApi.listPublic(1, 6);
        setPublicCourses(res.items);
      } catch {}
    })();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ 
          fontWeight: 700, 
          mb: 1, 
          color: 'text.primary',
          textShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          Tổng quan
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Quản lý lớp học và môn học của bạn
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card 
            sx={{ 
              background: 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                right: 0,
                width: '100px',
                height: '100px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '50%',
                transform: 'translate(30px, -30px)'
              }
            }}
          >
            <CardContent sx={{ position: 'relative', zIndex: 1 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h3" fontWeight="bold" sx={{ mb: 1, color: '#FFFFFF', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                    {stats.classrooms}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, color: '#FFFFFF' }}>
                    Lớp của tôi
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <ClassIcon sx={{ fontSize: 28 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <Card 
            sx={{ 
              background: 'linear-gradient(135deg, #AED6E6 0%, #87CEEB 100%)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                right: 0,
                width: '100px',
                height: '100px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '50%',
                transform: 'translate(30px, -30px)'
              }
            }}
          >
            <CardContent sx={{ position: 'relative', zIndex: 1 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h3" fontWeight="bold" sx={{ mb: 1, color: '#FFFFFF', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                    {stats.students}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, color: '#FFFFFF' }}>
                    Học sinh
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <PeopleIcon sx={{ fontSize: 28 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <Card 
            sx={{ 
              background: 'linear-gradient(135deg, #FF7B7B 0%, #EF5B5B 100%)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                right: 0,
                width: '100px',
                height: '100px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '50%',
                transform: 'translate(30px, -30px)'
              }
            }}
          >
            <CardContent sx={{ position: 'relative', zIndex: 1 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h3" fontWeight="bold" sx={{ mb: 1, color: '#FFFFFF', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                    {stats.assignments}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, color: '#FFFFFF' }}>
                    Bài tập
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <AssignmentIcon sx={{ fontSize: 28 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Paper 
        elevation={2} 
        sx={{ 
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          mb: 4
        }}
      >
        <Box 
          sx={{ 
            p: 2, 
            background: 'linear-gradient(135deg, #AED6E6 0%, #87CEEB 100%)',
            color: 'white'
          }}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <TrendingUpIcon />
            <Typography variant="h6" fontWeight={600} sx={{ color: '#FFFFFF', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
              Hành động nhanh
            </Typography>
          </Box>
        </Box>
        <Box sx={{ p: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<SchoolIcon />}
                onClick={() => navigate('/teacher/classrooms')}
                sx={{ 
                  py: 1.5,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #D94A4A 0%, #EF5B5B 100%)',
                  }
                }}
              >
                Quản lý lớp
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/teacher/classrooms')}
                sx={{ 
                  py: 1.5,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #AED6E6 0%, #87CEEB 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #9BC4E6 0%, #7BB3E6 100%)',
                  }
                }}
              >
                Tạo lớp mới
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<PublicIcon />}
                onClick={() => navigate('/teacher/courses')}
                sx={{ 
                  py: 1.5,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #FF7B7B 0%, #EF5B5B 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #EF5B5B 0%, #D94A4A 100%)',
                  }
                }}
              >
                Quản lý môn học
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<VisibilityIcon />}
                onClick={() => navigate('/teacher/courses/public')}
                sx={{ 
                  py: 1.5,
                  borderRadius: 2,
                  borderColor: '#EF5B5B',
                  color: '#EF5B5B',
                  '&:hover': {
                    borderColor: '#D94A4A',
                    color: '#D94A4A',
                    bgcolor: 'rgba(239, 91, 91, 0.1)',
                  }
                }}
              >
                Xem tất cả môn công khai
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Content Sections */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={6}>
          <Paper 
            elevation={2} 
            sx={{ 
              borderRadius: 3,
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Box 
              sx={{ 
                p: 2, 
                background: 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
                color: 'white'
              }}
            >
              <Box display="flex" alignItems="center" gap={1}>
                <SchoolIcon />
                <Typography variant="h6" fontWeight={600} sx={{ color: '#FFFFFF', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                  Lớp gần đây
                </Typography>
              </Box>
            </Box>
            <Box sx={{ p: 2 }}>
              <Stack spacing={2}>
                {recentClasses.map((c) => (
                  <Paper 
                    key={c._id} 
                    elevation={1} 
                    sx={{ 
                      p: 2, 
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      '&:hover': {
                        boxShadow: 2,
                        transform: 'translateY(-2px)',
                        transition: 'all 0.2s ease-in-out'
                      }
                    }}
                  >
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box flex={1}>
                        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 0.5 }}>
                          {c.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {c.teacherNames ? `Giảng viên: ${c.teacherNames}` : ''}
                          {c.courseId?.title ? ` • Khóa: ${c.courseId.title}` : ''}
                        </Typography>
                        <Stack direction="row" spacing={1}>
                          <Chip size="small" label={`${Math.max(0, c.studentsCount || 0)} học sinh`} sx={{ borderColor: '#EF5B5B', color: '#EF5B5B' }} variant="outlined" />
                          <Chip size="small" label={`${c.assignmentsCount || 0} bài tập`} sx={{ borderColor: '#AED6E6', color: '#AED6E6' }} variant="outlined" />
                        </Stack>
                      </Box>
                      <Stack direction="row" spacing={1} sx={{ ml: 2 }}>
                        <Tooltip title="Xem bài giảng">
                          <IconButton 
                            size="small" 
                            onClick={() => navigate(`/teacher/classrooms/${c._id}/lessons`)}
                            sx={{ bgcolor: '#EF5B5B', color: 'white', '&:hover': { bgcolor: '#D94A4A' } }}
                          >
                            <SchoolIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Xem bài tập">
                          <IconButton 
                            size="small" 
                            onClick={() => navigate(`/teacher/classrooms/${c._id}/assignments`)}
                            sx={{ bgcolor: 'secondary.main', color: 'white', '&:hover': { bgcolor: 'secondary.dark' } }}
                          >
                            <AssignmentIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Box>
                  </Paper>
                ))}
                {recentClasses.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <SchoolIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="body2" color="text.secondary">
                      Chưa có lớp nào. Hãy tạo lớp học đầu tiên!
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Paper 
            elevation={2} 
            sx={{ 
              borderRadius: 3,
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Box 
              sx={{ 
                p: 2, 
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                color: 'white'
              }}
            >
              <Box display="flex" alignItems="center" gap={1}>
                <PublicIcon />
                <Typography variant="h6" fontWeight={600} sx={{ color: '#FFFFFF', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                  Môn học công khai
                </Typography>
              </Box>
            </Box>
            <Box sx={{ p: 2 }}>
              <Stack spacing={2}>
                {publicCourses.map((c) => (
                  <Paper 
                    key={c._id} 
                    elevation={1} 
                    sx={{ 
                      p: 2, 
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      '&:hover': {
                        boxShadow: 2,
                        transform: 'translateY(-2px)',
                        transition: 'all 0.2s ease-in-out'
                      }
                    }}
                  >
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box flex={1}>
                        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 0.5 }}>
                          {c.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {c.description}
                        </Typography>
                        <Stack direction="row" spacing={1}>
                          {c.category && <Chip size="small" label={c.category} sx={{ borderColor: '#EF5B5B', color: '#EF5B5B' }} variant="outlined" />}
                          {c.level && <Chip size="small" label={c.level} sx={{ borderColor: '#AED6E6', color: '#AED6E6' }} variant="outlined" />}
                        </Stack>
                      </Box>
                      <Tooltip title="Xem chi tiết">
                        <IconButton 
                          size="small" 
                          onClick={() => navigate(`/courses/${c._id}`)}
                          sx={{ bgcolor: 'info.main', color: 'white', '&:hover': { bgcolor: 'info.dark' } }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Paper>
                ))}
                {publicCourses.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <PublicIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="body2" color="text.secondary">
                      Chưa có môn học công khai nào.
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}


