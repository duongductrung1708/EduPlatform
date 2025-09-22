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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PublicIcon from '@mui/icons-material/Public';
import LockIcon from '@mui/icons-material/Lock';
import SettingsIcon from '@mui/icons-material/Settings';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import { coursesApi, CourseItem } from '../../../api/courses';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { SkeletonGrid } from '../../../components/LoadingSkeleton';
import ConfirmDialog from '../../../components/ConfirmDialog';
import { useTheme } from '../../../contexts/ThemeContext';

const PRIMARY_CATEGORIES = ['Toán', 'Tiếng Việt', 'Tiếng Anh', 'Khoa học', 'Tin học', 'Mỹ thuật', 'Âm nhạc'];
const PRIMARY_LEVELS = ['Lớp 1', 'Lớp 2', 'Lớp 3', 'Lớp 4', 'Lớp 5'];

function slugify(input: string) {
  return (input || '')
    .toString()
    .toLowerCase()
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export default function MyCourses() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseItem | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<CourseItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [manageContentDialogOpen, setManageContentDialogOpen] = useState(false);
  const [selectedCourseForManage, setSelectedCourseForManage] = useState<string>('');

  // Form states
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [level, setLevel] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('published');

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const res = await coursesApi.getMyCourses();
      setCourses(res || []);
    } catch (error) {
      console.error('Failed to load courses:', error);
      setError('Không thể tải danh sách môn học');
    } finally {
      setLoading(false);
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    setSlug(slugify(newTitle));
  };

  const resetForm = () => {
    setTitle('');
    setSlug('');
    setDescription('');
    setCategory('');
    setLevel('');
    setVisibility('public');
    setStatus('published');
    setError(null);
    setSuccess(null);
  };

  const handleCreateCourse = async () => {
    // Clear previous errors
    setError(null);
    
    // Validate required fields
    if (!title || !slug || !description || !category || !level) {
      setError('Vui lòng điền đầy đủ các trường bắt buộc');
      return;
    }

    // Validate field lengths
    if (title.length < 2) {
      setError('Tên môn học phải có ít nhất 2 ký tự');
      return;
    }

    if (slug.length < 2) {
      setError('Slug phải có ít nhất 2 ký tự');
      return;
    }

    if (description.length < 3) {
      setError('Mô tả phải có ít nhất 3 ký tự');
      return;
    }

    // Validate category
    const validCategories = ['Toán', 'Tiếng Việt', 'Tiếng Anh', 'Khoa học', 'Tin học', 'Mỹ thuật', 'Âm nhạc'];
    if (!validCategories.includes(category)) {
      setError(`Môn học phải là một trong: ${validCategories.join(', ')}`);
      return;
    }

    // Validate level
    const validLevels = ['Lớp 1', 'Lớp 2', 'Lớp 3', 'Lớp 4', 'Lớp 5'];
    if (!validLevels.includes(level)) {
      setError(`Cấp lớp phải là một trong: ${validLevels.join(', ')}`);
      return;
    }

    try {
      setError(null);
      const newCourse = await coursesApi.createPublic({
        title,
        slug,
        description,
        category,
        level,
        visibility: 'public',
        status: 'published',
        tags: [category.toLowerCase(), level.toLowerCase()]
      });
      
      setSuccess(`Môn học "${newCourse.title}" đã được tạo thành công!`);
      setCreateDialogOpen(false);
      resetForm();
      loadCourses();
    } catch (err: any) {
      console.error('Create course error:', err);
      
      // Handle validation errors
      if (err.response?.data?.message && Array.isArray(err.response.data.message)) {
        const validationErrors = err.response.data.message.join(', ');
        setError(`Lỗi validation: ${validationErrors}`);
      } else if (err.response?.data?.message) {
        setError(`Lỗi: ${err.response.data.message}`);
      } else if (err.response?.data?.error) {
        setError(`Lỗi: ${err.response.data.error}`);
      } else {
        setError('Đã xảy ra lỗi khi tạo môn học. Vui lòng thử lại.');
      }
    }
  };

  const handleEditCourse = (course: CourseItem) => {
    setEditingCourse(course);
    setTitle(course.title);
    setSlug(course.slug);
    setDescription(course.description || '');
    setCategory(course.category || '');
    setLevel(course.level || '');
    setVisibility(course.visibility as 'public' | 'private');
    setStatus(course.status as 'draft' | 'published' | 'archived');
    setEditDialogOpen(true);
  };

  const handleUpdateCourse = async () => {
    if (!editingCourse || !title || !slug || !description || !category || !level) {
      setError('Vui lòng điền đầy đủ các trường bắt buộc');
      return;
    }

    try {
      setError(null);
      await coursesApi.update(editingCourse._id, {
        title,
        description,
        category,
        level,
        visibility,
        status,
        tags: [category.toLowerCase(), level.toLowerCase()]
      });
      
      setSuccess(`Môn học "${title}" đã được cập nhật thành công!`);
      setEditDialogOpen(false);
      resetForm();
      setEditingCourse(null);
      loadCourses();
    } catch (err: any) {
      console.error('Update course error:', err);
      
      // Handle validation errors
      if (err.response?.data?.message && Array.isArray(err.response.data.message)) {
        const validationErrors = err.response.data.message.join(', ');
        setError(`Lỗi validation: ${validationErrors}`);
      } else if (err.response?.data?.message) {
        setError(`Lỗi: ${err.response.data.message}`);
      } else if (err.response?.data?.error) {
        setError(`Lỗi: ${err.response.data.error}`);
      } else {
        setError('Đã xảy ra lỗi khi cập nhật môn học. Vui lòng thử lại.');
      }
    }
  };

  const handleDeleteCourse = (course: CourseItem) => {
    setCourseToDelete(course);
    setConfirmDialogOpen(true);
  };

  const confirmDeleteCourse = async () => {
    if (!courseToDelete) return;

    try {
      setError(null);
      await coursesApi.delete(courseToDelete._id);
      setSuccess(`Môn học "${courseToDelete.title}" đã được xóa thành công!`);
      setConfirmDialogOpen(false);
      setCourseToDelete(null);
      loadCourses();
    } catch (err: any) {
      console.error('Delete course error:', err);
      
      if (err.response?.data?.message) {
        setError(`Lỗi: ${err.response.data.message}`);
      } else if (err.response?.data?.error) {
        setError(`Lỗi: ${err.response.data.error}`);
      } else {
        setError('Đã xảy ra lỗi khi xóa môn học. Vui lòng thử lại.');
      }
    }
  };

  const handleManageContent = () => {
    if (selectedCourseForManage) {
      navigate(`/teacher/courses/${selectedCourseForManage}/manage`);
      setManageContentDialogOpen(false);
      setSelectedCourseForManage('');
    }
  };

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
            ? 'linear-gradient(135deg, #FF7B7B 0%, #EF5B5B 100%)'
            : 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
          backgroundClip: 'text', 
          WebkitBackgroundClip: 'text', 
          WebkitTextFillColor: 'transparent'
        }}
      >
        📚 Quản lý Môn học
      </Typography>
        <Typography variant="body1" color="text.secondary">
          Tạo và quản lý các môn học của bạn
        </Typography>
      </Box>

      {/* Actions */}
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Stack direction="row" spacing={2} justifyContent="center" sx={{ flexWrap: 'wrap', gap: 2 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
            sx={{ 
              borderRadius: 3,
              py: 1.5,
              px: 4,
              background: 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #D94A4A 0%, #EF5B5B 100%)',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(239, 91, 91, 0.3)'
              },
              transition: 'all 0.3s ease'
            }}
          >
              Tạo môn học mới
          </Button>
          {courses.length > 0 && (
            <Button
              variant="outlined"
              size="large"
              startIcon={<SettingsIcon />}
              onClick={() => setManageContentDialogOpen(true)}
              sx={{ 
                borderRadius: 3,
                py: 1.5,
                px: 4,
                borderColor: 'secondary.main',
                color: 'secondary.main',
                '&:hover': {
                  borderColor: 'secondary.dark',
                  color: 'secondary.dark',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(156, 39, 176, 0.3)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              Quản lý nội dung
            </Button>
          )}
        </Stack>
      </Box>

      {/* Alerts */}
      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2, whiteSpace: 'pre-line' }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{success}</Alert>}

      {/* Courses Grid */}
      {loading ? (
        <SkeletonGrid count={6} columns={{ xs: 12, sm: 6, md: 4, lg: 3 }} showAvatar={true} showChips={true} showButton={true} />
      ) : (
        <Grid container spacing={3}>
          {courses.map((course) => (
            <Grid key={course._id} item xs={12} sm={6} md={4} lg={3}>
              <Card 
                sx={{ 
                  borderRadius: 3,
                  border: '2px solid',
                  borderColor: 'divider',
                  '&:hover': {
                    boxShadow: 4,
                    transform: 'translateY(-4px)',
                    transition: 'all 0.3s ease',
                    borderColor: '#EF5B5B'
                  }
                }}
              >
                <CardContent sx={{ p: 3, textAlign: 'center' }}>
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
                    📖
                  </Avatar>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    {course.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                    {course.description}
                  </Typography>
                  <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 2 }}>
                    {course.category && (
                      <Chip 
                        size="small" 
                        label={course.category} 
                        sx={{ borderColor: '#EF5B5B', color: '#EF5B5B' }}
                        variant="outlined" 
                      />
                    )}
                    {course.level && (
                      <Chip 
                        size="small" 
                        label={course.level} 
                        sx={{ borderColor: '#AED6E6', color: '#AED6E6' }}
                        variant="outlined" 
                      />
                    )}
                  </Stack>
                  <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 2 }}>
                    <Chip 
                      size="small" 
                      icon={course.visibility === 'public' ? <PublicIcon /> : <LockIcon />}
                      label={course.visibility === 'public' ? 'Công khai' : 'Riêng tư'} 
                      color={course.visibility === 'public' ? 'success' : 'warning'} 
                      variant="outlined" 
                    />
                    <Chip 
                      size="small" 
                      label={course.status} 
                      color={course.status === 'published' ? 'success' : course.status === 'draft' ? 'warning' : 'error'} 
                      variant="outlined" 
                    />
                  </Stack>
                  <Stack direction="row" spacing={1} justifyContent="center">
                    <Tooltip title="Xem chi tiết">
                      <IconButton 
                        size="small" 
                        onClick={() => navigate(`/courses/${course._id}`)}
                        sx={{ bgcolor: 'info.main', color: 'white', '&:hover': { bgcolor: 'info.dark' } }}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Quản lý nội dung">
                      <IconButton 
                        size="small" 
                        onClick={() => navigate(`/teacher/courses/${course._id}/manage`)}
                        sx={{ bgcolor: '#4ECDC4', color: 'white', '&:hover': { bgcolor: '#45B7D1' } }}
                      >
                        <SettingsIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Quản lý học sinh">
                      <IconButton 
                        size="small" 
                        onClick={() => navigate(`/teacher/courses/${course._id}/students`)}
                        sx={{ bgcolor: '#96CEB4', color: 'white', '&:hover': { bgcolor: '#FFEAA7' } }}
                      >
                        <ManageAccountsIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Chỉnh sửa">
                      <IconButton 
                        size="small" 
                        onClick={() => handleEditCourse(course)}
                        sx={{ bgcolor: '#EF5B5B', color: 'white', '&:hover': { bgcolor: '#D94A4A' } }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Xóa">
                      <IconButton 
                        size="small" 
                        onClick={() => handleDeleteCourse(course)}
                        sx={{ bgcolor: 'error.main', color: 'white', '&:hover': { bgcolor: 'error.dark' } }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Empty State */}
      {!loading && courses.length === 0 && (
        <Paper 
          elevation={2} 
          sx={{ 
            borderRadius: 4,
            textAlign: 'center',
            p: 6,
            background: 'linear-gradient(135deg, #AED6E6 0%, #87CEEB 100%)',
            color: 'white'
          }}
        >
          <Typography variant="h2" sx={{ mb: 2 }}>
            📚
          </Typography>
          <Typography variant="h5" fontWeight={600} sx={{ mb: 2 }}>
            Chưa có môn học nào
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, opacity: 0.9 }}>
            Hãy tạo môn học đầu tiên để chia sẻ kiến thức với học sinh!
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
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
            Tạo môn học ngay!
          </Button>
        </Paper>
      )}

      {/* Create Course Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Tạo môn học mới</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2, whiteSpace: 'pre-line' }}>{error}</Alert>}
          <TextField
            fullWidth
            label="Tiêu đề môn học"
            value={title}
            onChange={handleTitleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Slug (URL thân thiện)"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            margin="normal"
            required
            helperText="Slug sẽ tự động tạo từ tiêu đề, có thể chỉnh sửa."
          />
          <TextField
            fullWidth
            label="Mô tả"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            margin="normal"
            multiline
            rows={4}
            required
          />
          <TextField
            select
            fullWidth
            label="Danh mục"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            margin="normal"
            required
          >
            {PRIMARY_CATEGORIES.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            fullWidth
            label="Cấp độ"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            margin="normal"
            required
          >
            {PRIMARY_LEVELS.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            fullWidth
            label="Trạng thái"
            value={status}
            onChange={(e) => setStatus(e.target.value as 'draft' | 'published' | 'archived')}
            margin="normal"
          >
            <MenuItem value="draft">Bản nháp</MenuItem>
            <MenuItem value="published">Đã xuất bản</MenuItem>
            <MenuItem value="archived">Đã lưu trữ</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setCreateDialogOpen(false); resetForm(); }}>
            Hủy
          </Button>
          <Button variant="contained" onClick={handleCreateCourse}>
            Tạo môn học
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Course Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Chỉnh sửa môn học</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2, whiteSpace: 'pre-line' }}>{error}</Alert>}
          <TextField
            fullWidth
            label="Tiêu đề môn học"
            value={title}
            onChange={handleTitleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Slug (URL thân thiện)"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Mô tả"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            margin="normal"
            multiline
            rows={4}
            required
          />
          <TextField
            select
            fullWidth
            label="Danh mục"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            margin="normal"
            required
          >
            {PRIMARY_CATEGORIES.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            fullWidth
            label="Cấp độ"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            margin="normal"
            required
          >
            {PRIMARY_LEVELS.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            fullWidth
            label="Trạng thái"
            value={status}
            onChange={(e) => setStatus(e.target.value as 'draft' | 'published' | 'archived')}
            margin="normal"
          >
            <MenuItem value="draft">Bản nháp</MenuItem>
            <MenuItem value="published">Đã xuất bản</MenuItem>
            <MenuItem value="archived">Đã lưu trữ</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setEditDialogOpen(false); resetForm(); setEditingCourse(null); }}>
            Hủy
          </Button>
          <Button variant="contained" onClick={handleUpdateCourse}>
            Cập nhật môn học
          </Button>
        </DialogActions>
      </Dialog>

      {/* Manage Content Dialog */}
      <Dialog open={manageContentDialogOpen} onClose={() => setManageContentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, textAlign: 'center' }}>
          <SettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Chọn môn học để quản lý nội dung
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
            Chọn môn học mà bạn muốn quản lý nội dung (bài giảng, bài tập, v.v.)
          </Typography>
          
          <TextField
            select
            fullWidth
            label="Chọn môn học"
            value={selectedCourseForManage}
            onChange={(e) => setSelectedCourseForManage(e.target.value)}
            margin="normal"
            required
          >
            {courses.map((course) => (
              <MenuItem key={course._id} value={course._id}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body1" fontWeight={600}>
                      {course.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ID: {course._id}
                    </Typography>
                  </Box>
                  <Chip 
                    size="small" 
                    label={course.category} 
                    sx={{ ml: 1 }}
                    variant="outlined"
                  />
                </Box>
              </MenuItem>
            ))}
          </TextField>

          {selectedCourseForManage && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Thông tin môn học đã chọn:
              </Typography>
              {(() => {
                const selectedCourse = courses.find(c => c._id === selectedCourseForManage);
                return selectedCourse ? (
                  <Box>
                    <Typography variant="body2">
                      <strong>Tên:</strong> {selectedCourse.title}
                    </Typography>
                    <Typography variant="body2">
                      <strong>ID:</strong> {selectedCourse._id}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Mô tả:</strong> {selectedCourse.description}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Danh mục:</strong> {selectedCourse.category}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Cấp độ:</strong> {selectedCourse.level}
                    </Typography>
                  </Box>
                ) : null;
              })()}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setManageContentDialogOpen(false);
            setSelectedCourseForManage('');
          }}>
            Hủy
          </Button>
          <Button 
            variant="contained" 
            onClick={handleManageContent}
            disabled={!selectedCourseForManage}
            sx={{
              background: 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #D94A4A 0%, #EF5B5B 100%)',
              }
            }}
          >
            Quản lý nội dung
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirmDialogOpen}
        onClose={() => {
          setConfirmDialogOpen(false);
          setCourseToDelete(null);
        }}
        onConfirm={confirmDeleteCourse}
        title="Xóa môn học"
        message={`Bạn có chắc chắn muốn xóa môn học "${courseToDelete?.title}"? Hành động này không thể hoàn tác và sẽ xóa tất cả dữ liệu liên quan.`}
        confirmText="Xóa môn học"
        cancelText="Hủy"
        type="delete"
      />
    </Box>
  );
}
