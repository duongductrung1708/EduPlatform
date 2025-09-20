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
  IconButton,
  Tooltip,
  Rating,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  LinearProgress,
  Alert
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DescriptionIcon from '@mui/icons-material/Description';
import QuizIcon from '@mui/icons-material/Quiz';
import AssignmentIcon from '@mui/icons-material/Assignment';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import StarIcon from '@mui/icons-material/Star';
import PeopleIcon from '@mui/icons-material/People';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { coursesApi, CourseItem } from '../api/courses';
import { progressApi } from '../api/progress';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { SkeletonGrid } from '../components/LoadingSkeleton';

interface Module {
  _id: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
}

interface Lesson {
  _id: string;
  title: string;
  description: string;
  type: 'document' | 'video' | 'interactive' | 'quiz' | 'assignment';
  order: number;
  estimatedDuration?: number;
  isCompleted?: boolean;
}

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<CourseItem | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [enrolled, setEnrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [userLoaded, setUserLoaded] = useState(false);

  useEffect(() => {
    if (id) {
      loadCourseDetails();
    }
  }, [id]);

  // Reload enrollment status when user changes
  useEffect(() => {
    if (id && user) {
      setUserLoaded(true);
      checkEnrollmentStatus();
    } else if (user === null) {
      setUserLoaded(true);
    }
  }, [user, id]);

  const checkEnrollmentStatus = async () => {
    if (!id || !user) return;
    try {
      console.log('Checking enrollment status for course:', id, 'user:', user._id);
      const enrollmentStatus = await coursesApi.checkEnrollment(id);
      console.log('Enrollment status:', enrollmentStatus);
      setEnrolled(enrollmentStatus.enrolled);
      setProgress(enrollmentStatus.progress);
    } catch (error) {
      console.log('Enrollment check failed:', error);
      setEnrolled(false);
      setProgress(0);
    }
  };

  const loadCourseDetails = async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const courseData = await coursesApi.getById(id!);
      setCourse(courseData);
      
      // Load modules and lessons
      const modulesData = await coursesApi.getModules(id!);
      const modulesWithLessons = await Promise.all(
        (modulesData || []).map(async (m: any) => {
          try {
            const lessons = await coursesApi.getLessons(m._id);
            return { ...m, lessons: lessons || [] };
          } catch {
            return { ...m, lessons: [] };
          }
        })
      );
      setModules(modulesWithLessons);
      
      // Check enrollment status for authenticated users
      if (user) {
        try {
          const enrollmentStatus = await coursesApi.checkEnrollment(id!);
          setEnrolled(enrollmentStatus.enrolled);
          setProgress(enrollmentStatus.progress);
        } catch (error) {
          console.log('Enrollment check failed:', error);
          // If check fails, assume not enrolled
          setEnrolled(false);
          setProgress(0);
        }
      }
      
    } catch (error) {
      console.error('Failed to load course details:', error);
      setError('Không thể tải thông tin khóa học');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    try {
      console.log('Enrolling in course:', id);
      await coursesApi.enroll(id!);
      console.log('Enrollment successful');
      setEnrolled(true);
      // refresh enrollment status
      const status = await coursesApi.checkEnrollment(id!);
      console.log('Updated enrollment status:', status);
      setProgress(status.progress);
    } catch (error) {
      console.error('Failed to enroll:', error);
      setError('Không thể đăng ký khóa học');
    }
  };

  const getLessonIcon = (type: string) => {
    switch (type) {
      case 'document': return <DescriptionIcon />;
      case 'video': return <VideoLibraryIcon />;
        case 'interactive': return <TouchAppIcon />;
      case 'quiz': return <QuizIcon />;
      case 'assignment': return <AssignmentIcon />;
      default: return <SchoolIcon />;
    }
  };

  const getLessonTypeLabel = (type: string) => {
    switch (type) {
      case 'document': return 'Tài liệu';
      case 'video': return 'Video';
      case 'interactive': return 'Tương tác';
      case 'quiz': return 'Quiz';
      case 'assignment': return 'Bài tập';
      default: return 'Nội dung';
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <SkeletonGrid count={1} columns={{ xs: 12 }} showAvatar={true} showChips={true} showButton={true} />
      </Box>
    );
  }

  if (error || !course) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || 'Khóa học không tồn tại'}</Alert>
      </Box>
    );
  }

  // Debug logging
  console.log('CourseDetailPage render - user:', user, 'enrolled:', enrolled, 'progress:', progress);

  return (
    <Box sx={{ p: 3 }}>
      {/* Course Header */}
      <Paper elevation={3} sx={{ p: 4, mb: 4, borderRadius: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Stack spacing={2}>
              <Typography variant="h4" fontWeight={700} sx={{ 
                background: 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
                backgroundClip: 'text', 
                WebkitBackgroundClip: 'text', 
                WebkitTextFillColor: 'transparent'
              }}>
                {course.title}
              </Typography>
              
              <Typography variant="body1" color="text.secondary">
                {course.description}
              </Typography>

              <Stack direction="row" spacing={1} flexWrap="wrap">
                {course.category && (
                  <Chip 
                    label={course.category} 
                    variant="outlined" 
                    sx={{ borderColor: '#EF5B5B', color: '#EF5B5B' }}
                  />
                )}
                {course.level && (
                  <Chip 
                    label={course.level} 
                    variant="outlined" 
                    sx={{ borderColor: '#AED6E6', color: '#AED6E6' }}
                  />
                )}
                <Chip 
                  label={course.visibility === 'public' ? 'Công khai' : 'Riêng tư'} 
                  variant="outlined" 
                  sx={{ 
                    borderColor: course.visibility === 'public' ? '#4CAF50' : '#FF9800',
                    color: course.visibility === 'public' ? '#4CAF50' : '#FF9800'
                  }}
                />
              </Stack>

              <Stack direction="row" spacing={3} alignItems="center">
                <Stack direction="row" spacing={1} alignItems="center">
                  <Rating value={course.averageRating || 0} readOnly size="small" />
                  <Typography variant="body2" color="text.secondary">
                    ({course.totalRatings || 0} đánh giá)
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <PeopleIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {course.enrollmentCount || 0} học viên
                  </Typography>
                </Stack>
                {course.estimatedDuration && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <AccessTimeIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {course.estimatedDuration} phút
                    </Typography>
                  </Stack>
                )}
              </Stack>

              {course.createdBy && (
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ bgcolor: '#EF5B5B' }}>
                    {course.createdBy.name.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600}>
                      Giáo viên: {course.createdBy.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {course.createdBy.email}
                    </Typography>
                  </Box>
                </Stack>
              )}
            </Stack>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 3, border: '2px solid', borderColor: 'divider' }}>
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                {user?.role === 'teacher' && course.createdBy?._id === user?._id ? (
                  <Stack spacing={2}>
                    <Typography variant="h6" fontWeight={600} color="#EF5B5B">
                      Môn học của bạn
                    </Typography>
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<PlayArrowIcon />}
                      onClick={() => navigate(`/teacher/courses/${id}/manage`)}
                      sx={{ 
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #D94A4A 0%, #EF5B5B 100%)',
                        }
                      }}
                    >
                      Quản lý nội dung
                    </Button>
                  </Stack>
                ) : userLoaded && enrolled ? (
                  <Stack spacing={2}>
                    <Typography variant="h6" fontWeight={600} color="success.main">
                      Đã đăng ký
                    </Typography>
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Tiến độ học tập
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={progress} 
                        sx={{ height: 8, borderRadius: 4, mb: 1 }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {progress}% hoàn thành
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<PlayArrowIcon />}
                      onClick={() => navigate(`/courses/${id}/learn`)}
                      sx={{ 
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #D94A4A 0%, #EF5B5B 100%)',
                        }
                      }}
                    >
                      Tiếp tục học
                    </Button>
                  </Stack>
                ) : userLoaded && !enrolled ? (
                  <Stack spacing={2}>
                    <Typography variant="h6" fontWeight={600}>
                      Tham gia môn học
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Bắt đầu hành trình học tập của bạn
                    </Typography>
                    <Button
                      variant="contained"
                      fullWidth
                      size="large"
                      onClick={handleEnroll}
                      sx={{ 
                        borderRadius: 2,
                        py: 1.5,
                        background: 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #D94A4A 0%, #EF5B5B 100%)',
                        }
                      }}
                    >
                      Đăng ký miễn phí
                    </Button>
                  </Stack>
                ) : (
                  <Stack spacing={2}>
                    <Typography variant="h6" fontWeight={600}>
                      Đang tải...
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Vui lòng đợi trong giây lát
                    </Typography>
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Course Content */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{ p: 3, background: 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)', color: 'white' }}>
              <Typography variant="h6" fontWeight={600}>
                📚 Nội dung môn học
              </Typography>
            </Box>
            <Box sx={{ p: 3 }}>
              {modules.length > 0 ? (
                modules.map((module, index) => (
                  <Accordion key={module._id} sx={{ mb: 2, borderRadius: 2 }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
                        <Typography variant="h6" fontWeight={600}>
                          {module.title}
                        </Typography>
                        <Chip 
                          label={`${module.lessons.length} bài học`} 
                          size="small" 
                          variant="outlined" 
                          sx={{ borderColor: '#EF5B5B', color: '#EF5B5B' }}
                        />
                      </Stack>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {module.description}
                      </Typography>
                      <List>
                        {module.lessons.map((lesson) => (
                          <ListItem key={lesson._id} sx={{ px: 0 }}>
                            <ListItemIcon>
                              {lesson.isCompleted ? (
                                <CheckCircleIcon color="success" />
                              ) : (
                                getLessonIcon(lesson.type)
                              )}
                            </ListItemIcon>
                            <ListItemText
                              primary={lesson.title}
                              secondary={
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Chip 
                                    label={getLessonTypeLabel(lesson.type)} 
                                    size="small" 
                                    variant="outlined" 
                                    sx={{ borderColor: '#AED6E6', color: '#AED6E6' }}
                                  />
                                  {lesson.estimatedDuration && (
                                    <Typography variant="caption" color="text.secondary">
                                      {lesson.estimatedDuration} phút
                                    </Typography>
                                  )}
                                </Stack>
                              }
                            />
                            {enrolled && (
                              <Button
                                size="small"
                                startIcon={<PlayArrowIcon />}
                                onClick={() => navigate(`/courses/${id}/lessons/${lesson._id}`)}
                              >
                                Học
                              </Button>
                            )}
                          </ListItem>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                ))
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <SchoolIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    Nội dung môn học đang được cập nhật
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Vui lòng quay lại sau để xem nội dung chi tiết
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            {/* Course Info */}
            <Paper elevation={2} sx={{ borderRadius: 3, overflow: 'hidden' }}>
              <Box sx={{ p: 2, background: 'linear-gradient(135deg, #AED6E6 0%, #87CEEB 100%)', color: 'white' }}>
                <Typography variant="h6" fontWeight={600}>
                  ℹ️ Thông tin môn học
                </Typography>
              </Box>
              <Box sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
                      Môn học
                    </Typography>
                    <Typography variant="body1">{course.category || 'Chưa xác định'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
                      Khối lớp
                    </Typography>
                    <Typography variant="body1">{course.level || 'Chưa xác định'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
                      Độ khó
                    </Typography>
                    <Typography variant="body1">{course.difficulty || 'Trung bình'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
                      Thời lượng
                    </Typography>
                    <Typography variant="body1">
                      {course.estimatedDuration ? `${course.estimatedDuration} phút` : 'Chưa xác định'}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </Paper>

            {/* Learning Objectives */}
            {course.learningObjectives && course.learningObjectives.length > 0 && (
              <Paper elevation={2} sx={{ borderRadius: 3, overflow: 'hidden' }}>
                <Box sx={{ p: 2, background: 'linear-gradient(135deg, #FF7B7B 0%, #EF5B5B 100%)', color: 'white' }}>
                  <Typography variant="h6" fontWeight={600}>
                    🎯 Mục tiêu học tập
                  </Typography>
                </Box>
                <Box sx={{ p: 3 }}>
                  <List>
                    {course.learningObjectives.map((objective, index) => (
                      <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                        <ListItemIcon>
                          <CheckCircleIcon color="success" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={objective} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </Paper>
            )}
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}