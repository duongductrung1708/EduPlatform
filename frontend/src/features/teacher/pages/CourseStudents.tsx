import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  Stack, 
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Paper,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import RemoveIcon from '@mui/icons-material/Remove';
import EmailIcon from '@mui/icons-material/Email';
import SchoolIcon from '@mui/icons-material/School';
import { coursesApi } from '../../../api/courses';
import { courseInvitationsApi } from '../../../api/course-invitations';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContext';
import ConfirmDialog from '../../../components/ConfirmDialog';
import Pagination from '../../../components/Pagination';
import BackButton from '../../../components/BackButton';
import Breadcrumb from '../../../components/Breadcrumb';

interface Student {
  _id: string;
  name: string;
  email: string;
  role: string;
  enrolledAt?: string;
  progress?: number;
}

export default function CourseStudents() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  
  const [course, setCourse] = useState<any>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Add student dialog states
  const [addStudentDialogOpen, setAddStudentDialogOpen] = useState(false);
  const [studentEmail, setStudentEmail] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [studentToRemove, setStudentToRemove] = useState<Student | null>(null);
  const [addingStudent, setAddingStudent] = useState(false);

  useEffect(() => {
    if (courseId) {
      loadCourseData();
    }
  }, [courseId, currentPage, itemsPerPage]);

  const loadCourseData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      
      const [courseRes, enrollmentsRes] = await Promise.all([
        coursesApi.getById(courseId!),
        coursesApi.getEnrollments(courseId!)
      ]);
      
      if (!courseRes) {
        throw new Error('Course not found');
      }
      
      setCourse(courseRes);
      
      
      // Handle different response formats
      let students = [];
      if (Array.isArray(enrollmentsRes)) {
        // If enrollmentsRes is an array of enrollments
        students = enrollmentsRes.map(enrollment => {
          
          // Extract student data from different possible structures
          const studentData = enrollment.student || enrollment.studentId || {};
          const studentId = studentData._id || enrollment.studentId || enrollment._id;
          const studentName = studentData.name || 'Chưa có tên';
          const studentEmail = studentData.email || 'Chưa có email';
          
          
          return {
            _id: studentId,
            name: studentName,
            email: studentEmail,
            role: 'student',
            enrolledAt: enrollment.enrolledAt,
            progress: enrollment.progress || 0
          };
        });
      } else if (enrollmentsRes?.students) {
        // If enrollmentsRes has a students property
        students = enrollmentsRes.students;
      }
      
      
      // Apply pagination to students
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedStudents = students.slice(startIndex, endIndex);
      
      setStudents(paginatedStudents);
      setTotalItems(students.length);
      setTotalPages(Math.ceil(students.length / itemsPerPage));
    } catch (err) {
      console.error('Error loading course data:', err);
      setError('Không thể tải dữ liệu môn học');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async () => {
    if (!studentEmail.trim()) {
      setDialogError('Vui lòng nhập email học sinh');
      return;
    }

    if (emailError) {
      setDialogError('Email không hợp lệ. Vui lòng nhập email đúng định dạng.');
      return;
    }

    try {
      setAddingStudent(true);
      setDialogError(null);
      
      await courseInvitationsApi.createInvitation({
        courseId: courseId!,
        studentEmail: studentEmail,
        message: 'Bạn được mời tham gia môn học này. Vui lòng xác nhận để bắt đầu học tập!'
      });
      setAddStudentDialogOpen(false);
      setStudentEmail('');
      setEmailError(false);
      setDialogError(null);
      setSuccess('Lời mời đã được gửi thành công! Học sinh sẽ nhận được email và cần xác nhận để tham gia.');
      
      // Force refresh the student list
      await loadCourseData();
    } catch (err: any) {
      console.error('Error adding student:', err);
      console.error('Error details:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        studentEmail,
        courseId
      });
      
      let errorMessage = 'Không thể gửi lời mời';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.status === 404) {
        errorMessage = 'Không tìm thấy học sinh với email này. Vui lòng kiểm tra lại email.';
      } else if (err.response?.status === 409) {
        errorMessage = 'Học sinh đã có lời mời chờ xử lý hoặc đã tham gia môn học này rồi.';
      }
      
      setDialogError(errorMessage);
    } finally {
      setAddingStudent(false);
    }
  };

  const handleRemoveStudent = (student: Student) => {
    setStudentToRemove(student);
    setConfirmDialogOpen(true);
  };

  const confirmRemoveStudent = async () => {
    if (!studentToRemove) return;

    try {
      setLoading(true);
      await coursesApi.removeStudent(courseId!, studentToRemove._id);
      setConfirmDialogOpen(false);
      setStudentToRemove(null);
      setSuccess('Đã xóa học sinh thành công');
      
      // Force refresh the student list
      await loadCourseData();
    } catch (err: any) {
      console.error('Error removing student:', err);
      setError(err.response?.data?.message || 'Không thể xóa học sinh');
    } finally {
      setLoading(false);
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

  if (error && !students.length) {
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

  return (
    <Box sx={{ p: 3 }}>
      {/* Breadcrumb */}
      <Breadcrumb 
        items={[
          { label: 'Trang chủ', path: '/dashboard' },
          { label: 'Giáo viên', path: '/teacher' },
          { label: 'Môn học', path: '/teacher/courses' },
          { label: course?.title || 'Quản lý môn học', path: `/teacher/courses/${courseId}/manage` },
          { label: 'Học sinh', current: true }
        ]}
      />
      
      {/* Back Button */}
      <BackButton to="/teacher/courses" />
      
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ 
            background: 'linear-gradient(45deg, #EF5B5B, #FF7B7B)', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent',
            mb: 1
          }}>
            Quản lý học sinh: {course?.title}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {course?.description}
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<PersonAddIcon />}
          onClick={() => setAddStudentDialogOpen(true)}
          sx={{ 
            background: 'linear-gradient(45deg, #96CEB4, #FFEAA7)',
            '&:hover': { background: 'linear-gradient(45deg, #FFEAA7, #96CEB4)' }
          }}
        >
          Gửi lời mời
        </Button>
      </Box>

      {/* Success Alert */}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Students List */}
      {students.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', bgcolor: darkMode ? 'grey.800' : 'grey.50' }}>
          <SchoolIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            Chưa có học sinh nào
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Hãy thêm học sinh vào môn học để bắt đầu quản lý
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<PersonAddIcon />}
            onClick={() => setAddStudentDialogOpen(true)}
            sx={{ 
              background: 'linear-gradient(45deg, #96CEB4, #FFEAA7)',
              '&:hover': { background: 'linear-gradient(45deg, #FFEAA7, #96CEB4)' }
            }}
          >
            Gửi lời mời đầu tiên
          </Button>
        </Paper>
      ) : (
        <Card sx={{ bgcolor: darkMode ? 'grey.800' : 'white' }}>
          <CardContent>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">
                Danh sách học sinh ({students.length})
              </Typography>
              <Chip 
                label={`${students.length} học sinh`} 
                color="primary" 
                variant="outlined"
              />
            </Box>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Học sinh</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Tham gia</TableCell>
                    <TableCell>Tiến độ</TableCell>
                    <TableCell align="center">Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student._id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: '#EF5B5B' }}>
                            {student.name?.charAt(0)?.toUpperCase() || 'S'}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2">
                              {student.name || 'Chưa có tên'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Học sinh
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <EmailIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {student.email || 'Chưa có email'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {student.enrolledAt ? new Date(student.enrolledAt).toLocaleDateString('vi-VN') : 'Chưa xác định'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={`${student.progress || 0}%`} 
                          color={student.progress && student.progress > 50 ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Xóa khỏi môn học">
                          <IconButton 
                            size="small" 
                            onClick={() => handleRemoveStudent(student)}
                            color="error"
                          >
                            <RemoveIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Add Student Dialog */}
      <Dialog 
        open={addStudentDialogOpen} 
        onClose={() => {
          setAddStudentDialogOpen(false);
          setStudentEmail('');
          setEmailError(false);
          setError(null);
        }} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          Gửi lời mời tham gia môn học
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="info">
              Nhập email của học sinh để gửi lời mời tham gia môn học. Học sinh sẽ nhận được email và cần xác nhận để tham gia.
            </Alert>
            {dialogError && (
              <Alert severity="error" onClose={() => setDialogError(null)}>
                {dialogError}
              </Alert>
            )}
            <TextField
              label="Email học sinh"
              type="email"
              value={studentEmail}
              onChange={(e) => {
                const email = e.target.value.trim();
                setStudentEmail(email);
                // Validate email format
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                setEmailError(email.length > 0 && !emailRegex.test(email));
              }}
              fullWidth
              required
              placeholder="student@example.com"
              helperText={emailError ? "Email không hợp lệ" : "Nhập email chính xác của học sinh để gửi lời mời"}
              error={emailError}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setAddStudentDialogOpen(false);
              setStudentEmail('');
              setEmailError(false);
              setDialogError(null);
            }} 
            disabled={addingStudent}
          >
            Hủy
          </Button>
          <Button 
            onClick={handleAddStudent}
            variant="contained"
            disabled={addingStudent || !studentEmail.trim() || emailError}
            sx={{ 
              background: 'linear-gradient(45deg, #96CEB4, #FFEAA7)',
              '&:hover': { background: 'linear-gradient(45deg, #FFEAA7, #96CEB4)' }
            }}
          >
            {addingStudent ? 'Đang gửi lời mời...' : 'Gửi lời mời'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Remove Student Dialog */}
      <ConfirmDialog
        open={confirmDialogOpen}
        onClose={() => {
          setConfirmDialogOpen(false);
          setStudentToRemove(null);
        }}
        onConfirm={confirmRemoveStudent}
        title="Xóa học sinh khỏi môn học"
        message={`Bạn có chắc chắn muốn xóa học sinh "${studentToRemove?.name}" khỏi môn học này? Học sinh sẽ không thể truy cập nội dung môn học nữa.`}
        confirmText="Xóa học sinh"
        cancelText="Hủy"
        type="delete"
      />

      {/* Pagination */}
      {students.length > 0 && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          itemsPerPageOptions={[5, 10, 20, 50]}
          disabled={loading}
        />
      )}
    </Box>
  );
}
