import { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  AvatarGroup,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  CircularProgress,
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { classesApi, ClassroomItem } from '../../../api/admin';
import { useNavigate } from 'react-router-dom';
import GroupIcon from '@mui/icons-material/Group';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { useSocket } from '../../../hooks/useSocket';
import { useTheme } from '../../../contexts/ThemeContext';
import Pagination from '../../../components/Pagination';
import SearchFilterBar from '../../../components/SearchFilterBar';
import { ShimmerBox } from '../../../components/LoadingSkeleton';

export default function MyClassrooms() {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const {
    onClassroomStudentAdded,
    onClassroomStudentRemoved,
    offClassroomStudentAdded,
    offClassroomStudentRemoved,
  } = useSocket();
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
  const [currentClass, setCurrentClass] = useState<
    | (ClassroomItem & { studentsCount?: number; studentIds?: string[]; [key: string]: unknown })
    | null
  >(null);
  const [editOpen, setEditOpen] = useState<boolean>(false);
  const [editLoading, setEditLoading] = useState<boolean>(false);
  const [editTitle, setEditTitle] = useState<string>('');
  // Classrooms no longer link to a course
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('');
  const [addStudentOpen, setAddStudentOpen] = useState<boolean>(false);
  const [studentEmail, setStudentEmail] = useState<string>('');
  const [foundStudent, setFoundStudent] = useState<{
    _id: string;
    name: string;
    email: string;
    [key: string]: unknown;
  } | null>(null);
  const [searchingStudent, setSearchingStudent] = useState<boolean>(false);
  const [addingStudent, setAddingStudent] = useState<boolean>(false);
  const [loadingStudents, setLoadingStudents] = useState<boolean>(false);
  const [studentsPreviewMap, setStudentsPreviewMap] = useState<
    Record<string, Array<{ _id: string; name: string; email: string; [key: string]: unknown }>>
  >({});

  // Delete classroom states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [classroomToDelete, setClassroomToDelete] = useState<ClassroomItem | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [confirmName, setConfirmName] = useState<string>('');

  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await classesApi.listMy(currentPage, itemsPerPage);
      setItems(res.items);
      setTotalItems(res.total || 0);
      setTotalPages(Math.ceil((res.total || 0) / itemsPerPage));
    } catch (e: unknown) {
      const err = e as { response?: { status?: number; data?: { message?: string } } };
      // Handle 401 gracefully - user might not be authenticated
      if (err.response?.status === 401) {
        setItems([]);
        setTotalItems(0);
        setTotalPages(0);
      } else {
        setError(err?.response?.data?.message || 'Không thể tải danh sách lớp');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage]);

  // Load students preview (first 3) for each classroom on the current page
  useEffect(() => {
    let cancelled = false;
    const loadPreviews = async () => {
      try {
        const entries = await Promise.allSettled(
          items.map(async (cls) => {
            try {
              // If already have objects with names, use them directly
              const raw =
                (
                  cls as ClassroomItem & {
                    studentIds?: Array<
                      string | { _id: string; name: string; email: string; [key: string]: unknown }
                    >;
                  }
                ).studentIds || [];
              let students: Array<{
                _id: string;
                name: string;
                email: string;
                [key: string]: unknown;
              }> = [];
              if (raw.length > 0 && typeof raw[0] === 'object') {
                students = raw as Array<{
                  _id: string;
                  name: string;
                  email: string;
                  [key: string]: unknown;
                }>;
              } else {
                students = await classesApi.getStudents(cls._id);
              }
              return [cls._id, (students || []).slice(0, 3)] as [
                string,
                Array<{ _id: string; name: string; email: string; [key: string]: unknown }>,
              ];
            } catch {
              return [cls._id, []] as [
                string,
                Array<{ _id: string; name: string; email: string; [key: string]: unknown }>,
              ];
            }
          }),
        );
        if (cancelled) return;
        const map: Record<
          string,
          Array<{ _id: string; name: string; email: string; [key: string]: unknown }>
        > = {};
        entries.forEach((r) => {
          if (r.status === 'fulfilled') {
            const [id, list] = r.value;
            map[id] = list;
          }
        });
        setStudentsPreviewMap(map);
      } catch {
        // ignore
      }
    };
    if (items.length > 0) loadPreviews();
    return () => {
      cancelled = true;
    };
  }, [items]);

  // Real-time updates for classroom student changes
  useEffect(() => {
    const handleStudentAdded = (data: {
      classroomId: string;
      student: { _id?: string; name?: string; email?: string; [key: string]: unknown };
      timestamp: string;
    }) => {
      if (currentClass && currentClass._id === data.classroomId) {
        // Refresh current class data
        const refreshCurrentClass = async () => {
          try {
            const data = await classesApi.getById(currentClass._id);
            setCurrentClass(
              data as ClassroomItem & {
                studentsCount?: number;
                studentIds?: string[];
                [key: string]: unknown;
              },
            );
          } catch (e) {
            console.error('Failed to refresh current class:', e);
          }
        };
        refreshCurrentClass();
      }
    };

    const handleStudentRemoved = (data: {
      classroomId: string;
      studentId: string;
      timestamp: string;
    }) => {
      if (currentClass && currentClass._id === data.classroomId) {
        // Refresh current class data
        const refreshCurrentClass = async () => {
          try {
            const data = await classesApi.getById(currentClass._id);
            setCurrentClass(
              data as ClassroomItem & {
                studentsCount?: number;
                studentIds?: string[];
                [key: string]: unknown;
              },
            );
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
  }, [
    currentClass,
    onClassroomStudentAdded,
    onClassroomStudentRemoved,
    offClassroomStudentAdded,
    offClassroomStudentRemoved,
  ]);

  const _createClass = async () => {
    if (!title.trim()) return;
    try {
      setCreating(true);
      setError(null);
      const created = await classesApi.create({ title: title.trim() });
      setSuccess('Đã tạo lớp: ' + created.title);
      setOpen(false);
      setTitle('');
      fetchClasses();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err?.response?.data?.message || 'Không thể tạo lớp');
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
      const payload: { title: string } = { title: title.trim() };
      await classesApi.create(payload);
      setSuccess('Đã tạo lớp');
      setOpen(false);
      setTitle('');
      setDialogError(null);
      fetchClasses();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setDialogError(err?.response?.data?.message || 'Không thể tạo lớp');
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
          // Store students in a separate property for rendering
          (
            data as unknown as {
              students?: Array<{
                _id: string;
                name: string;
                email: string;
                [key: string]: unknown;
              }>;
            }
          ).students = students;
        } catch (e) {
          console.error('Failed to fetch students separately:', e);
        } finally {
          setLoadingStudents(false);
        }
      }

      setCurrentClass(
        data as ClassroomItem & {
          studentsCount?: number;
          studentIds?: string[];
          [key: string]: unknown;
        },
      );
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err?.response?.data?.message || 'Không thể tải thành viên lớp');
    } finally {
      setManageLoading(false);
    }
  };

  const openEdit = async (cls: ClassroomItem) => {
    setCurrentClass(
      cls as ClassroomItem & {
        studentsCount?: number;
        studentIds?: string[];
        [key: string]: unknown;
      },
    );
    setEditTitle(cls.title || '');
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!currentClass) return;
    try {
      setEditLoading(true);
      const data: { title: string } = { title: editTitle.trim() };
      await classesApi.update(currentClass._id || (currentClass as { id?: string }).id || '', data);
      setSuccess('Đã cập nhật lớp');
      setEditOpen(false);
      fetchClasses();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err?.response?.data?.message || 'Không thể cập nhật lớp');
    } finally {
      setEditLoading(false);
    }
  };

  const removeStudent = async (studentId: string) => {
    if (!currentClass) return;
    try {
      const classId = (currentClass as { id?: string }).id || currentClass._id;
      await classesApi.removeStudent(classId, studentId);
      // Refresh current class
      const data = await classesApi.getById(classId);
      setCurrentClass(
        data as ClassroomItem & {
          studentsCount?: number;
          studentIds?: string[];
          [key: string]: unknown;
        },
      );
      setSuccess('Đã xóa học sinh khỏi lớp');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err?.response?.data?.message || 'Không thể xóa học sinh');
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
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err?.response?.data?.message || 'Không tìm thấy học sinh với email này');
      setFoundStudent(null);
    } finally {
      setSearchingStudent(false);
    }
  };

  const addStudent = async () => {
    if (!currentClass || !foundStudent) return;
    try {
      setAddingStudent(true);
      const classId = (currentClass as { id?: string }).id || currentClass._id;
      await classesApi.addStudent(classId, foundStudent._id);
      // Refresh current class
      const data = await classesApi.getById(classId);
      setCurrentClass(
        data as ClassroomItem & {
          studentsCount?: number;
          studentIds?: string[];
          [key: string]: unknown;
        },
      );
      setSuccess('Đã thêm học sinh vào lớp');
      setAddStudentOpen(false);
      setStudentEmail('');
      setFoundStudent(null);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err?.response?.data?.message || 'Không thể thêm học sinh');
    } finally {
      setAddingStudent(false);
    }
  };

  // Delete classroom functions
  const openDeleteDialog = (classroom: ClassroomItem) => {
    setClassroomToDelete(classroom);
    setDeleteDialogOpen(true);
    setConfirmName('');
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
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err?.response?.data?.message || 'Không thể xóa lớp học');
    } finally {
      setDeleting(false);
    }
  };

  const cancelDeleteClassroom = () => {
    setDeleteDialogOpen(false);
    setClassroomToDelete(null);
    setConfirmName('');
  };

  const renderStudentsList = () => {
    if (!currentClass) return null;
    const currentClassWithStudents = currentClass as {
      studentIds?: Array<
        | string
        | { _id?: string; id?: string; name?: string; email?: string; [key: string]: unknown }
      >;
      students?: Array<{
        _id?: string;
        id?: string;
        name?: string;
        email?: string;
        [key: string]: unknown;
      }>;
    };
    const studentsList = (currentClassWithStudents.studentIds ||
      currentClassWithStudents.students ||
      []) as Array<{
      _id?: string;
      id?: string;
      name?: string;
      email?: string;
      [key: string]: unknown;
    }>;
    if (studentsList.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Chưa có học sinh nào
          </Typography>
          <Button variant="outlined" startIcon={<PersonAddIcon />} onClick={openAddStudent}>
            Thêm học sinh đầu tiên
          </Button>
        </Box>
      );
    }
    return (
      <List>
        {studentsList.map(
          (
            s: { _id?: string; id?: string; name?: string; email?: string; [key: string]: unknown },
            index: number,
          ) => {
            const studentId = s._id || s.id || '';
            const studentName = s.name || 'Chưa có tên';
            const studentEmail = s.email || 'Chưa có email';
            const displayName = studentName !== 'Chưa có tên' ? studentName : studentEmail;
            const uniqueKey = studentId || `student-${index}`;
            return (
              <ListItem
                key={uniqueKey}
                secondaryAction={
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => removeStudent(studentId)}
                  >
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: '#EF5B5B' }}>{displayName.charAt(0).toUpperCase()}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={displayName}
                  secondary={studentEmail !== 'Chưa có email' ? studentEmail : ''}
                />
              </ListItem>
            );
          },
        )}
      </List>
    );
  };

  // Search and filter handlers
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleFilterChange = (_filterKey: string, _value: string) => {
    // No filters needed
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
  };

  const handleClearAll = () => {
    setSearchTerm('');
    setSortBy('');
  };

  // Filter and sort items
  const filteredAndSortedItems = items
    .filter((item) => {
      // Search filter
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        const titleMatch = (item.title || (item as ClassroomItem & { name?: string }).name || '')
          .toLowerCase()
          .includes(searchLower);
        if (!titleMatch) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (!sortBy) return 0;

      switch (sortBy) {
        case 'name-asc':
          return (a.title || (a as ClassroomItem & { name?: string }).name || '').localeCompare(
            b.title || (b as ClassroomItem & { name?: string }).name || '',
          );
        case 'name-desc':
          return (b.title || (b as ClassroomItem & { name?: string }).name || '').localeCompare(
            a.title || (a as ClassroomItem & { name?: string }).name || '',
          );
        case 'students-asc':
          return (
            ((a as ClassroomItem & { studentsCount?: number }).studentsCount || 0) -
            ((b as ClassroomItem & { studentsCount?: number }).studentsCount || 0)
          );
        case 'students-desc':
          return (
            ((b as ClassroomItem & { studentsCount?: number }).studentsCount || 0) -
            ((a as ClassroomItem & { studentsCount?: number }).studentsCount || 0)
          );
        case 'created-asc':
          return (
            new Date((a as ClassroomItem & { createdAt?: string }).createdAt || 0).getTime() -
            new Date((b as ClassroomItem & { createdAt?: string }).createdAt || 0).getTime()
          );
        case 'created-desc':
          return (
            new Date((b as ClassroomItem & { createdAt?: string }).createdAt || 0).getTime() -
            new Date((a as ClassroomItem & { createdAt?: string }).createdAt || 0).getTime()
          );
        default:
          return 0;
      }
    });

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: darkMode ? '#FFFFFF' : 'inherit',
          }}
        >
          Lớp của tôi
        </Typography>
        <Box display="flex" gap={2}>
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
              },
            }}
          >
            Tạo lớp
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Search and Filter Bar */}
      <SearchFilterBar
        searchValue={searchTerm}
        onSearchChange={handleSearchChange}
        onFilterChange={handleFilterChange}
        searchPlaceholder="Tìm kiếm lớp học..."
        sortOptions={[
          { value: 'name-asc', label: 'Tên A-Z' },
          { value: 'name-desc', label: 'Tên Z-A' },
          { value: 'students-asc', label: 'Số học sinh ít nhất' },
          { value: 'students-desc', label: 'Số học sinh nhiều nhất' },
          { value: 'created-asc', label: 'Tạo mới nhất' },
          { value: 'created-desc', label: 'Tạo cũ nhất' },
        ]}
        sortValue={sortBy}
        onSortChange={handleSortChange}
        onClearAll={handleClearAll}
        sx={{ mb: 3 }}
      />

      {loading ? (
        <Grid container spacing={2}>
          {Array.from({ length: itemsPerPage }).map((_, idx) => (
            <Grid item xs={12} sm={6} lg={4} key={idx}>
              <Card
                sx={{
                  borderRadius: 4,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  background: darkMode
                    ? 'linear-gradient(135deg, #1f2937 0%, #111827 100%)'
                    : 'linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%)',
                  border: darkMode
                    ? '1px solid rgba(255, 255, 255, 0.08)'
                    : '1px solid rgba(239, 91, 91, 0.1)',
                }}
              >
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  {/* Icon and title skeleton */}
                  <Box display="flex" alignItems="center" gap={2} sx={{ mb: 2 }}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 3,
                        background:
                          'linear-gradient(90deg, #e0e0e0 0px, #f0f0f0 40px, #e0e0e0 80px)',
                        backgroundSize: '1000px 100%',
                        animation: 'shimmer 2s infinite linear',
                        '@keyframes shimmer': {
                          '0%': { backgroundPosition: '-1000px 0' },
                          '100%': { backgroundPosition: '1000px 0' },
                        },
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 48,
                        height: 48,
                      }}
                    />
                    <ShimmerBox width="60%" height="24px" borderRadius="4px" />
                  </Box>

                  {/* Students count and avatars skeleton */}
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ mb: 2 }}
                  >
                    <ShimmerBox width="100px" height="16px" borderRadius="4px" />
                    <Box display="flex" gap={0.5}>
                      {Array.from({ length: 3 }).map((_, i) => (
                        <ShimmerBox key={i} width="32px" height="32px" borderRadius="50%" />
                      ))}
                    </Box>
                  </Box>

                  {/* Invite code skeleton */}
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: darkMode
                        ? 'rgba(239, 91, 91, 0.1)'
                        : 'rgba(239, 91, 91, 0.05)',
                      border: darkMode
                        ? '1px solid rgba(239, 91, 91, 0.3)'
                        : '1px solid rgba(239, 91, 91, 0.1)',
                      mb: 2,
                    }}
                  >
                    <ShimmerBox width="80%" height="16px" borderRadius="4px" />
                  </Box>
                </CardContent>

                {/* Buttons skeleton */}
                <Box sx={{ p: 3, pt: 0 }}>
                  <Box display="flex" flexWrap="wrap" gap={1.5}>
                    {Array.from({ length: 4 }).map((_, i) => (
                      <ShimmerBox key={i} width="80px" height="32px" borderRadius="8px" />
                    ))}
                  </Box>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Grid container spacing={2}>
          {filteredAndSortedItems.map((c) => (
            <Grid item xs={12} sm={6} lg={4} key={c._id}>
              <Card
                sx={{
                  borderRadius: 4,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  background: darkMode
                    ? 'linear-gradient(135deg, #1f2937 0%, #111827 100%)'
                    : 'linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%)',
                  border: darkMode
                    ? '1px solid rgba(255, 255, 255, 0.08)'
                    : '1px solid rgba(239, 91, 91, 0.1)',
                  boxShadow: darkMode
                    ? '0 4px 20px rgba(0,0,0,0.35)'
                    : '0 4px 20px rgba(239, 91, 91, 0.1)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: darkMode
                      ? '0 8px 30px rgba(0,0,0,0.5)'
                      : '0 8px 30px rgba(239, 91, 91, 0.2)',
                    border: darkMode
                      ? '1px solid rgba(255, 255, 255, 0.15)'
                      : '1px solid rgba(239, 91, 91, 0.2)',
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Box display="flex" alignItems="center" gap={2} sx={{ mb: 2 }}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <SchoolIcon sx={{ color: 'white', fontSize: 24 }} />
                    </Box>
                    <Typography
                      variant="h6"
                      fontWeight="600"
                      sx={{ color: darkMode ? '#E5E7EB' : '#333333' }}
                    >
                      {c.title || (c as ClassroomItem & { name?: string }).name}
                    </Typography>
                  </Box>
                  {/* course info removed */}
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ mb: 2 }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ color: darkMode ? '#D1D5DB' : '#777777', fontWeight: 500 }}
                    >
                      {Math.max(
                        0,
                        (c as ClassroomItem & { studentsCount?: number }).studentsCount ??
                          (c.studentIds || []).length,
                      )}{' '}
                      học sinh
                    </Typography>
                    <AvatarGroup
                      max={3}
                      sx={{
                        '& .MuiAvatar-root': {
                          width: 32,
                          height: 32,
                          fontSize: 14,
                          border: '2px solid white',
                        },
                      }}
                    >
                      {(studentsPreviewMap[c._id] || []).map((s, idx) => {
                        const display = s?.name || s?.email || 'U';
                        const letter = String(display).charAt(0).toUpperCase();
                        const bg = idx === 0 ? '#EF5B5B' : idx === 1 ? '#AED6E6' : '#FF7B7B';
                        return (
                          <Avatar
                            key={s?._id || idx}
                            src={(s?.avatarUrl || s?.avatar) as string | undefined}
                            sx={{
                              bgcolor: s?.avatarUrl ? undefined : bg,
                              color: idx === 1 ? '#333333' : '#fff',
                            }}
                          >
                            {!s?.avatarUrl && letter}
                          </Avatar>
                        );
                      })}
                    </AvatarGroup>
                  </Box>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: darkMode
                        ? 'rgba(239, 91, 91, 0.1)'
                        : 'rgba(239, 91, 91, 0.05)',
                      border: darkMode
                        ? '1px solid rgba(239, 91, 91, 0.3)'
                        : '1px solid rgba(239, 91, 91, 0.1)',
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ color: darkMode ? '#E5E7EB' : '#777777', fontWeight: 500 }}
                    >
                      Mã mời:{' '}
                      <span style={{ fontWeight: 600, color: darkMode ? '#FCA5A5' : '#EF5B5B' }}>
                        {c.inviteCode || '-'}
                      </span>
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
                        borderColor: darkMode ? 'rgba(255,255,255,0.25)' : '#AED6E6',
                        color: darkMode ? '#E5E7EB' : '#333333',
                        '&:hover': {
                          borderColor: darkMode ? 'rgba(255,255,255,0.35)' : '#7BB3D1',
                          backgroundColor: darkMode
                            ? 'rgba(255,255,255,0.06)'
                            : 'rgba(174, 214, 230, 0.1)',
                        },
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
                        background: darkMode
                          ? 'linear-gradient(135deg, #F43F5E 0%, #FB7185 100%)'
                          : 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
                        boxShadow: '0 2px 10px rgba(239, 91, 91, 0.3)',
                        '&:hover': {
                          background: darkMode
                            ? 'linear-gradient(135deg, #E11D48 0%, #F43F5E 100%)'
                            : 'linear-gradient(135deg, #D94A4A 0%, #EF5B5B 100%)',
                          boxShadow: '0 4px 15px rgba(239, 91, 91, 0.4)',
                        },
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
                        borderColor: darkMode ? 'rgba(255,255,255,0.25)' : '#AED6E6',
                        color: darkMode ? '#E5E7EB' : '#333333',
                        '&:hover': {
                          borderColor: darkMode ? 'rgba(255,255,255,0.35)' : '#7BB3D1',
                          backgroundColor: darkMode
                            ? 'rgba(255,255,255,0.06)'
                            : 'rgba(174, 214, 230, 0.1)',
                        },
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
                        borderColor: darkMode ? 'rgba(255,255,255,0.25)' : '#AED6E6',
                        color: darkMode ? '#E5E7EB' : '#333333',
                        '&:hover': {
                          borderColor: darkMode ? 'rgba(255,255,255,0.35)' : '#7BB3D1',
                          backgroundColor: darkMode
                            ? 'rgba(255,255,255,0.06)'
                            : 'rgba(174, 214, 230, 0.1)',
                        },
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
                        borderColor: darkMode ? 'rgba(255,255,255,0.25)' : '#AED6E6',
                        color: darkMode ? '#E5E7EB' : '#333333',
                        '&:hover': {
                          borderColor: darkMode ? 'rgba(255,255,255,0.35)' : '#7BB3D1',
                          backgroundColor: darkMode
                            ? 'rgba(255,255,255,0.06)'
                            : 'rgba(174, 214, 230, 0.1)',
                        },
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
                        borderColor: darkMode ? '#F87171' : '#FF6B6B',
                        color: darkMode ? '#FCA5A5' : '#FF6B6B',
                        '&:hover': {
                          borderColor: darkMode ? '#EF4444' : '#FF5252',
                          backgroundColor: darkMode
                            ? 'rgba(239, 68, 68, 0.1)'
                            : 'rgba(255, 107, 107, 0.1)',
                          color: darkMode ? '#FCA5A5' : '#FF5252',
                        },
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
      )}

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 4,
            background: darkMode
              ? 'linear-gradient(135deg, #111827 0%, #0B1220 100%)'
              : 'linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%)',
            border: darkMode
              ? '1px solid rgba(255,255,255,0.08)'
              : '1px solid rgba(239, 91, 91, 0.1)',
            boxShadow: darkMode
              ? '0 8px 32px rgba(0,0,0,0.4)'
              : '0 8px 32px rgba(239, 91, 91, 0.15)',
          },
        }}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
            color: 'white',
            fontWeight: 600,
            fontSize: '1.25rem',
          }}
        >
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
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                backgroundColor: darkMode ? 'rgba(255,255,255,0.06)' : undefined,
                '& fieldset': {
                  borderColor: darkMode ? 'rgba(255,255,255,0.18)' : undefined,
                },
                '&:hover fieldset': {
                  borderColor: darkMode ? 'rgba(255,255,255,0.28)' : undefined,
                },
                '&.Mui-focused fieldset': {
                  borderColor: darkMode ? '#FCA5A5' : undefined,
                },
              },
              '& .MuiInputBase-input': { color: darkMode ? '#F3F4F6' : undefined },
              '& .MuiInputLabel-root': { color: darkMode ? '#E5E7EB' : undefined },
            }}
          />
          {/* Course selection removed */}
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
                backgroundColor: 'rgba(174, 214, 230, 0.1)',
              },
            }}
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            disabled={creating || !title.trim()}
            onClick={async () => {
              await createClassWithCourse();
            }}
            sx={{
              background: 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
              boxShadow: '0 4px 15px rgba(239, 91, 91, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #D94A4A 0%, #EF5B5B 100%)',
                boxShadow: '0 6px 20px rgba(239, 91, 91, 0.4)',
              },
              '&:disabled': {
                background: '#cccccc',
                boxShadow: 'none',
              },
            }}
          >
            {creating ? 'Đang tạo...' : 'Tạo lớp'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={manageOpen}
        onClose={() => setManageOpen(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: darkMode ? 'linear-gradient(135deg, #111827 0%, #0B1220 100%)' : undefined,
          },
        }}
      >
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
          {!manageLoading && !loadingStudents && renderStudentsList()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setManageOpen(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: darkMode ? 'linear-gradient(135deg, #111827 0%, #0B1220 100%)' : undefined,
          },
        }}
      >
        <DialogTitle>Chỉnh sửa lớp học</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            margin="dense"
            label="Tên lớp"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Hủy</Button>
          <Button
            variant="contained"
            disabled={editLoading || !editTitle.trim()}
            onClick={saveEdit}
          >
            {editLoading ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Student Dialog */}
      <Dialog
        open={addStudentOpen}
        onClose={() => setAddStudentOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: darkMode ? 'linear-gradient(135deg, #111827 0%, #0B1220 100%)' : undefined,
          },
        }}
      >
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
            <Box
              sx={{
                p: 2,
                border: '1px solid',
                borderColor: '#EF5B5B',
                borderRadius: 2,
                bgcolor: 'rgba(239, 91, 91, 0.05)',
              }}
            >
              <Typography variant="h6" sx={{ mb: 1 }}>
                Học sinh được tìm thấy:
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ width: 40, height: 40, bgcolor: darkMode ? '#F43F5E' : '#EF5B5B' }}>
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
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            color: '#FF6B6B',
            fontWeight: 'bold',
          }}
        >
          <DeleteIcon />
          Xác nhận xóa lớp học
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Bạn có chắc chắn muốn xóa lớp học{' '}
            <strong>
              &quot;
              {classroomToDelete?.title ||
                (classroomToDelete as ClassroomItem & { name?: string })?.name}
              &quot;
            </strong>
            ?
          </Typography>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Cảnh báo:</strong> Hành động này không thể hoàn tác. Tất cả dữ liệu liên quan
              đến lớp học này sẽ bị xóa vĩnh viễn, bao gồm:
            </Typography>
            <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
              <li>Danh sách học sinh trong lớp</li>
              <li>Bài giảng và nội dung học tập</li>
              <li>Bài tập và bài nộp</li>
              <li>Điểm số và tiến độ học tập</li>
              <li>Tất cả dữ liệu khác liên quan</li>
            </ul>
          </Alert>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Vui lòng nhập tên lớp học để xác nhận:{' '}
            <strong>
              {classroomToDelete?.title ||
                (classroomToDelete as ClassroomItem & { name?: string })?.name}
            </strong>
          </Typography>
          <TextField
            fullWidth
            size="small"
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            placeholder={
              classroomToDelete?.title ||
              (classroomToDelete as ClassroomItem & { name?: string })?.name ||
              ''
            }
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button onClick={cancelDeleteClassroom} variant="outlined" disabled={deleting}>
            Hủy
          </Button>
          <Button
            onClick={confirmDeleteClassroom}
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            disabled={
              deleting ||
              !classroomToDelete ||
              confirmName.trim() !==
                (
                  classroomToDelete?.title ||
                  (classroomToDelete as ClassroomItem & { name?: string })?.name ||
                  ''
                ).trim()
            }
            sx={{
              background: 'linear-gradient(135deg, #FF6B6B 0%, #FF5252 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #FF5252 0%, #F44336 100%)',
              },
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
