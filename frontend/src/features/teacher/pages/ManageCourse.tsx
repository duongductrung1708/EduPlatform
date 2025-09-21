import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  MenuItem,
  Stack,
  Alert,
  Card,
  CardContent,
  Chip,
  IconButton,
  Avatar,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  School as SchoolIcon,
  PlayArrow as PlayArrowIcon,
  Description as DescriptionIcon,
  VideoLibrary as VideoLibraryIcon,
  TouchApp as TouchAppIcon,
  Quiz as QuizIcon,
  Assignment as AssignmentIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  People as PeopleIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { coursesApi } from '../../../api/courses';
import { useSocket } from '../../../hooks/useSocket';
import { useTheme } from '../../../contexts/ThemeContext';
import FileUpload from '../../../components/FileUpload';
import BackButton from '../../../components/BackButton';
import Breadcrumb from '../../../components/Breadcrumb';

export default function ManageCourse() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const courseId = id as string;
  const { joinCourse, leaveCourse, onEnrollmentAdded, onEnrollmentRemoved, offEnrollmentAdded, offEnrollmentRemoved } = useSocket();

  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'students'>('content');

  // Module form state
  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleDescription, setModuleDescription] = useState('');
  const [moduleOrder, setModuleOrder] = useState<number>(0);
  const [moduleVolume, setModuleVolume] = useState('');
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);

  // Lesson form state
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDescription, setLessonDescription] = useState('');
  const [lessonType, setLessonType] = useState<'document'|'video'|'interactive'|'quiz'|'assignment'>('document');
  const [lessonOrder, setLessonOrder] = useState<number>(0);
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [lessonFile, setLessonFile] = useState<{ url: string; fileName: string; fileType: string } | null>(null);

  useEffect(() => {
    if (!courseId) return;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [courseData, mods, enrollmentsData] = await Promise.all([
          coursesApi.getById(courseId),
          coursesApi.getModules(courseId),
          coursesApi.getEnrollments(courseId).catch(() => []), // Don't fail if no enrollments
        ]);
        setCourse(courseData);
        setModules(mods);
        setEnrollments(enrollmentsData);
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Không thể tải thông tin môn học');
      } finally {
        setLoading(false);
      }
    })();
  }, [courseId]);

  useEffect(() => {
    if (!selectedModuleId) { setLessons([]); return; }
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const ls = await coursesApi.getLessons(selectedModuleId);
        setLessons(ls);
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Không thể tải danh sách bài học');
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedModuleId]);

  // Real-time updates for enrollments
  useEffect(() => {
    if (!courseId) return;

    // Join course room for real-time updates
    joinCourse(courseId);

    const handleEnrollmentAdded = (data: { courseId: string; enrollment: any; timestamp: string }) => {
      if (data.courseId === courseId) {
        setEnrollments(prev => [...prev, data.enrollment]);
      }
    };

    const handleEnrollmentRemoved = (data: { courseId: string; studentId: string; timestamp: string }) => {
      if (data.courseId === courseId) {
        setEnrollments(prev => prev.filter(enrollment => enrollment.student._id !== data.studentId));
      }
    };

    onEnrollmentAdded(handleEnrollmentAdded);
    onEnrollmentRemoved(handleEnrollmentRemoved);

    return () => {
      leaveCourse(courseId);
      offEnrollmentAdded(handleEnrollmentAdded);
      offEnrollmentRemoved(handleEnrollmentRemoved);
    };
  }, [courseId, joinCourse, leaveCourse, onEnrollmentAdded, onEnrollmentRemoved, offEnrollmentAdded, offEnrollmentRemoved]);

  const handleCreateModule = async () => {
    if (!moduleTitle.trim() || !moduleDescription.trim()) return;
    try {
      setLoading(true);
      setError(null);
      await coursesApi.createModule(courseId, {
        title: moduleTitle.trim(),
        description: moduleDescription.trim(),
        order: moduleOrder,
        volume: moduleVolume.trim() || undefined,
      });
      const mods = await coursesApi.getModules(courseId);
      setModules(mods);
      setModuleTitle('');
      setModuleDescription('');
      setModuleOrder(0);
      setModuleVolume('');
      setModuleDialogOpen(false);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Không thể tạo module');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLesson = async () => {
    if (!selectedModuleId) { setError('Vui lòng chọn module'); return; }
    if (!lessonTitle.trim() || !lessonDescription.trim()) return;
    try {
      setLoading(true);
      setError(null);
      const content: any = {};
      
      // Add file content if lesson type is document and file is uploaded
      if (lessonType === 'document' && lessonFile) {
        content.fileUrl = lessonFile.url;
        content.fileName = lessonFile.fileName;
        content.fileType = lessonFile.fileType;
      }
      
      await coursesApi.createLesson(selectedModuleId, {
        title: lessonTitle.trim(),
        description: lessonDescription.trim(),
        type: lessonType,
        order: lessonOrder,
        content,
      });
      const ls = await coursesApi.getLessons(selectedModuleId);
      setLessons(ls);
      setLessonTitle('');
      setLessonDescription('');
      setLessonOrder(0);
      setLessonFile(null);
      setLessonDialogOpen(false);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Không thể tạo bài học');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa học sinh này khỏi môn học?')) return;
    try {
      setLoading(true);
      setError(null);
      await coursesApi.removeStudent(courseId, studentId);
      // Refresh enrollments
      const enrollmentsData = await coursesApi.getEnrollments(courseId);
      setEnrollments(enrollmentsData);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Không thể xóa học sinh');
    } finally {
      setLoading(false);
    }
  };

  const refreshEnrollments = async () => {
    try {
      const enrollmentsData = await coursesApi.getEnrollments(courseId);
      setEnrollments(enrollmentsData);
    } catch (e: any) {
      console.error('Failed to refresh enrollments:', e);
    }
  };

  const getLessonIcon = (type: string) => {
    switch (type) {
      case 'document': return <DescriptionIcon />;
      case 'video': return <VideoLibraryIcon />;
      case 'interactive': return <TouchAppIcon />;
      case 'quiz': return <QuizIcon />;
      case 'assignment': return <AssignmentIcon />;
      default: return <PlayArrowIcon />;
    }
  };

  const getLessonColor = (type: string) => {
    switch (type) {
      case 'document': return '#2196F3';
      case 'video': return '#F44336';
      case 'interactive': return '#FF9800';
      case 'quiz': return '#9C27B0';
      case 'assignment': return '#4CAF50';
      default: return '#757575';
    }
  };

  if (loading && !course) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Đang tải thông tin môn học...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Breadcrumb */}
      <Breadcrumb 
        items={[
          { label: 'Trang chủ', path: '/dashboard' },
          { label: 'Giáo viên', path: '/teacher' },
          { label: 'Môn học', path: '/teacher/courses' },
          { label: course?.title || 'Quản lý môn học', current: true }
        ]}
      />
      
      {/* Back Button */}
      <BackButton to="/teacher/courses" />
      
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box display="flex" alignItems="center" gap={2} sx={{ mb: 2 }}>
          <IconButton onClick={() => navigate('/teacher/courses')} sx={{ color: darkMode ? '#FF7B7B' : '#EF5B5B' }}>
            <SchoolIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" sx={{ 
              fontWeight: 700, 
              background: darkMode 
                ? 'linear-gradient(135deg, #FF7B7B 0%, #EF5B5B 100%)'
                : 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)', 
              backgroundClip: 'text', 
              WebkitBackgroundClip: 'text', 
              WebkitTextFillColor: 'transparent' 
            }}>
              Quản lý môn học
            </Typography>
            {course && (
              <Typography variant="h6" color="text.secondary" sx={{ mt: 0.5 }}>
                {course.title}
              </Typography>
            )}
          </Box>
        </Box>
        
        {course && (
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <Chip label={course.category || 'Chưa phân loại'} color="info" size="small" />
            <Chip label={course.level || 'Mọi cấp độ'} color="success" size="small" />
            <Chip label={course.visibility === 'public' ? 'Công khai' : 'Riêng tư'} color={course.visibility === 'public' ? 'primary' : 'default'} size="small" />
            <Chip label={`${Math.max(0, enrollments.length)} học sinh`} color="secondary" size="small" />
          </Stack>
        )}

        {/* Tab Navigation */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Stack direction="row" spacing={0}>
            <Button
              variant={activeTab === 'content' ? 'contained' : 'text'}
              onClick={() => setActiveTab('content')}
              sx={{ 
                borderRadius: 0,
                borderBottom: activeTab === 'content' ? 2 : 0,
                borderColor: darkMode ? '#FF7B7B' : '#EF5B5B',
                minWidth: 120
              }}
            >
              Nội dung
            </Button>
            <Button
              variant={activeTab === 'students' ? 'contained' : 'text'}
              onClick={() => setActiveTab('students')}
              sx={{ 
                borderRadius: 0,
                borderBottom: activeTab === 'students' ? 2 : 0,
                borderColor: darkMode ? '#FF7B7B' : '#EF5B5B',
                minWidth: 120
              }}
            >
              Học sinh ({enrollments.length})
            </Button>
          </Stack>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>
      )}

      {/* Content Tab */}
      {activeTab === 'content' && (
        <>
          {/* Modules Section */}
      <Card sx={{ mb: 4, borderRadius: 3, overflow: 'hidden' }}>
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
            <Typography variant="h5" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FolderIcon color="primary" />
              Modules ({modules.length})
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setModuleDialogOpen(true)}
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
              Thêm Module
            </Button>
          </Box>

          {modules.length > 0 ? (
            <Grid container spacing={2}>
              {modules.map((module) => (
                <Grid item xs={12} md={6} lg={4} key={module._id}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      border: selectedModuleId === module._id ? '2px solid' : '1px solid',
                      borderColor: selectedModuleId === module._id ? (darkMode ? '#FF7B7B' : '#EF5B5B') : 'divider',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 4,
                      }
                    }}
                    onClick={() => setSelectedModuleId(module._id)}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: selectedModuleId === module._id ? (darkMode ? '#FF7B7B' : '#EF5B5B') : 'action.hover' }}>
                          {selectedModuleId === module._id ? <FolderOpenIcon /> : <FolderIcon />}
                        </Avatar>
                        <Box flex={1}>
                          <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>
                            {module.order}. {module.title}
                            {module.volume && (
                              <Chip 
                                label={module.volume} 
                                size="small" 
                                color="primary" 
                                variant="outlined" 
                                sx={{ ml: 1, fontSize: '0.75rem' }}
                              />
                            )}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {module.description}
                          </Typography>
                          {module.estimatedDuration && (
                            <Chip label={`${module.estimatedDuration} phút`} size="small" variant="outlined" />
                          )}
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Paper 
              elevation={0} 
              sx={{ 
                p: 4, 
                textAlign: 'center', 
                border: '2px dashed',
                borderColor: 'divider',
                borderRadius: 2
              }}
            >
              <FolderIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                Chưa có module nào
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Tạo module đầu tiên để bắt đầu xây dựng nội dung môn học
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setModuleDialogOpen(true)}
                sx={{ borderRadius: 2 }}
              >
                Tạo Module
              </Button>
            </Paper>
          )}
        </CardContent>
      </Card>

      {/* Lessons Section */}
      {selectedModuleId && (
        <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <CardContent sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
              <Typography variant="h5" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PlayArrowIcon color="secondary" />
                Bài học ({lessons.length})
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setLessonDialogOpen(true)}
                sx={{ 
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #AED6E6 0%, #87CEEB 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #9BC4E6 0%, #7BB3E6 100%)',
                  }
                }}
              >
                Thêm Bài học
              </Button>
            </Box>

            {lessons.length > 0 ? (
              <Grid container spacing={2}>
                {lessons.map((lesson) => (
                  <Grid item xs={12} sm={6} md={4} key={lesson._id}>
                    <Card 
                      sx={{ 
                        border: '1px solid',
                        borderColor: 'divider',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: 4,
                        }
                      }}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar sx={{ bgcolor: getLessonColor(lesson.type), width: 40, height: 40 }}>
                            {getLessonIcon(lesson.type)}
                          </Avatar>
                          <Box flex={1}>
                            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 0.5 }}>
                              {lesson.order}. {lesson.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {lesson.description}
                            </Typography>
                            {lesson.type === 'document' && lesson.content?.fileUrl && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Chip 
                                  icon={<FileIcon />}
                                  label={lesson.content.fileName || 'Tài liệu đính kèm'} 
                                  size="small" 
                                  color="primary" 
                                  variant="outlined"
                                  clickable
                                  onClick={() => window.open(lesson.content.fileUrl, '_blank')}
                                  sx={{
                                    '&:hover': {
                                      backgroundColor: 'primary.main',
                                      color: 'white',
                                      transform: 'scale(1.05)',
                                    },
                                    transition: 'all 0.3s ease',
                                    fontWeight: 500,
                                    maxWidth: '200px',
                                    '& .MuiChip-label': {
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                    },
                                  }}
                                  title={lesson.content.fileName || 'Tài liệu đính kèm'}
                                />
                                <Chip 
                                  label="Click để xem" 
                                  size="small" 
                                  color="success" 
                                  variant="filled"
                                  sx={{ fontSize: '0.7rem' }}
                                />
                              </Box>
                            )}
                            <Chip 
                              label={lesson.type} 
                              size="small" 
                              sx={{ 
                                bgcolor: getLessonColor(lesson.type),
                                color: 'white',
                                fontSize: '0.7rem'
                              }}
                            />
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 4, 
                  textAlign: 'center', 
                  border: '2px dashed',
                  borderColor: 'divider',
                  borderRadius: 2
                }}
              >
                <PlayArrowIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                  Chưa có bài học nào
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Thêm bài học đầu tiên vào module này
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setLessonDialogOpen(true)}
                  sx={{ borderRadius: 2 }}
                >
                  Thêm Bài học
                </Button>
              </Paper>
            )}
          </CardContent>
        </Card>
      )}

      {/* Module Dialog */}
      <Dialog open={moduleDialogOpen} onClose={() => setModuleDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Tạo Module Mới</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField 
              label="Tiêu đề module" 
              value={moduleTitle} 
              onChange={(e) => setModuleTitle(e.target.value)} 
              fullWidth 
              required
            />
            <TextField 
              label="Mô tả" 
              value={moduleDescription} 
              onChange={(e) => setModuleDescription(e.target.value)} 
              fullWidth 
              multiline 
              rows={3}
              required
            />
            <TextField 
              label="Thứ tự" 
              type="number" 
              value={moduleOrder} 
              onChange={(e) => setModuleOrder(parseInt(e.target.value || '0', 10))} 
              fullWidth 
            />
            <TextField 
              label="Tập (Volume)" 
              value={moduleVolume} 
              onChange={(e) => setModuleVolume(e.target.value)} 
              fullWidth 
              placeholder="Ví dụ: Tập 1, Tập 2, Phần A, Phần B..."
              helperText="Tùy chọn: Chia module thành các tập hoặc phần"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModuleDialogOpen(false)}>Hủy</Button>
          <Button 
            variant="contained" 
            onClick={handleCreateModule} 
            disabled={loading || !moduleTitle.trim() || !moduleDescription.trim()}
            sx={{ borderRadius: 2 }}
          >
            {loading ? <CircularProgress size={20} /> : 'Tạo Module'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Lesson Dialog */}
      <Dialog open={lessonDialogOpen} onClose={() => setLessonDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Thêm Bài học Mới</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField 
              label="Tiêu đề bài học" 
              value={lessonTitle} 
              onChange={(e) => setLessonTitle(e.target.value)} 
              fullWidth 
              required
            />
            <TextField 
              label="Mô tả" 
              value={lessonDescription} 
              onChange={(e) => setLessonDescription(e.target.value)} 
              fullWidth 
              multiline 
              rows={3}
              required
            />
            <TextField 
              select 
              label="Loại bài học" 
              value={lessonType} 
              onChange={(e) => setLessonType(e.target.value as any)} 
              fullWidth
            >
              <MenuItem value="document">📄 Tài liệu</MenuItem>
              <MenuItem value="video">🎥 Video</MenuItem>
              <MenuItem value="interactive">🎮 Tương tác</MenuItem>
              <MenuItem value="quiz">❓ Quiz</MenuItem>
              <MenuItem value="assignment">📝 Bài tập</MenuItem>
            </TextField>
            <TextField 
              label="Thứ tự" 
              type="number" 
              value={lessonOrder} 
              onChange={(e) => setLessonOrder(parseInt(e.target.value || '0', 10))} 
              fullWidth 
            />
            
            {/* File Upload for Document Type */}
            {lessonType === 'document' && (
              <Box sx={{ mt: 2 }}>
                <Paper 
                  elevation={1} 
                  sx={{ 
                    p: 2, 
                    borderRadius: 2, 
                    backgroundColor: 'primary.50',
                    border: '1px solid',
                    borderColor: 'primary.200',
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                    <FileIcon color="primary" />
                    <Typography variant="h6" fontWeight={600} color="primary.main">
                      Upload tài liệu
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Chọn file tài liệu để đính kèm với bài học. Hỗ trợ PDF, Word, Excel, PowerPoint và Text.
                  </Typography>
                  <FileUpload
                    onFileUploaded={(fileData) => setLessonFile(fileData)}
                    onFileRemoved={() => setLessonFile(null)}
                    acceptedTypes={[
                      'application/pdf',
                      'application/msword',
                      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                      'text/plain',
                      'application/vnd.ms-excel',
                      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                      'application/vnd.ms-powerpoint',
                      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
                    ]}
                    maxSize={20} // 20MB
                    folder="lessons"
                    disabled={loading}
                  />
                </Paper>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLessonDialogOpen(false)}>Hủy</Button>
          <Button 
            variant="contained" 
            onClick={handleCreateLesson} 
            disabled={
              loading || 
              !lessonTitle.trim() || 
              !lessonDescription.trim() ||
              (lessonType === 'document' && !lessonFile)
            }
            sx={{ borderRadius: 2 }}
          >
            {loading ? <CircularProgress size={20} /> : 'Thêm Bài học'}
          </Button>
        </DialogActions>
      </Dialog>

          {/* Floating Action Button */}
          <Fab
            color="primary"
            aria-label="add"
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              background: darkMode 
                ? 'linear-gradient(135deg, #FF7B7B 0%, #EF5B5B 100%)'
                : 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #D94A4A 0%, #EF5B5B 100%)',
                transform: 'scale(1.1)'
              },
              transition: 'all 0.3s ease'
            }}
            onClick={() => setModuleDialogOpen(true)}
          >
            <AddIcon />
          </Fab>
        </>
      )}

      {/* Students Tab */}
      {activeTab === 'students' && (
        <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <CardContent sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
              <Typography variant="h5" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PeopleIcon color="primary" />
                Danh sách học sinh ({enrollments.length})
              </Typography>
              <Button
                variant="outlined"
                onClick={refreshEnrollments}
                disabled={loading}
                sx={{ borderRadius: 2 }}
              >
                Làm mới
              </Button>
            </Box>

            {enrollments.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <PeopleIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Chưa có học sinh nào đăng ký
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Học sinh sẽ xuất hiện ở đây khi họ đăng ký môn học
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {enrollments.map((enrollment) => (
                  <Grid item xs={12} sm={6} md={4} key={enrollment._id}>
                    <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                      <CardContent>
                        <Box display="flex" alignItems="center" gap={2} sx={{ mb: 2 }}>
                          <Avatar sx={{ bgcolor: darkMode ? '#FF7B7B' : '#EF5B5B' }}>
                            {enrollment.student?.name?.charAt(0) || enrollment.student?.email?.charAt(0) || 'U'}
                          </Avatar>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle1" fontWeight={600}>
                              {enrollment.student?.name || 'Chưa có tên'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {enrollment.student?.email}
                            </Typography>
                          </Box>
                          <IconButton
                            color="error"
                            onClick={() => handleRemoveStudent(enrollment.student._id)}
                            disabled={loading}
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                        
                        <Stack spacing={1}>
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2" color="text.secondary">
                              Tiến độ:
                            </Typography>
                            <Typography variant="body2" fontWeight={600}>
                              {enrollment.progress}%
                            </Typography>
                          </Box>
                          
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2" color="text.secondary">
                              Đăng ký:
                            </Typography>
                            <Typography variant="body2">
                              {new Date(enrollment.enrolledAt).toLocaleDateString('vi-VN')}
                            </Typography>
                          </Box>

                          {enrollment.lastAccessedAt && (
                            <Box display="flex" justifyContent="space-between">
                              <Typography variant="body2" color="text.secondary">
                                Truy cập cuối:
                              </Typography>
                              <Typography variant="body2">
                                {new Date(enrollment.lastAccessedAt).toLocaleDateString('vi-VN')}
                              </Typography>
                            </Box>
                          )}

                          {enrollment.rating && (
                            <Box display="flex" justifyContent="space-between">
                              <Typography variant="body2" color="text.secondary">
                                Đánh giá:
                              </Typography>
                              <Typography variant="body2" fontWeight={600}>
                                ⭐ {enrollment.rating}/5
                              </Typography>
                            </Box>
                          )}
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
