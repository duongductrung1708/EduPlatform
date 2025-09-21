import React, { useEffect, useState } from 'react';
import { Box, Grid, Card, CardActionArea, CardContent, Typography, AvatarGroup, Avatar, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, IconButton, List, ListItem, ListItemAvatar, ListItemText, FormControl, InputLabel, Select, MenuItem, Chip, CircularProgress } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { classesApi, ClassroomItem } from '../../../api/admin';
import { useNavigate } from 'react-router-dom';
import GroupIcon from '@mui/icons-material/Group';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { coursesApi } from '../../../api/courses';
import { useSocket } from '../../../hooks/useSocket';
import { useTheme } from '../../../contexts/ThemeContext';
import Pagination from '../../../components/Pagination';
import SearchFilterBar from '../../../components/SearchFilterBar';

export default function MyClassrooms() {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { joinClassroom, leaveClassroom, onClassroomStudentAdded, onClassroomStudentRemoved, offClassroomStudentAdded, offClassroomStudentRemoved } = useSocket();
  const [items, setItems] = useState<ClassroomItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [open, setOpen] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [creating, setCreating] = useState<boolean>(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [manageOpen, setManageOpen] = useState<boolean>(false);
  const [manageLoading, setManageLoading] = useState<boolean>(false);
  const [currentClass, setCurrentClass] = useState<any | null>(null);
  const [editOpen, setEditOpen] = useState<boolean>(false);
  const [editLoading, setEditLoading] = useState<boolean>(false);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editCourseId, setEditCourseId] = useState<string>('');
  const [courses, setCourses] = useState<Array<{ _id: string; title: string }>>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [courseFilter, setCourseFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('');
  const [addStudentOpen, setAddStudentOpen] = useState<boolean>(false);
  const [studentEmail, setStudentEmail] = useState<string>('');
  const [foundStudent, setFoundStudent] = useState<any>(null);
  const [searchingStudent, setSearchingStudent] = useState<boolean>(false);
  const [addingStudent, setAddingStudent] = useState<boolean>(false);
  const [loadingStudents, setLoadingStudents] = useState<boolean>(false);
  
  // Delete classroom states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [classroomToDelete, setClassroomToDelete] = useState<ClassroomItem | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await classesApi.listMy(currentPage, itemsPerPage);
      setItems(res.items);
      setTotalItems(res.total || 0);
      setTotalPages(Math.ceil((res.total || 0) / itemsPerPage));
    } catch (e: any) {
      // Handle 401 gracefully - user might not be authenticated
      if (e.response?.status === 401) {
        setItems([]);
        setTotalItems(0);
        setTotalPages(0);
      } else {
        setError(e?.response?.data?.message || 'Không thể tải danh sách lớp');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
    (async () => {
      try {
        const list = await coursesApi.listAll(1, 200);
        setCourses(list.items || []);
      } catch {}
    })();
  }, [currentPage, itemsPerPage]);

  // Real-time updates for classroom student changes
  useEffect(() => {
    const handleStudentAdded = (data: { classroomId: string; student: any; timestamp: string }) => {
      if (currentClass && currentClass._id === data.classroomId) {
        // Refresh current class data
        const refreshCurrentClass = async () => {
          try {
            const data = await classesApi.getById(currentClass._id);
            setCurrentClass(data);
          } catch (e) {
            console.error('Failed to refresh current class:', e);
          }
        };
        refreshCurrentClass();
      }
    };

    const handleStudentRemoved = (data: { classroomId: string; studentId: string; timestamp: string }) => {
      if (currentClass && currentClass._id === data.classroomId) {
        // Refresh current class data
        const refreshCurrentClass = async () => {
          try {
            const data = await classesApi.getById(currentClass._id);
            setCurrentClass(data);
          } catch (e) {
            console.error('Failed to refresh current class:', e);
          }
        };
        refreshCurrentClass();
      }
    };

    onClassroomStudentAdded(handleStudentAdded);
    onClassroomStudentRemoved(handleStudentRemoved);

    return () => {
      offClassroomStudentAdded(handleStudentAdded);
      offClassroomStudentRemoved(handleStudentRemoved);
    };
  }, [currentClass, onClassroomStudentAdded, onClassroomStudentRemoved, offClassroomStudentAdded, offClassroomStudentRemoved]);

  const createClass = async () => {
    if (!title.trim()) return;
    try {
      setCreating(true);
      setError(null);
      const created = await classesApi.create({ title: title.trim() });
      setSuccess('Đã tạo lớp: ' + created.title);
      setOpen(false);
      setTitle('');
      fetchClasses();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Không thể tạo lớp');
    } finally {
      setCreating(false);
    }
  };

  const createClassWithCourse = async () => {
    if (!title.trim()) {
      setDialogError('Vui lòng nhập tên lớp');
      return;
    }
    try {
      setCreating(true);
      setDialogError(null);
      const payload: any = { title: title.trim() };
      if (selectedCourseId) payload.courseId = selectedCourseId;
      await classesApi.create(payload);
      setSuccess('Đã tạo lớp');
      setOpen(false);
      setTitle('');
      setSelectedCourseId('');
      setDialogError(null);
      fetchClasses();
    } catch (e: any) {
      setDialogError(e?.response?.data?.message || 'Không thể tạo lớp');
    } finally {
      setCreating(false);
    }
  };

  const copyInvite = async (code?: string) => {
    if (!code) return;
    const url = `${window.location.origin}/auth/register?role=student&invite=${code}`;
    const content = `Mã lớp: ${code}\nLink mời: ${url}`;
    await navigator.clipboard.writeText(content);
    setSuccess('Đã sao chép mã lớp và link mời');
  };

  const openManage = async (id: string) => {
    try {
      setManageLoading(true);
      setManageOpen(true);
      const data = await classesApi.getById(id);
      // If students are not populated, fetch them separately
      if (data.studentIds && data.studentIds.length > 0 && typeof data.studentIds[0] === 'string') {
        try {
          setLoadingStudents(true);
          const students = await classesApi.getStudents(id);
          data.studentIds = students;
        } catch (e) {
          console.error('Failed to fetch students separately:', e);
        } finally {
          setLoadingStudents(false);
        }
      }
      
      setCurrentClass(data);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Không thể tải thành viên lớp');
    } finally {
      setManageLoading(false);
    }
  };

  const openEdit = async (cls: any) => {
    setCurrentClass(cls);
    setEditTitle(cls.title || '');
    setEditCourseId(cls.courseId?._id || cls.courseId || '');
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!currentClass) return;
    try {
      setEditLoading(true);
      const data: any = { title: editTitle.trim() };
      if (editCourseId) data.courseId = editCourseId;
      await classesApi.update(currentClass._id || currentClass.id, data);
      setSuccess('Đã cập nhật lớp');
      setEditOpen(false);
      fetchClasses();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Không thể cập nhật lớp');
    } finally {
      setEditLoading(false);
    }
  };

  const removeStudent = async (studentId: string) => {
    if (!currentClass) return;
    try {
      await classesApi.removeStudent(currentClass.id || currentClass._id, studentId);
      // Refresh current class
      const data = await classesApi.getById(currentClass.id || currentClass._id);
      setCurrentClass(data);
      setSuccess('Đã xóa học sinh khỏi lớp');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Không thể xóa học sinh');
    }
  };

  const openAddStudent = () => {
    setStudentEmail('');
    setFoundStudent(null);
    setAddStudentOpen(true);
  };

  const searchStudent = async () => {
    if (!studentEmail.trim()) {
      setError('Vui lòng nhập email học sinh');
      return;
    }

    try {
      setSearchingStudent(true);
      setError(null);
      const student = await classesApi.findStudentByEmail(studentEmail.trim());
      setFoundStudent(student);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Không tìm thấy học sinh với email này');
      setFoundStudent(null);
    } finally {
      setSearchingStudent(false);
    }
  };

  const addStudent = async () => {
    if (!currentClass || !foundStudent) return;
    try {
      setAddingStudent(true);
      await classesApi.addStudent(currentClass.id || currentClass._id, foundStudent._id);
      // Refresh current class
      const data = await classesApi.getById(currentClass.id || currentClass._id);
      setCurrentClass(data);
      setSuccess('Đã thêm học sinh vào lớp');
      setAddStudentOpen(false);
      setStudentEmail('');
      setFoundStudent(null);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Không thể thêm học sinh');
    } finally {
      setAddingStudent(false);
    }
  };

  // Delete classroom functions
  const openDeleteDialog = (classroom: ClassroomItem) => {
    setClassroomToDelete(classroom);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteClassroom = async () => {
    if (!classroomToDelete) return;
    
    try {
      setDeleting(true);
      await classesApi.delete(classroomToDelete._id);
      setSuccess('Đã xóa lớp học thành công');
      setDeleteDialogOpen(false);
      setClassroomToDelete(null);
      fetchClasses(); // Refresh the list
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Không thể xóa lớp học');
    } finally {
      setDeleting(false);
    }
  };

  const cancelDeleteClassroom = () => {
    setDeleteDialogOpen(false);
    setClassroomToDelete(null);
  };

  // Search and filter handlers
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleFilterChange = (filterKey: string, value: string) => {
    if (filterKey === 'course') {
      setCourseFilter(value);
    }
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
  };

  const handleClearAll = () => {
    setSearchTerm('');
    setCourseFilter('');
    setSortBy('');
  };

  // Filter and sort items
  const filteredAndSortedItems = items
    .filter(item => {
      // Search filter
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        const titleMatch = (item.title || (item as any).name || '').toLowerCase().includes(searchLower);
        const courseMatch = courses.find(c => c._id === (item as any).courseId)?.title.toLowerCase().includes(searchLower);
        if (!titleMatch && !courseMatch) return false;
      }

      // Course filter
      if (courseFilter) {
        const itemCourseId = (item as any).courseId?._id || (item as any).courseId;
        if (itemCourseId !== courseFilter) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (!sortBy) return 0;

      switch (sortBy) {
        case 'name-asc':
          return ((a.title || (a as any).name || '').localeCompare(b.title || (b as any).name || ''));
        case 'name-desc':
          return ((b.title || (b as any).name || '').localeCompare(a.title || (a as any).name || ''));
        case 'students-asc':
          return ((a as any).studentsCount || 0) - ((b as any).studentsCount || 0);
        case 'students-desc':
          return ((b as any).studentsCount || 0) - ((a as any).studentsCount || 0);
        case 'created-asc':
          return new Date((a as any).createdAt || 0).getTime() - new Date((b as any).createdAt || 0).getTime();
        case 'created-desc':
          return new Date((b as any).createdAt || 0).getTime() - new Date((a as any).createdAt || 0).getTime();
        default:
          return 0;
      }
    });

  return (
    <Box>
        <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ 
            fontWeight: 700, 
            background: darkMode 
              ? 'linear-gradient(135deg, #FF7B7B 0%, #EF5B5B 100%)'
              : 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            color: 'transparent'
          }}>
            Lớp của tôi
          </Typography>
          <Box display="flex" gap={2}>
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel>Lọc theo môn học</InputLabel>
              <Select label="Lọc theo môn học" value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}>
                <MenuItem value="">Tất cả</MenuItem>
                {courses.map(c => (
                  <MenuItem key={c._id} value={c._id}>{c.title}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />} 
              onClick={() => setOpen(true)}
              sx={{
                background: 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
                boxShadow: '0 4px 15px rgba(239, 91, 91, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #D94A4A 0%, #EF5B5B 100%)',
                  boxShadow: '0 6px 20px rgba(239, 91, 91, 0.4)',
                }
              }}
            >
              Tạo lớp
            </Button>
          </Box>
        </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

      {/* Search and Filter Bar */}
      <SearchFilterBar
        searchValue={searchTerm}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Tìm kiếm lớp học..."
        filters={{
          course: {
            value: courseFilter,
            label: 'Môn học',
            options: courses.map(course => ({
              value: course._id,
              label: course.title
            }))
          }
        }}
        onFilterChange={handleFilterChange}
        sortOptions={[
          { value: 'name-asc', label: 'Tên A-Z' },
          { value: 'name-desc', label: 'Tên Z-A' },
          { value: 'students-asc', label: 'Số học sinh ít nhất' },
          { value: 'students-desc', label: 'Số học sinh nhiều nhất' },
          { value: 'created-asc', label: 'Tạo mới nhất' },
          { value: 'created-desc', label: 'Tạo cũ nhất' }
        ]}
        sortValue={sortBy}
        onSortChange={handleSortChange}
        onClearAll={handleClearAll}
        sx={{ mb: 3 }}
      />

      <Grid container spacing={2}>
        {filteredAndSortedItems.map((c) => (
            <Grid item xs={12} sm={6} lg={4} key={c._id}>
              <Card sx={{ 
                borderRadius: 4, 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                background: 'linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%)',
                border: '1px solid rgba(239, 91, 91, 0.1)',
                boxShadow: '0 4px 20px rgba(239, 91, 91, 0.1)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 30px rgba(239, 91, 91, 0.2)',
                  border: '1px solid rgba(239, 91, 91, 0.2)',
                }
              }}>
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Box display="flex" alignItems="center" gap={2} sx={{ mb: 2 }}>
                    <Box sx={{
                      p: 1.5,
                      borderRadius: 3,
                      background: 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <SchoolIcon sx={{ color: 'white', fontSize: 24 }} />
                    </Box>
                    <Typography variant="h6" fontWeight="600" sx={{ color: '#333333' }}>
                      {c.title || (c as any).name}
                    </Typography>
                  </Box>
                  {(c as any).courseId && (
                    <Box sx={{ mb: 2 }}>
                      <Chip 
                        label={`Môn học: ${typeof (c as any).courseId === 'object' ? (c as any).courseId.title : courses.find(cs => cs._id === (c as any).courseId)?.title || 'N/A'}`} 
                        size="small"
                        sx={{
                          backgroundColor: '#AED6E6',
                          color: '#333333',
                          fontWeight: 500
                        }}
                      />
                    </Box>
                  )}
                  <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ color: '#777777', fontWeight: 500 }}>
                      {Math.max(0, (c as any).studentsCount ?? (c.studentIds || []).length)} học sinh
                    </Typography>
                    <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 32, height: 32, fontSize: 14, border: '2px solid white' } }}>
                      <Avatar sx={{ bgcolor: '#EF5B5B' }}>H</Avatar>
                      <Avatar sx={{ bgcolor: '#AED6E6', color: '#333333' }}>S</Avatar>
                      <Avatar sx={{ bgcolor: '#FF7B7B' }}>3</Avatar>
                    </AvatarGroup>
                  </Box>
                  <Box sx={{ 
                    p: 2, 
                    borderRadius: 2, 
                    backgroundColor: 'rgba(239, 91, 91, 0.05)',
                    border: '1px solid rgba(239, 91, 91, 0.1)'
                  }}>
                    <Typography variant="body2" sx={{ color: '#777777', fontWeight: 500 }}>
                      Mã mời: <span style={{ fontWeight: 600, color: '#EF5B5B' }}>{c.inviteCode || '-'}</span>
                    </Typography>
                  </Box>
                </CardContent>
              <Box sx={{ p: 3, pt: 0 }}>
                <Box display="flex" flexWrap="wrap" gap={1.5}>
                  <Button 
                    size="small" 
                    variant="outlined"
                    onClick={() => openEdit(c)}
                    sx={{ 
                      minWidth: 'auto', 
                      px: 2,
                      py: 1,
                      borderRadius: 2,
                      borderColor: '#AED6E6',
                      color: '#333333',
                      '&:hover': {
                        borderColor: '#7BB3D1',
                        backgroundColor: 'rgba(174, 214, 230, 0.1)'
                      }
                    }}
                  >
                    Chỉnh sửa
                  </Button>
                  <Button 
                    size="small" 
                    variant="contained"
                    startIcon={<GroupIcon />} 
                    onClick={() => openManage(c._id)}
                    sx={{ 
                      minWidth: 'auto', 
                      px: 2,
                      py: 1,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
                      boxShadow: '0 2px 10px rgba(239, 91, 91, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #D94A4A 0%, #EF5B5B 100%)',
                        boxShadow: '0 4px 15px rgba(239, 91, 91, 0.4)',
                      }
                    }}
                  >
                    Quản lý
                  </Button>
                  <Button 
                    size="small" 
                    variant="outlined"
                    onClick={() => navigate(`/teacher/classrooms/${c._id}/assignments`)}
                    sx={{ 
                      minWidth: 'auto', 
                      px: 2,
                      py: 1,
                      borderRadius: 2,
                      borderColor: '#AED6E6',
                      color: '#333333',
                      '&:hover': {
                        borderColor: '#7BB3D1',
                        backgroundColor: 'rgba(174, 214, 230, 0.1)'
                      }
                    }}
                  >
                    Bài tập
                  </Button>
                  <Button 
                    size="small" 
                    variant="outlined"
                    onClick={() => navigate(`/teacher/classrooms/${c._id}/lessons`)}
                    sx={{ 
                      minWidth: 'auto', 
                      px: 2,
                      py: 1,
                      borderRadius: 2,
                      borderColor: '#AED6E6',
                      color: '#333333',
                      '&:hover': {
                        borderColor: '#7BB3D1',
                        backgroundColor: 'rgba(174, 214, 230, 0.1)'
                      }
                    }}
                  >
                    Bài giảng
                  </Button>
                  <Button 
                    size="small" 
                    variant="outlined"
                    startIcon={<ContentCopyIcon />} 
                    disabled={!c.inviteCode} 
                    onClick={() => copyInvite(c.inviteCode)}
                    sx={{ 
                      minWidth: 'auto', 
                      px: 2,
                      py: 1,
                      borderRadius: 2,
                      borderColor: '#AED6E6',
                      color: '#333333',
                      '&:hover': {
                        borderColor: '#7BB3D1',
                        backgroundColor: 'rgba(174, 214, 230, 0.1)'
                      }
                    }}
                  >
                    Sao chép
                  </Button>
                  <Button 
                    size="small" 
                    variant="outlined"
                    startIcon={<DeleteIcon />} 
                    onClick={() => openDeleteDialog(c)}
                    sx={{ 
                      minWidth: 'auto', 
                      px: 2,
                      py: 1,
                      borderRadius: 2,
                      borderColor: '#FF6B6B',
                      color: '#FF6B6B',
                      '&:hover': {
                        borderColor: '#FF5252',
                        backgroundColor: 'rgba(255, 107, 107, 0.1)',
                        color: '#FF5252'
                      }
                    }}
                  >
                    Xóa
                  </Button>
                </Box>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

        <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm" PaperProps={{
          sx: {
            borderRadius: 4,
            background: 'linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%)',
            border: '1px solid rgba(239, 91, 91, 0.1)',
            boxShadow: '0 8px 32px rgba(239, 91, 91, 0.15)'
          }
        }}>
          <DialogTitle sx={{ 
            background: 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
            color: 'white',
            fontWeight: 600,
            fontSize: '1.25rem'
          }}>
            Tạo lớp mới
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            {dialogError && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setDialogError(null)}>
                {dialogError}
              </Alert>
            )}
            <TextField 
              autoFocus 
              margin="dense" 
              label="Tên lớp" 
              fullWidth 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Môn học</InputLabel>
              <Select label="Môn học" value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)}>
                {courses.map(c => (
                  <MenuItem key={c._id} value={c._id}>{c.title}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="body2" sx={{ color: '#777777', fontStyle: 'italic' }}>
              Có thể chỉnh sửa thêm thông tin sau khi tạo.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 3, gap: 2 }}>
            <Button 
              onClick={() => {
                setOpen(false);
                setDialogError(null);
              }}
              sx={{
                color: '#777777',
                borderColor: '#AED6E6',
                '&:hover': {
                  borderColor: '#7BB3D1',
                  backgroundColor: 'rgba(174, 214, 230, 0.1)'
                }
              }}
            >
              Hủy
            </Button>
            <Button 
              variant="contained" 
              disabled={creating || !title.trim()} 
              onClick={async () => { await createClassWithCourse(); }}
              sx={{
                background: 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
                boxShadow: '0 4px 15px rgba(239, 91, 91, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #D94A4A 0%, #EF5B5B 100%)',
                  boxShadow: '0 6px 20px rgba(239, 91, 91, 0.4)',
                },
                '&:disabled': {
                  background: '#cccccc',
                  boxShadow: 'none'
                }
              }}
            >
              {creating ? 'Đang tạo...' : 'Tạo lớp'}
            </Button>
          </DialogActions>
        </Dialog>

      <Dialog open={manageOpen} onClose={() => setManageOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Quản lý học sinh</Typography>
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={openAddStudent}
              size="small"
              sx={{ mr: 1 }}
            >
              Thêm học sinh
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          {manageLoading && <Typography>Đang tải...</Typography>}
          {loadingStudents && <Typography>Đang tải danh sách học sinh...</Typography>}
          {!manageLoading && !loadingStudents && currentClass && (
            <>
              
              <List>
                {(currentClass.studentIds || currentClass.students || []).map((s: any, index: number) => {
                  // Handle different data structures
                  const studentId = s._id || s.id;
                  const studentName = s.name || 'Chưa có tên';
                  const studentEmail = s.email || 'Chưa có email';
                  const displayName = studentName !== 'Chưa có tên' ? studentName : studentEmail;
                  
                  // Ensure unique key
                  const uniqueKey = studentId || `student-${index}`;
                  
                  return (
                    <ListItem
                      key={uniqueKey}
                      secondaryAction={
                        <IconButton edge="end" aria-label="delete" onClick={() => removeStudent(studentId)}>
                          <DeleteIcon />
                        </IconButton>
                      }
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: '#EF5B5B' }}>
                          {displayName.charAt(0).toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={displayName} 
                        secondary={studentEmail !== 'Chưa có email' ? studentEmail : ''} 
                      />
                    </ListItem>
                  );
                })}
                  {((currentClass.studentIds || currentClass.students || []).length === 0) && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary" sx={{ mb: 2 }}>Chưa có học sinh nào</Typography>
                    <Button
                      variant="outlined"
                      startIcon={<PersonAddIcon />}
                      onClick={openAddStudent}
                    >
                      Thêm học sinh đầu tiên
                    </Button>
                  </Box>
                )}
              </List>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setManageOpen(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Chỉnh sửa lớp học</DialogTitle>
        <DialogContent>
          <TextField fullWidth margin="dense" label="Tên lớp" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Môn học</InputLabel>
            <Select label="Môn học" value={editCourseId} onChange={(e) => setEditCourseId(e.target.value)}>
              <MenuItem value="">Không chọn</MenuItem>
              {courses.map(c => (
                <MenuItem key={c._id} value={c._id}>{c.title}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Hủy</Button>
          <Button variant="contained" disabled={editLoading || !editTitle.trim()} onClick={saveEdit}>{editLoading ? 'Đang lưu...' : 'Lưu'}</Button>
        </DialogActions>
      </Dialog>

      {/* Add Student Dialog */}
      <Dialog open={addStudentOpen} onClose={() => setAddStudentOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Thêm học sinh vào lớp</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Nhập email của học sinh để tìm kiếm và thêm vào lớp
            </Typography>
            <TextField
              fullWidth
              label="Email học sinh"
              type="email"
              value={studentEmail}
              onChange={(e) => setStudentEmail(e.target.value)}
              placeholder="example@email.com"
              sx={{ mb: 2 }}
            />
            <Button
              variant="outlined"
              onClick={searchStudent}
              disabled={searchingStudent || !studentEmail.trim()}
              startIcon={searchingStudent ? <CircularProgress size={16} /> : null}
            >
              {searchingStudent ? 'Đang tìm...' : 'Tìm học sinh'}
            </Button>
          </Box>

          {foundStudent && (
            <Box sx={{ 
              p: 2, 
              border: '1px solid', 
              borderColor: '#EF5B5B', 
              borderRadius: 2,
              bgcolor: 'rgba(239, 91, 91, 0.05)'
            }}>
              <Typography variant="h6" sx={{ mb: 1 }}>Học sinh được tìm thấy:</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ width: 40, height: 40, bgcolor: '#EF5B5B' }}>
                  {foundStudent.name?.charAt(0) || foundStudent.email?.charAt(0) || 'U'}
                </Avatar>
                <Box>
                  <Typography variant="body1" fontWeight={600}>
                    {foundStudent.name || 'Chưa có tên'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {foundStudent.email}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddStudentOpen(false)}>Hủy</Button>
          <Button 
            variant="contained" 
            disabled={addingStudent || !foundStudent} 
            onClick={addStudent}
          >
            {addingStudent ? 'Đang thêm...' : 'Thêm học sinh'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Classroom Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={cancelDeleteClassroom} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          color: '#FF6B6B',
          fontWeight: 'bold'
        }}>
          <DeleteIcon />
          Xác nhận xóa lớp học
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Bạn có chắc chắn muốn xóa lớp học <strong>"{classroomToDelete?.title || classroomToDelete?.name}"</strong>?
          </Typography>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Cảnh báo:</strong> Hành động này không thể hoàn tác. Tất cả dữ liệu liên quan đến lớp học này sẽ bị xóa vĩnh viễn, bao gồm:
            </Typography>
            <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
              <li>Danh sách học sinh trong lớp</li>
              <li>Bài giảng và nội dung học tập</li>
              <li>Bài tập và bài nộp</li>
              <li>Điểm số và tiến độ học tập</li>
              <li>Tất cả dữ liệu khác liên quan</li>
            </ul>
          </Alert>
          <Typography variant="body2" color="text.secondary">
            Vui lòng nhập tên lớp học để xác nhận: <strong>{classroomToDelete?.title || classroomToDelete?.name}</strong>
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            onClick={cancelDeleteClassroom}
            variant="outlined"
            disabled={deleting}
          >
            Hủy
          </Button>
          <Button 
            onClick={confirmDeleteClassroom}
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            disabled={deleting}
            sx={{
              background: 'linear-gradient(135deg, #FF6B6B 0%, #FF5252 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #FF5252 0%, #F44336 100%)',
              }
            }}
          >
            {deleting ? 'Đang xóa...' : 'Xóa lớp học'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Pagination */}
      {items.length > 0 && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          itemsPerPageOptions={[6, 12, 24, 48]}
          disabled={loading}
        />
      )}
    </Box>
  );
}


