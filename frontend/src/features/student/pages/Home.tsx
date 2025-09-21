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
  Alert,
  Tabs,
  Tab,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import PublicIcon from '@mui/icons-material/Public';
import StarIcon from '@mui/icons-material/Star';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import { coursesApi, CourseItem } from '../../../api/courses';
import { useNavigate } from 'react-router-dom';
import { SkeletonStats, SkeletonGrid } from '../../../components/LoadingSkeleton';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import ClassSelectionDialog from '../../../components/ClassSelectionDialog';
import Pagination from '../../../components/Pagination';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function StudentHome() {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { user, selectedSubject, setSelectedSubject, selectedGradeLevel, setSelectedGradeLevel, selectedCourse, setSelectedCourse } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [enrolledCourses, setEnrolledCourses] = useState<CourseItem[]>([]);
  const [publicCourses, setPublicCourses] = useState<CourseItem[]>([]);
  const [filteredPublicCourses, setFilteredPublicCourses] = useState<CourseItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination states for public courses
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [availableLevels, setAvailableLevels] = useState<string[]>([]);
  const [showClassSelection, setShowClassSelection] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Simulate loading delay for better UX
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Load enrolled courses
        const enrolledRes = await coursesApi.getMyEnrolled();
        setEnrolledCourses(enrolledRes || []);
        
        // Load public courses with pagination
        const publicRes = await coursesApi.listPublic(currentPage, itemsPerPage);
        setPublicCourses(publicRes.items || []);
        setFilteredPublicCourses(publicRes.items || []);
        setTotalItems(publicRes.total || 0);
        setTotalPages(Math.ceil((publicRes.total || 0) / itemsPerPage));
        
        // Extract unique subjects and levels from all courses (for filters)
        const allCoursesRes = await coursesApi.getPublic();
        const subjects = [...new Set(allCoursesRes?.map(course => course.category).filter(Boolean) || [])] as string[];
        const levels = [...new Set(allCoursesRes?.map(course => course.level).filter(Boolean) || [])] as string[];
        setAvailableSubjects(subjects);
        setAvailableLevels(levels);
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Không thể tải dữ liệu môn học');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentPage, itemsPerPage]);

  // Hiển thị dialog chọn lớp nếu học sinh chưa chọn đầy đủ
  useEffect(() => {
    if (user?.role === 'student' && (!selectedSubject || !selectedGradeLevel) && !loading) {
      setShowClassSelection(true);
    }
  }, [user, selectedSubject, selectedGradeLevel, loading]);

  // Filter and search effect
  useEffect(() => {
    let filtered = publicCourses;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(course => 
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      // console.log('📝 After search filter:', filtered.length);
    }
    
    // Apply subject filter - ưu tiên môn học đã chọn
    if (selectedSubject) {
      // Chỉ hiển thị môn học đã chọn
      filtered = filtered.filter(course => {
        const match = course.category === selectedSubject.name;
        // console.log(`📚 Subject filter: ${course.title} (${course.category}) === ${selectedSubject.name} = ${match}`);
        return match;
      });
      // console.log('📚 After subject filter (selected):', filtered.length);
    } else if (selectedSubjectFilter) {
      // Chỉ áp dụng subject filter khi không có selectedSubject
      filtered = filtered.filter(course => {
        const match = course.category === selectedSubjectFilter;
        // console.log(`📚 Subject filter: ${course.title} (${course.category}) === ${selectedSubjectFilter} = ${match}`);
        return match;
      });
      // console.log('📚 After subject filter (manual):', filtered.length);
    }
    
    // Apply grade level filter - ưu tiên cấp lớp đã chọn
    if (selectedGradeLevel) {
      // Lọc môn học theo level phù hợp với cấp lớp
      const gradeLevelMap: { [key: string]: string } = {
        'grade-1': 'Lớp 1',
        'grade-2': 'Lớp 2', 
        'grade-3': 'Lớp 3',
        'grade-4': 'Lớp 4',
        'grade-5': 'Lớp 5'
      };
      
      const targetLevel = gradeLevelMap[selectedGradeLevel.id];
      if (targetLevel) {
        // Chỉ hiển thị môn học của cấp lớp đã chọn
        filtered = filtered.filter(course => {
          const match = course.level === targetLevel;
          // console.log(`🎓 Level filter: ${course.title} (${course.level}) === ${targetLevel} = ${match}`);
          return match;
        });
        // console.log('🎓 After level filter (selected):', filtered.length);
      }
    } else if (selectedLevel) {
      // Chỉ áp dụng level filter khi không có selectedGradeLevel
      filtered = filtered.filter(course => {
        const match = course.level === selectedLevel;
        // console.log(`🎓 Level filter: ${course.title} (${course.level}) === ${selectedLevel} = ${match}`);
        return match;
      });
      // console.log('🎓 After level filter (manual):', filtered.length);
    }
    
    // console.log('✅ Final filtered courses:', filtered.length);
    setFilteredPublicCourses(filtered);
  }, [publicCourses, searchTerm, selectedSubjectFilter, selectedLevel, selectedGradeLevel, selectedSubject]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSubjectChange = (event: any) => {
    setSelectedSubjectFilter(event.target.value);
    setSelectedLevel(''); // Reset level when subject changes
    // Không xóa selectedSubject và selectedGradeLevel - giữ lựa chọn ban đầu
  };

  const handleLevelChange = (event: any) => {
    const newLevel = event.target.value;
    setSelectedLevel(newLevel);
    
    // Không xóa selectedSubject và selectedGradeLevel - giữ lựa chọn ban đầu
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedSubjectFilter('');
    setSelectedLevel('');
    // Không xóa selectedSubject và selectedGradeLevel - giữ lựa chọn ban đầu
  };

  const handleSelectGrade = (gradeLevel: any, subject?: any) => {
    if (subject) {
      setSelectedSubject(subject);
    }
    setSelectedGradeLevel(gradeLevel);
    setShowClassSelection(false);
    
    // Tự động set selectedLevel để đồng bộ với filter dropdown
    const gradeLevelMap: { [key: string]: string } = {
      'grade-1': 'Lớp 1',
      'grade-2': 'Lớp 2', 
      'grade-3': 'Lớp 3',
      'grade-4': 'Lớp 4',
      'grade-5': 'Lớp 5'
    };
    
    const targetLevel = gradeLevelMap[gradeLevel.id];
    if (targetLevel) {
      setSelectedLevel(targetLevel);
    }
    
    // Clear search và subject để hiển thị tất cả môn học của cấp lớp
    setSearchTerm('');
    setSelectedSubjectFilter('');
  };

  const handleChangeClass = () => {
    setShowClassSelection(true);
    // Reset selectedLevel khi thay đổi cấp lớp
    setSelectedLevel('');
    // Clear selectedSubject và selectedGradeLevel để cho phép chọn lại
    setSelectedSubject(null);
    setSelectedGradeLevel(null);
    // Clear search và subject để hiển thị tất cả môn học
    setSearchTerm('');
    setSelectedSubjectFilter('');
  };

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
          Trang chủ
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
          Trang chủ
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
          🎉 Chào mừng bạn! 🎉
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500, mb: 2 }}>
          Hãy khám phá và học tập thật vui nhé!
        </Typography>
        
        {/* Selected Subject and Grade Level Info */}
        {(selectedSubject || selectedGradeLevel) && (
          <Box sx={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: 2,
            p: 2,
            borderRadius: 3,
            background: darkMode 
              ? 'rgba(255, 123, 123, 0.1)'
              : 'rgba(239, 91, 91, 0.05)',
            border: darkMode 
              ? '1px solid rgba(255, 123, 123, 0.2)'
              : '1px solid rgba(239, 91, 91, 0.1)'
          }}>
            {selectedSubject && (
              <Avatar sx={{ 
                bgcolor: selectedSubject.color,
                width: 48,
                height: 48,
                fontSize: '1.5rem'
              }}>
                {selectedSubject.icon}
              </Avatar>
            )}
            {selectedGradeLevel && !selectedSubject && (
              <Avatar sx={{ 
                bgcolor: selectedGradeLevel.color,
                width: 48,
                height: 48,
                fontSize: '1.5rem'
              }}>
                {selectedGradeLevel.icon}
              </Avatar>
            )}
            <Box sx={{ textAlign: 'left' }}>
              {selectedSubject && (
                <Typography variant="h6" sx={{ 
                  fontWeight: 600, 
                  color: darkMode ? '#e0e0e0' : '#333333',
                  mb: 0.5
                }}>
                  {selectedSubject.name}
                </Typography>
              )}
              {selectedGradeLevel && (
                <Typography variant="body1" sx={{ 
                  fontWeight: 500, 
                  color: darkMode ? '#e0e0e0' : '#333333',
                  mb: 0.5
                }}>
                  🎓 {selectedGradeLevel.name}
                </Typography>
              )}
              {selectedSubject && (
                <Typography variant="body2" sx={{ 
                  color: darkMode ? '#b0b0b0' : '#777777',
                  mb: 1
                }}>
                  {selectedSubject.description}
                </Typography>
              )}
            </Box>
            <Button
              variant="outlined"
              size="small"
              onClick={handleChangeClass}
              sx={{
                borderColor: '#EF5B5B',
                color: '#EF5B5B',
                '&:hover': {
                  borderColor: '#D94A4A',
                  backgroundColor: 'rgba(239, 91, 91, 0.1)'
                }
              }}
            >
              Đổi lựa chọn
            </Button>
          </Box>
        )}
      </Box>

      {/* Quick Actions */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Stack direction="row" spacing={2} justifyContent="center" sx={{ flexWrap: 'wrap', gap: 2 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<SchoolIcon />}
            onClick={() => navigate('/student/classrooms')}
            sx={{ 
              py: 2,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #D94A4A 0%, #EF5B5B 100%)',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(239, 91, 91, 0.3)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            Lớp học của tôi
          </Button>
          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            onClick={() => navigate('/join-class')}
            sx={{ 
              py: 2,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #AED6E6 0%, #87CEEB 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #9BC4E6 0%, #7BB3E6 100%)',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(174, 214, 230, 0.3)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            Tham gia lớp mới
          </Button>
          <Button
            variant="contained"
            size="large"
            startIcon={<StarIcon />}
            onClick={() => navigate('/student/progress')}
            sx={{ 
              py: 2,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #FF7B7B 0%, #EF5B5B 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #EF5B5B 0%, #D94A4A 100%)',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(255, 123, 123, 0.3)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            Tiến độ học tập
          </Button>
        </Stack>
      </Box>

      {/* Tabs */}
      <Paper 
        elevation={0} 
        sx={{ 
          borderRadius: 4,
          background: darkMode 
            ? 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)'
            : 'linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%)',
          border: darkMode 
            ? '1px solid rgba(255, 123, 123, 0.2)'
            : '1px solid rgba(239, 91, 91, 0.1)'
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            centered
            sx={{
              '& .MuiTab-root': {
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '1.1rem'
              },
              '& .Mui-selected': {
                color: '#EF5B5B !important'
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#EF5B5B'
              }
            }}
          >
            <Tab 
              label={`Môn học đã tham gia (${enrolledCourses.length})`} 
              icon={<SchoolIcon />}
              iconPosition="start"
            />
            <Tab 
              label={`Môn học công khai (${publicCourses.length})`} 
              icon={<PublicIcon />}
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {/* Enrolled Courses Tab */}
        <TabPanel value={tabValue} index={0}>
          {enrolledCourses.length > 0 ? (
            <Grid container spacing={3}>
              {enrolledCourses.map((course) => (
                <Grid item xs={12} sm={6} md={4} key={course._id}>
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
                        <SchoolIcon />
                      </Avatar>
                      
                      <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                        {course.title}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
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
                      
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={() => navigate(`/courses/${course._id}`)}
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
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <SchoolIcon sx={{ fontSize: 80, color: '#EF5B5B', mb: 2 }} />
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                Chưa tham gia môn học nào
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Hãy khám phá các môn học công khai để bắt đầu học tập!
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={() => setTabValue(1)}
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
                Xem môn học công khai
              </Button>
                  </Box>
          )}
        </TabPanel>

        {/* Public Courses Tab */}
        <TabPanel value={tabValue} index={1}>
          {/* Filter and Search Section */}
          <Box sx={{ 
            mb: 3, 
            p: 2, 
            backgroundColor: darkMode ? 'rgba(255, 123, 123, 0.1)' : 'rgba(239, 91, 91, 0.05)', 
            borderRadius: 2 
          }}>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <FilterListIcon sx={{ color: darkMode ? '#FF7B7B' : '#EF5B5B' }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: darkMode ? '#FF7B7B' : '#EF5B5B' }}>
                Bộ lọc và tìm kiếm
              </Typography>
            </Stack>
            
            <Grid container spacing={2} alignItems="center">
              {/* Search */}
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder="Tìm kiếm môn học..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: '#EF5B5B' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: '#EF5B5B',
                      },
                      '&:hover fieldset': {
                        borderColor: '#D94A4A',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#EF5B5B',
                      },
                    },
                  }}
                />
              </Grid>
              
              {/* Subject Filter */}
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: '#EF5B5B' }}>Môn học</InputLabel>
                  <Select
                    value={selectedSubject ? selectedSubject.name : selectedSubjectFilter}
                    onChange={handleSubjectChange}
                    label="Môn học"
                    disabled={!!selectedSubject}
                    sx={{
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#EF5B5B',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#D94A4A',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#EF5B5B',
                      },
                    }}
                  >
                    <MenuItem value="">Tất cả môn học</MenuItem>
                    {availableSubjects.map((subject) => (
                      <MenuItem key={subject} value={subject}>
                        {subject}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Level Filter */}
              <Grid item xs={12} md={3}>
                <FormControl fullWidth disabled={!!selectedGradeLevel}>
                  <InputLabel sx={{ color: '#EF5B5B' }}>Lớp</InputLabel>
                  <Select
                    value={selectedGradeLevel ? selectedGradeLevel.name : selectedLevel}
                    onChange={handleLevelChange}
                    label="Lớp"
                    sx={{
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#EF5B5B',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#D94A4A',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#EF5B5B',
                      },
                    }}
                  >
                    <MenuItem value="">Tất cả lớp</MenuItem>
                    {availableLevels
                      .filter(level => !selectedSubject || publicCourses.some(course => 
                        course.category === selectedSubject.name && course.level === level
                      ))
                      .map((level) => (
                        <MenuItem key={level} value={level}>
                          {level}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Clear Filters */}
              <Grid item xs={12} md={2}>
                <Button
                  variant="outlined"
                  onClick={clearFilters}
                  disabled={!selectedSubjectFilter && !selectedLevel}
                  sx={{
                    borderColor: '#EF5B5B',
                    color: '#EF5B5B',
                    '&:hover': {
                      borderColor: '#D94A4A',
                      backgroundColor: 'rgba(239, 91, 91, 0.1)',
                    },
                    '&:disabled': {
                      borderColor: '#ccc',
                      color: '#666'
                    }
                  }}
                >
                  Xóa bộ lọc
                </Button>
              </Grid>
            </Grid>
            
            {/* Results count and filter info */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ color: '#777777', mb: 1 }}>
                Hiển thị {filteredPublicCourses.length} / {publicCourses.length} môn học
              </Typography>
              {(selectedSubject || selectedGradeLevel) && (
                <Typography variant="body2" sx={{ 
                  color: '#EF5B5B', 
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <span>🔒</span>
                  Đang lọc theo lựa chọn ban đầu: 
                  {selectedSubject && <span>{selectedSubject.name}</span>}
                  {selectedSubject && selectedGradeLevel && <span> • </span>}
                  {selectedGradeLevel && <span>{selectedGradeLevel.name}</span>}
                </Typography>
              )}
            </Box>
          </Box>
          
          {filteredPublicCourses.length > 0 ? (
            <Grid container spacing={3}>
              {filteredPublicCourses.map((course) => (
                <Grid item xs={12} sm={6} md={4} key={course._id}>
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
                        borderColor: '#AED6E6'
                      } 
                    }}
                  >
                    <CardContent sx={{ p: 3, textAlign: 'center' }}>
                      <Avatar 
                        sx={{ 
                          bgcolor: '#AED6E6', 
                          width: 60, 
                          height: 60,
                          mx: 'auto', 
                          mb: 2,
                          fontSize: '1.5rem'
                        }}
                      >
                        <PublicIcon />
                      </Avatar>
                      
                      <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                        {course.title}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
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
                      
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={() => navigate(`/courses/${course._id}`)}
                        sx={{ 
                          borderRadius: 2,
                          background: 'linear-gradient(135deg, #AED6E6 0%, #87CEEB 100%)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #9BC4E6 0%, #7BB3E6 100%)',
                          }
                        }}
                      >
                        Xem môn học
                      </Button>
                </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
          ) : publicCourses.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <PublicIcon sx={{ fontSize: 80, color: '#AED6E6', mb: 2 }} />
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                Chưa có môn học công khai
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Các môn học công khai sẽ xuất hiện ở đây khi có giáo viên tạo.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <SearchIcon sx={{ fontSize: 80, color: '#EF5B5B', mb: 2 }} />
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                Không tìm thấy môn học
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Không có môn học nào phù hợp với bộ lọc của bạn.
              </Typography>
              <Button
                variant="contained"
                onClick={clearFilters}
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
                Xóa bộ lọc
              </Button>
            </Box>
          )}
        </TabPanel>
      </Paper>

      {/* Pagination for Public Courses Tab */}
      {tabValue === 1 && filteredPublicCourses.length > 0 && totalPages > 1 && (
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

      {/* Class Selection Dialog */}
      <ClassSelectionDialog
        open={showClassSelection}
        onClose={() => setShowClassSelection(false)}
        onSelectClass={handleSelectGrade}
        userId={user?.id || ''}
      />
    </Box>
  );
}