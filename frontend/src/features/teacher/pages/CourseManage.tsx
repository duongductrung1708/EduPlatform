import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  Stack, 
  IconButton, 
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Divider,
  Paper
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import DescriptionIcon from '@mui/icons-material/Description';
import QuizIcon from '@mui/icons-material/Quiz';
import AssignmentIcon from '@mui/icons-material/Assignment';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import { coursesApi } from '../../../api/courses';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContext';
import ConfirmDialog from '../../../components/ConfirmDialog';

interface Module {
  _id: string;
  title: string;
  description: string;
  order: number;
  estimatedDuration?: number;
  isPublished: boolean;
  lessons?: Lesson[];
}

interface Lesson {
  _id: string;
  title: string;
  description: string;
  type: 'document' | 'video' | 'interactive' | 'quiz' | 'assignment';
  order: number;
  estimatedDuration?: number;
  isPublished: boolean;
}

const LESSON_TYPES = [
  { value: 'document', label: 'Tài liệu', icon: <DescriptionIcon /> },
  { value: 'video', label: 'Video', icon: <VideoLibraryIcon /> },
  { value: 'interactive', label: 'Tương tác', icon: <TouchAppIcon /> },
  { value: 'quiz', label: 'Quiz', icon: <QuizIcon /> },
  { value: 'assignment', label: 'Bài tập', icon: <AssignmentIcon /> },
];

