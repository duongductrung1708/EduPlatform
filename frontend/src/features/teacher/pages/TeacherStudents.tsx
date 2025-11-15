import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Paper,
  Divider,
  Alert,
  Avatar,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import SearchIcon from '@mui/icons-material/Search';
import SchoolIcon from '@mui/icons-material/School';
import EmailIcon from '@mui/icons-material/Email';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import { classesApi, ClassroomItem } from '../../../api/admin';
import { useTheme } from '../../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { ShimmerBox, DarkShimmerBox } from '../../../components/LoadingSkeleton';

interface Student {
  _id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  classrooms?: string[];
}

export default function TeacherStudents() {
  const { darkMode } = useTheme();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassroom, setSelectedClassroom] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [classroomList, setClassroomList] = useState<string[]>([]);

  // Theme colors
  const primaryTextColor = darkMode ? '#f8fafc' : '#102a43';
  const secondaryTextColor = darkMode ? 'rgba(248, 250, 252, 0.7)' : 'rgba(16, 42, 67, 0.64)';
  const cardBackground = darkMode
    ? 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)'
    : 'linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%)';
  const surfaceBorder = darkMode ? 'rgba(148, 163, 184, 0.2)' : 'rgba(239, 91, 91, 0.12)';

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    // Filter and sort students
    let filtered = [...students];

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (student) =>
          student.name.toLowerCase().includes(term) ||
          student.email.toLowerCase().includes(term) ||
          student.classrooms?.some((c) => c.toLowerCase().includes(term))
      );
    }

    // Filter by classroom
    if (selectedClassroom !== 'all') {
      filtered = filtered.filter((student) =>
        student.classrooms?.includes(selectedClassroom)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'email':
          return a.email.localeCompare(b.email);
        case 'classrooms':
          return (b.classrooms?.length || 0) - (a.classrooms?.length || 0);
        default:
          return 0;
      }
    });

    setFilteredStudents(filtered);
  }, [searchTerm, students, selectedClassroom, sortBy]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all classrooms for the teacher
      let classrooms: ClassroomItem[] = [];
      try {
        const classroomsResponse = await classesApi.listMy(1, 100);
        classrooms = classroomsResponse.items || [];
      } catch (err: unknown) {
        const error = err as { response?: { status?: number; data?: { message?: string } } };
        if (error?.response?.status === 401) {
          setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          setStudents([]);
          return;
        }
        throw err;
      }

      if (classrooms.length === 0) {
        setStudents([]);
        setFilteredStudents([]);
        return;
      }

      // Collect all unique students from all classrooms
      const studentMap = new Map<string, Student>();
      const classroomsSet = new Set<string>();

      for (const classroom of classrooms) {
        try {
          const classroomStudents = await classesApi.getStudents(classroom._id);
          const classroomName = (classroom as ClassroomItem & { name?: string }).title || (classroom as ClassroomItem & { name?: string }).name || 'Lớp học';
          classroomsSet.add(classroomName);

          classroomStudents.forEach((student: { _id: string; name: string; email: string; avatarUrl?: string; [key: string]: unknown }) => {
            const studentId = student._id || student.id;
            if (!studentId) return;

            if (studentMap.has(studentId)) {
              // Student already exists, add classroom to their list
              const existing = studentMap.get(studentId)!;
              if (!existing.classrooms) {
                existing.classrooms = [];
              }
              if (!existing.classrooms.includes(classroomName)) {
                existing.classrooms.push(classroomName);
              }
            } else {
              // New student
              studentMap.set(studentId, {
                _id: studentId,
                name: student.name || 'Chưa có tên',
                email: student.email || 'Chưa có email',
                avatarUrl: student.avatarUrl,
                classrooms: [classroomName],
              });
            }
          });
        } catch (err) {
          // Skip classrooms that fail to load students
        }
      }

      const allStudents = Array.from(studentMap.values());
      // Sort by name initially
      allStudents.sort((a, b) => a.name.localeCompare(b.name));

      setClassroomList(Array.from(classroomsSet).sort());
      setStudents(allStudents);
      setFilteredStudents(allStudents);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string; error?: string } }; message?: string };
      const apiMsg = error?.response?.data?.message || error?.response?.data?.error || error?.message;
      setError(apiMsg || 'Không thể tải danh sách học sinh');
    } finally {
      setLoading(false);
    }
  };

  const renderLoadingSkeleton = () => {
    const Shimmer = darkMode ? DarkShimmerBox : ShimmerBox;
    return (
      <Grid container spacing={3}>
        {Array.from({ length: 6 }).map((_, index) => (
          <Grid item xs={12} md={6} lg={4} key={index}>
            <Card
              sx={{
                background: cardBackground,
                border: `1px solid ${surfaceBorder}`,
                borderRadius: 3,
                overflow: 'hidden',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Shimmer height="56px" width="56px" borderRadius="50%" />
                  <Box sx={{ flex: 1, ml: 2 }}>
                    <Shimmer height="20px" width="60%" borderRadius="4px" />
                    <Box sx={{ mt: 1 }}>
                      <Shimmer height="16px" width="80%" borderRadius="4px" />
                    </Box>
                  </Box>
                </Box>
                <Divider sx={{ my: 2, borderColor: surfaceBorder }} />
                <Box>
                  <Shimmer height="14px" width="40%" borderRadius="4px" />
                  <Box sx={{ mt: 1.5, display: 'flex', gap: 0.5 }}>
                    <Shimmer height="24px" width="80px" borderRadius="12px" />
                    <Shimmer height="24px" width="100px" borderRadius="12px" />
                    <Shimmer height="24px" width="70px" borderRadius="12px" />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 3, fontWeight: 600, color: primaryTextColor }}>
          Học sinh
        </Typography>
        {renderLoadingSkeleton()}
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 3, fontWeight: 600, color: primaryTextColor }}>
          Học sinh
        </Typography>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: primaryTextColor }}>
          Học sinh
        </Typography>
        <Chip
          icon={<PeopleIcon />}
          label={`${filteredStudents.length} học sinh`}
          sx={{
            bgcolor: darkMode ? 'rgba(239, 91, 91, 0.2)' : 'rgba(239, 91, 91, 0.1)',
            color: '#EF5B5B',
            fontWeight: 600,
          }}
        />
      </Box>

      <Box sx={{ mb: 3 }}>
        <Stack spacing={2}>
          <TextField
            fullWidth
            placeholder="Tìm kiếm học sinh theo tên, email hoặc lớp học..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: secondaryTextColor }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                background: cardBackground,
                borderColor: surfaceBorder,
                '&:hover': {
                  borderColor: '#EF5B5B',
                },
                '&.Mui-focused': {
                  borderColor: '#EF5B5B',
                },
              },
              '& .MuiInputBase-input': {
                color: primaryTextColor,
              },
            }}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <FormControl fullWidth sx={{ minWidth: 200 }}>
              <InputLabel
                sx={{
                  color: secondaryTextColor,
                  '&.Mui-focused': {
                    color: '#EF5B5B',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <FilterListIcon sx={{ fontSize: 18 }} />
                  Lọc theo lớp
                </Box>
              </InputLabel>
              <Select
                value={selectedClassroom}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <FilterListIcon sx={{ fontSize: 18 }} />
                    Lọc theo lớp
                  </Box>
                }
                onChange={(e) => setSelectedClassroom(e.target.value)}
                sx={{
                  background: cardBackground,
                  color: primaryTextColor,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: surfaceBorder,
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#EF5B5B',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#EF5B5B',
                  },
                  '& .MuiSvgIcon-root': {
                    color: secondaryTextColor,
                  },
                }}
              >
                <MenuItem value="all">Tất cả lớp học</MenuItem>
                {classroomList.map((classroom) => (
                  <MenuItem key={classroom} value={classroom}>
                    {classroom}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ minWidth: 200 }}>
              <InputLabel
                sx={{
                  color: secondaryTextColor,
                  '&.Mui-focused': {
                    color: '#EF5B5B',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <SortIcon sx={{ fontSize: 18 }} />
                  Sắp xếp
                </Box>
              </InputLabel>
              <Select
                value={sortBy}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <SortIcon sx={{ fontSize: 18 }} />
                    Sắp xếp
                  </Box>
                }
                onChange={(e) => setSortBy(e.target.value)}
                sx={{
                  background: cardBackground,
                  color: primaryTextColor,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: surfaceBorder,
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#EF5B5B',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#EF5B5B',
                  },
                  '& .MuiSvgIcon-root': {
                    color: secondaryTextColor,
                  },
                }}
              >
                <MenuItem value="name">Theo tên (A-Z)</MenuItem>
                <MenuItem value="email">Theo email (A-Z)</MenuItem>
                <MenuItem value="classrooms">Theo số lớp học (nhiều nhất)</MenuItem>
              </Select>
            </FormControl>
          </Stack>
          {(selectedClassroom !== 'all' || searchTerm) && (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
              {selectedClassroom !== 'all' && (
                <Chip
                  label={`Lớp: ${selectedClassroom}`}
                  onDelete={() => setSelectedClassroom('all')}
                  sx={{
                    bgcolor: darkMode ? 'rgba(239, 91, 91, 0.2)' : 'rgba(239, 91, 91, 0.1)',
                    color: '#EF5B5B',
                    '& .MuiChip-deleteIcon': {
                      color: '#EF5B5B',
                    },
                  }}
                />
              )}
              {searchTerm && (
                <Chip
                  label={`Tìm: ${searchTerm}`}
                  onDelete={() => setSearchTerm('')}
                  sx={{
                    bgcolor: darkMode ? 'rgba(239, 91, 91, 0.2)' : 'rgba(239, 91, 91, 0.1)',
                    color: '#EF5B5B',
                    '& .MuiChip-deleteIcon': {
                      color: '#EF5B5B',
                    },
                  }}
                />
              )}
            </Box>
          )}
        </Stack>
      </Box>

      {filteredStudents.length === 0 ? (
        <Paper
          sx={{
            p: 6,
            textAlign: 'center',
            background: cardBackground,
            border: `1px solid ${surfaceBorder}`,
            borderRadius: 3,
          }}
        >
          <PeopleIcon sx={{ fontSize: 64, color: secondaryTextColor, mb: 2 }} />
          <Typography variant="h6" sx={{ color: primaryTextColor, mb: 1 }}>
            {searchTerm ? 'Không tìm thấy học sinh nào' : 'Chưa có học sinh nào'}
          </Typography>
          <Typography variant="body2" sx={{ color: secondaryTextColor }}>
            {searchTerm
              ? 'Thử tìm kiếm với từ khóa khác'
              : 'Thêm học sinh vào lớp học của bạn để bắt đầu'}
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredStudents.map((student) => (
            <Grid item xs={12} md={6} lg={4} key={student._id}>
              <Card
                sx={{
                  background: cardBackground,
                  border: `1px solid ${surfaceBorder}`,
                  borderRadius: 3,
                  height: '100%',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: darkMode
                      ? '0 12px 24px rgba(0, 0, 0, 0.4)'
                      : '0 12px 24px rgba(239, 91, 91, 0.15)',
                    borderColor: '#EF5B5B',
                  },
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar
                      src={student.avatarUrl}
                      sx={{
                        width: 56,
                        height: 56,
                        bgcolor: '#EF5B5B',
                        mr: 2,
                        fontSize: 24,
                        fontWeight: 600,
                      }}
                    >
                      {student.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          color: primaryTextColor,
                          mb: 0.5,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {student.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <EmailIcon sx={{ fontSize: 14, color: secondaryTextColor }} />
                        <Typography
                          variant="body2"
                          sx={{
                            color: secondaryTextColor,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {student.email}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Divider sx={{ my: 2, borderColor: surfaceBorder }} />

                  {student.classrooms && student.classrooms.length > 0 && (
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <SchoolIcon sx={{ fontSize: 16, color: secondaryTextColor, mr: 0.5 }} />
                        <Typography variant="caption" sx={{ color: secondaryTextColor, fontWeight: 600 }}>
                          Lớp học ({student.classrooms.length})
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {student.classrooms.slice(0, 3).map((classroom, index) => (
                          <Chip
                            key={index}
                            label={classroom}
                            size="small"
                            sx={{
                              bgcolor: darkMode ? 'rgba(239, 91, 91, 0.2)' : 'rgba(239, 91, 91, 0.1)',
                              color: '#EF5B5B',
                              fontSize: '0.7rem',
                              height: 24,
                            }}
                          />
                        ))}
                        {student.classrooms.length > 3 && (
                          <Chip
                            label={`+${student.classrooms.length - 3}`}
                            size="small"
                            sx={{
                              bgcolor: darkMode ? 'rgba(148, 163, 184, 0.2)' : 'rgba(148, 163, 184, 0.1)',
                              color: secondaryTextColor,
                              fontSize: '0.7rem',
                              height: 24,
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}