export default function CourseManage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  
  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Module dialog states
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [moduleForm, setModuleForm] = useState({
    title: '',
    description: '',
    order: 0,
    estimatedDuration: 0,
    isPublished: true
  });
  
  // Lesson dialog states
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  
  // Course dialog states
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    category: '',
    level: '',
    tags: [] as string[],
    visibility: 'public',
    status: 'published'
  });
  const [selectedModuleId, setSelectedModuleId] = useState<string>('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'module' | 'lesson';
    moduleId?: string;
    lessonId?: string;
    title: string;
  } | null>(null);
  const [lessonForm, setLessonForm] = useState({
    title: '',
    description: '',
    type: 'document' as const,
    order: 0,
    estimatedDuration: 0,
    isPublished: true
  });

  useEffect(() => {
    if (courseId) {
      loadCourseData();
    }
  }, [courseId]);

  // Debug effect to track course state changes
  useEffect(() => {
    console.log('🔄 Course state changed:', course);
  }, [course]);

  const loadCourseData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Loading course data for courseId:', courseId);
      
      const [courseRes, modulesRes] = await Promise.all([
        coursesApi.getById(courseId!),
        coursesApi.getModules(courseId!)
      ]);
      
      console.log('📚 Course data loaded:', courseRes);
      console.log('📖 Modules data loaded:', modulesRes);
      
      if (!courseRes) {
        throw new Error('Course not found');
      }
      
      if (!modulesRes || modulesRes.length === 0) {
        console.log('⚠️ No modules found, setting empty modules array');
        setModules([]);
        setCourse(courseRes);
        return;
      }
      
      // Force new object reference to ensure React re-renders
      setCourse({ ...courseRes });
      console.log('✅ Course state updated:', courseRes.title);
      console.log('🔍 Course object details:', {
        id: courseRes._id,
        title: courseRes.title,
        description: courseRes.description,
        category: courseRes.category,
        level: courseRes.level,
        status: courseRes.status
      });
      
      // Load lessons for each module
      const modulesWithLessons = await Promise.all(
        (modulesRes || []).map(async (module) => {
          try {
            const lessons = await coursesApi.getLessons(module._id);
            return { ...module, lessons };
          } catch (err) {
            console.error(`Error loading lessons for module ${module._id}:`, err);
            return { ...module, lessons: [] };
          }
        })
      );
      
      setModules(modulesWithLessons);
      console.log('✅ Modules with lessons updated:', modulesWithLessons.length, 'modules');
    } catch (err) {
      console.error('❌ Error loading course data:', err);
      setError('Không thể tải dữ liệu môn học');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateModule = async () => {
    try {
      await coursesApi.createModule(courseId!, moduleForm);
      setModuleDialogOpen(false);
      resetModuleForm();
      loadCourseData();
    } catch (err) {
      console.error('Error creating module:', err);
      setError('Không thể tạo module');
    }
  };

  const handleUpdateModule = async () => {
    try {
      await coursesApi.updateModule(courseId!, editingModule!._id, moduleForm);
      setModuleDialogOpen(false);
      setEditingModule(null);
      resetModuleForm();
      loadCourseData();
    } catch (err) {
      console.error('Error updating module:', err);
      setError('Không thể cập nhật module');
    }
  };

  const handleDeleteModule = (moduleId: string, moduleTitle: string) => {
    setConfirmAction({
      type: 'module',
      moduleId,
      title: moduleTitle
    });
    setConfirmDialogOpen(true);
  };

  const confirmDeleteModule = async () => {
    if (!confirmAction || confirmAction.type !== 'module' || !confirmAction.moduleId) return;

    try {
      await coursesApi.deleteModule(courseId!, confirmAction.moduleId);
      setConfirmDialogOpen(false);
      setConfirmAction(null);
      loadCourseData();
    } catch (err) {
      console.error('Error deleting module:', err);
      setError('Không thể xóa module');
    }
  };

  const handleCreateLesson = async () => {
    try {
      await coursesApi.createLesson(selectedModuleId, lessonForm);
      setLessonDialogOpen(false);
      resetLessonForm();
      loadCourseData();
    } catch (err) {
      console.error('Error creating lesson:', err);
      setError('Không thể tạo bài học');
    }
  };

  const handleUpdateLesson = async () => {
    try {
      await coursesApi.updateLesson(selectedModuleId, editingLesson!._id, lessonForm);
      setLessonDialogOpen(false);
      setEditingLesson(null);
      resetLessonForm();
      loadCourseData();
    } catch (err) {
      console.error('Error updating lesson:', err);
      setError('Không thể cập nhật bài học');
    }
  };

  const handleDeleteLesson = (moduleId: string, lessonId: string, lessonTitle: string) => {
    setConfirmAction({
      type: 'lesson',
      moduleId,
      lessonId,
      title: lessonTitle
    });
    setConfirmDialogOpen(true);
  };

  const confirmDeleteLesson = async () => {
    if (!confirmAction || confirmAction.type !== 'lesson' || !confirmAction.moduleId || !confirmAction.lessonId) return;

    try {
      await coursesApi.deleteLesson(confirmAction.moduleId, confirmAction.lessonId);
      setConfirmDialogOpen(false);
      setConfirmAction(null);
      loadCourseData();
    } catch (err) {
      console.error('Error deleting lesson:', err);
      setError('Không thể xóa bài học');
    }
  };

  const resetModuleForm = () => {
    setModuleForm({
      title: '',
      description: '',
      order: 0,
      estimatedDuration: 0,
      isPublished: true
    });
  };

  const resetLessonForm = () => {
    setLessonForm({
      title: '',
      description: '',
      type: 'document',
      order: 0,
      estimatedDuration: 0,
      isPublished: true
    });
  };

  const resetCourseForm = () => {
    setCourseForm({
      title: '',
      description: '',
      category: '',
      level: '',
      tags: [],
      visibility: 'public',
      status: 'published'
    });
  };

  const openModuleDialog = (module?: Module) => {
    if (module) {
      setEditingModule(module);
      setModuleForm({
        title: module.title,
        description: module.description,
        order: module.order,
        estimatedDuration: module.estimatedDuration || 0,
        isPublished: module.isPublished
      });
    } else {
      setEditingModule(null);
      resetModuleForm();
    }
    setModuleDialogOpen(true);
  };

  const openLessonDialog = (moduleId: string, lesson?: Lesson) => {
    setSelectedModuleId(moduleId);
    if (lesson) {
      setEditingLesson(lesson);
      setLessonForm({
        title: lesson.title,
        description: lesson.description,
        type: lesson.type,
        order: lesson.order,
        estimatedDuration: lesson.estimatedDuration || 0,
        isPublished: lesson.isPublished
      });
    } else {
      setEditingLesson(null);
      resetLessonForm();
    }
    setLessonDialogOpen(true);
  };

  const openCourseDialog = (course?: any) => {
    if (course) {
      setEditingCourse(course);
      setCourseForm({
        title: course.title,
        description: course.description,
        category: course.category,
        level: course.level,
        tags: course.tags || [],
        visibility: course.visibility,
        status: course.status
      });
    } else {
      setEditingCourse(null);
      resetCourseForm();
    }
    setCourseDialogOpen(true);
  };

  const getLessonTypeIcon = (type: string) => {
    const lessonType = LESSON_TYPES.find(t => t.value === type);
    return lessonType?.icon || <DescriptionIcon />;
  };

  const getLessonTypeLabel = (type: string) => {
    const lessonType = LESSON_TYPES.find(t => t.value === type);
    return lessonType?.label || 'Tài liệu';
  };

  const handleModuleSubmit = async () => {
    try {
      if (editingModule) {
        await coursesApi.updateModule(courseId!, editingModule._id, moduleForm);
      } else {
        await coursesApi.createModule(courseId!, moduleForm);
      }
      setModuleDialogOpen(false);
      setEditingModule(null);
      resetModuleForm();
      loadCourseData();
    } catch (err) {
      console.error('Error saving module:', err);
    }
  };

  const handleLessonSubmit = async () => {
    try {
      if (editingLesson) {
        await coursesApi.updateLesson(selectedModuleId, editingLesson._id, lessonForm);
      } else {
        await coursesApi.createLesson(selectedModuleId, lessonForm);
      }
      setLessonDialogOpen(false);
      setEditingLesson(null);
      resetLessonForm();
      loadCourseData();
    } catch (err) {
      console.error('Error saving lesson:', err);
    }
  };

  const handleCourseSubmit = async () => {
    try {
      if (editingCourse) {
        console.log('🔄 Updating course with data:', courseForm);
        const updatedCourse = await coursesApi.update(courseId!, courseForm);
        console.log('✅ Course updated successfully:', updatedCourse);
      }
      setCourseDialogOpen(false);
      setEditingCourse(null);
      resetCourseForm();
      console.log('🔄 Reloading course data...');
      setRefreshKey(prev => prev + 1);
      loadCourseData();
    } catch (err) {
      console.error('❌ Error saving course:', err);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 3, background: 'linear-gradient(45deg, #EF5B5B, #FF7B7B)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Đang tải...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button onClick={() => navigate('/teacher/courses')} variant="contained">
          Quay lại
        </Button>
      </Box>
    );
  }

  // Debug log for course state
  console.log('🎨 Rendering with course state:', course);
  console.log('🎨 Course title in render:', course?.title);
  console.log('🎨 Course description in render:', course?.description);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Typography 
              key={`title-${course?._id}-${refreshKey}`} 
              variant="h4" 
              sx={{ 
                background: 'linear-gradient(45deg, #EF5B5B, #FF7B7B)', 
                WebkitBackgroundClip: 'text', 
                WebkitTextFillColor: 'transparent'
              }}
            >
              Quản lý nội dung: {course?.title}
            </Typography>
            <Tooltip title="Chỉnh sửa môn học">
              <IconButton 
                onClick={() => openCourseDialog(course)}
                size="small"
                sx={{ 
                  bgcolor: '#EF5B5B', 
                  color: 'white',
                  '&:hover': { bgcolor: '#D94A4A' }
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          <Typography 
            key={`desc-${course?._id}-${refreshKey}`}
            variant="body1" 
            color="text.secondary"
          >
            {course?.description}
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => openModuleDialog()}
          sx={{ 
            background: 'linear-gradient(45deg, #EF5B5B, #FF7B7B)',
            '&:hover': { background: 'linear-gradient(45deg, #D94A4A, #EF5B5B)' }
          }}
        >
          Thêm Module
        </Button>
      </Box>

      {/* Modules List */}
      {modules.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', bgcolor: darkMode ? 'grey.800' : 'grey.50' }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            Chưa có module nào
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Hãy tạo module đầu tiên để bắt đầu xây dựng nội dung môn học
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => openModuleDialog()}
            sx={{ 
              background: 'linear-gradient(45deg, #EF5B5B, #FF7B7B)',
              '&:hover': { background: 'linear-gradient(45deg, #D94A4A, #EF5B5B)' }
            }}
          >
            Tạo Module đầu tiên
          </Button>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {modules.map((module) => (
            <Accordion key={module._id} sx={{ bgcolor: darkMode ? 'grey.800' : 'white' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6">{module.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {module.description}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Chip 
                      label={module.isPublished ? 'Đã xuất bản' : 'Bản nháp'} 
                      color={module.isPublished ? 'success' : 'default'}
                      size="small"
                    />
                    <Chip 
                      label={`${module.lessons?.length || 0} bài học`} 
                      variant="outlined"
                      size="small"
                    />
                    <Tooltip title="Chỉnh sửa module">
                      <Box
                        component="span"
                        sx={{ 
                          cursor: 'pointer', 
                          p: 0.5, 
                          borderRadius: 1,
                          '&:hover': { bgcolor: 'action.hover' },
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          openModuleDialog(module);
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </Box>
                    </Tooltip>
                    <Tooltip title="Xóa module">
                      <Box
                        component="span"
                        sx={{ 
                          cursor: 'pointer', 
                          p: 0.5, 
                          borderRadius: 1,
                          '&:hover': { bgcolor: 'action.hover' },
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'error.main'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteModule(module._id, module.title);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </Box>
                    </Tooltip>
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1">Bài học trong module</Typography>
                  <Button 
                    size="small" 
                    startIcon={<AddIcon />}
                    onClick={() => openLessonDialog(module._id)}
                    sx={{ 
                      background: 'linear-gradient(45deg, #4ECDC4, #45B7D1)',
                      color: 'white',
                      '&:hover': { background: 'linear-gradient(45deg, #45B7D1, #4ECDC4)' }
                    }}
                  >
                    Thêm bài học
                  </Button>
                </Box>
                
                {module.lessons && module.lessons.length > 0 ? (
                  <Stack spacing={1}>
                    {module.lessons.map((lesson) => (
                      <Card key={lesson._id} sx={{ bgcolor: darkMode ? 'grey.700' : 'grey.50' }}>
                        <CardContent sx={{ py: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ color: '#EF5B5B' }}>
                              {getLessonTypeIcon(lesson.type)}
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="subtitle2">{lesson.title}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {lesson.description}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                <Chip 
                                  label={getLessonTypeLabel(lesson.type)} 
                                  size="small" 
                                  variant="outlined"
                                />
                                <Chip 
                                  label={lesson.isPublished ? 'Đã xuất bản' : 'Bản nháp'} 
                                  size="small"
                                  color={lesson.isPublished ? 'success' : 'default'}
                                />
                              </Box>
                            </Box>
                            <Box>
                              <Tooltip title="Chỉnh sửa bài học">
                                <IconButton 
                                  size="small" 
                                  onClick={() => openLessonDialog(module._id, lesson)}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Xóa bài học">
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleDeleteLesson(module._id, lesson._id, lesson.title)}
                                  color="error"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                ) : (
                  <Paper sx={{ p: 3, textAlign: 'center', bgcolor: darkMode ? 'grey.700' : 'grey.100' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Chưa có bài học nào trong module này
                    </Typography>
                    <Button 
                      size="small" 
                      startIcon={<AddIcon />}
                      onClick={() => openLessonDialog(module._id)}
                      sx={{ 
                        background: 'linear-gradient(45deg, #4ECDC4, #45B7D1)',
                        color: 'white',
                        '&:hover': { background: 'linear-gradient(45deg, #45B7D1, #4ECDC4)' }
                      }}
                    >
                      Thêm bài học đầu tiên
                    </Button>
                  </Paper>
                )}
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>
      )}

      {/* Module Dialog */}
      <Dialog open={moduleDialogOpen} onClose={() => setModuleDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingModule ? 'Chỉnh sửa Module' : 'Tạo Module mới'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Tên module"
              value={moduleForm.title}
              onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Mô tả"
              value={moduleForm.description}
              onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
            <TextField
              label="Thứ tự"
              type="number"
              value={moduleForm.order}
              onChange={(e) => setModuleForm({ ...moduleForm, order: parseInt(e.target.value) || 0 })}
              fullWidth
            />
            <TextField
              label="Thời lượng ước tính (phút)"
              type="number"
              value={moduleForm.estimatedDuration}
              onChange={(e) => setModuleForm({ ...moduleForm, estimatedDuration: parseInt(e.target.value) || 0 })}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModuleDialogOpen(false)}>Hủy</Button>
          <Button 
            onClick={editingModule ? handleUpdateModule : handleCreateModule}
            variant="contained"
            sx={{ 
              background: 'linear-gradient(45deg, #EF5B5B, #FF7B7B)',
              '&:hover': { background: 'linear-gradient(45deg, #D94A4A, #EF5B5B)' }
            }}
          >
            {editingModule ? 'Cập nhật' : 'Tạo'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Lesson Dialog */}
      <Dialog open={lessonDialogOpen} onClose={() => setLessonDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingLesson ? 'Chỉnh sửa Bài học' : 'Tạo Bài học mới'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Tên bài học"
              value={lessonForm.title}
              onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Mô tả"
              value={lessonForm.description}
              onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
            <TextField
              select
              label="Loại bài học"
              value={lessonForm.type}
              onChange={(e) => setLessonForm({ ...lessonForm, type: e.target.value as any })}
              fullWidth
            >
              {LESSON_TYPES.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {type.icon}
                    {type.label}
                  </Box>
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Thứ tự"
              type="number"
              value={lessonForm.order}
              onChange={(e) => setLessonForm({ ...lessonForm, order: parseInt(e.target.value) || 0 })}
              fullWidth
            />
            <TextField
              label="Thời lượng ước tính (phút)"
              type="number"
              value={lessonForm.estimatedDuration}
              onChange={(e) => setLessonForm({ ...lessonForm, estimatedDuration: parseInt(e.target.value) || 0 })}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLessonDialogOpen(false)}>Hủy</Button>
          <Button 
            onClick={handleLessonSubmit}
            variant="contained"
            sx={{ 
              background: 'linear-gradient(45deg, #EF5B5B, #FF7B7B)',
              '&:hover': { background: 'linear-gradient(45deg, #D94A4A, #EF5B5B)' }
            }}
          >
            {editingLesson ? 'Cập nhật' : 'Tạo'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Course Edit Dialog */}
      <Dialog open={courseDialogOpen} onClose={() => setCourseDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ 
          background: 'linear-gradient(45deg, #EF5B5B, #FF7B7B)', 
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <EditIcon />
          {editingCourse ? 'Chỉnh sửa môn học' : 'Tạo môn học mới'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              label="Tên môn học"
              value={courseForm.title}
              onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Mô tả"
              value={courseForm.description}
              onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
            <TextField
              label="Môn học"
              value={courseForm.category}
              onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}
              fullWidth
              select
            >
              <MenuItem value="Toán">Toán</MenuItem>
              <MenuItem value="Tiếng Việt">Tiếng Việt</MenuItem>
              <MenuItem value="Khoa học">Khoa học</MenuItem>
              <MenuItem value="Lịch sử">Lịch sử</MenuItem>
              <MenuItem value="Địa lý">Địa lý</MenuItem>
              <MenuItem value="Tiếng Anh">Tiếng Anh</MenuItem>
              <MenuItem value="Thể dục">Thể dục</MenuItem>
            </TextField>
            <TextField
              label="Cấp lớp"
              value={courseForm.level}
              onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value })}
              fullWidth
              select
            >
              <MenuItem value="Lớp 1">Lớp 1</MenuItem>
              <MenuItem value="Lớp 2">Lớp 2</MenuItem>
              <MenuItem value="Lớp 3">Lớp 3</MenuItem>
              <MenuItem value="Lớp 4">Lớp 4</MenuItem>
              <MenuItem value="Lớp 5">Lớp 5</MenuItem>
            </TextField>
            <TextField
              label="Trạng thái"
              value={courseForm.status}
              onChange={(e) => setCourseForm({ ...courseForm, status: e.target.value })}
              fullWidth
              select
            >
              <MenuItem value="draft">Bản nháp</MenuItem>
              <MenuItem value="published">Đã xuất bản</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCourseDialogOpen(false)}>Hủy</Button>
          <Button 
            onClick={handleCourseSubmit}
            variant="contained"
            sx={{ 
              background: 'linear-gradient(45deg, #EF5B5B, #FF7B7B)',
              '&:hover': { background: 'linear-gradient(45deg, #D94A4A, #EF5B5B)' }
            }}
          >
            {editingCourse ? 'Cập nhật' : 'Tạo'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirmDialogOpen}
        onClose={() => {
          setConfirmDialogOpen(false);
          setConfirmAction(null);
        }}
        onConfirm={() => {
          if (confirmAction?.type === 'module') {
            confirmDeleteModule();
          } else if (confirmAction?.type === 'lesson') {
            confirmDeleteLesson();
          }
        }}
        title={confirmAction?.type === 'module' ? 'Xóa module' : 'Xóa bài học'}
        message={
          confirmAction?.type === 'module' 
            ? `Bạn có chắc chắn muốn xóa module "${confirmAction?.title}"? Tất cả bài học trong module sẽ bị xóa và không thể hoàn tác.`
            : `Bạn có chắc chắn muốn xóa bài học "${confirmAction?.title}"? Hành động này không thể hoàn tác.`
        }
        confirmText={confirmAction?.type === 'module' ? 'Xóa module' : 'Xóa bài học'}
        cancelText="Hủy"
        type="delete"
      />
    </Box>
  );
}
