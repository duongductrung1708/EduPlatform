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
  Alert
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AddIcon from '@mui/icons-material/Add';
import { classesApi } from '../../../api/admin';
import { useNavigate } from 'react-router-dom';
import { SkeletonGrid } from '../../../components/LoadingSkeleton';
import { useTheme } from '../../../contexts/ThemeContext';
import Pagination from '../../../components/Pagination';
import SearchFilterBar from '../../../components/SearchFilterBar';
import { useAuth } from '../../../hooks/useAuth';

export default function StudentClassrooms() {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('');

  useEffect(() => {
    const loadClassrooms = async () => {
      // Don't load if not authenticated
      if (!isAuthenticated) {
        setClassrooms([]);
        setTotalItems(0);
        setTotalPages(0);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Simulate loading delay for better UX
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const res = await classesApi.listMy(currentPage, itemsPerPage);
        setClassrooms(res.items || []);
        setTotalItems(res.total || 0);
        setTotalPages(Math.ceil((res.total || 0) / itemsPerPage));
      } catch (e: any) {
        // Handle 401 gracefully - user might not be authenticated
        if (e.response?.status === 401) {
          setClassrooms([]);
          setTotalItems(0);
          setTotalPages(0);
        } else {
          setError(e?.response?.data?.message || 'Không thể tải danh sách lớp học');
        }
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      loadClassrooms();
    }
  }, [currentPage, itemsPerPage, isAuthenticated, authLoading]);

  // Search and filter handlers
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleFilterChange = (_filterKey: string, _value: string) => {
    // Add filter logic here if needed
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
  };

  const handleClearAll = () => {
    setSearchTerm('');
    setSortBy('');
  };

  // Filter and sort classrooms
  const filteredAndSortedClassrooms = classrooms
    .filter(classroom => {
      // Search filter
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        const titleMatch = (classroom.title || classroom.name || '').toLowerCase().includes(searchLower);
        const courseMatch = (classroom.courseId?.title || '').toLowerCase().includes(searchLower);
        if (!titleMatch && !courseMatch) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (!sortBy) return 0;

      switch (sortBy) {
        case 'name-asc':
          return ((a.title || a.name || '').localeCompare(b.title || b.name || ''));
        case 'name-desc':
          return ((b.title || b.name || '').localeCompare(a.title || a.name || ''));
        case 'students-asc':
          return ((a.studentsCount || 0) - (b.studentsCount || 0));
        case 'students-desc':
          return ((b.studentsCount || 0) - (a.studentsCount || 0));
        case 'joined-asc':
          return new Date(a.joinedAt || 0).getTime() - new Date(b.joinedAt || 0).getTime();
        case 'joined-desc':
          return new Date(b.joinedAt || 0).getTime() - new Date(a.joinedAt || 0).getTime();
        default:
          return 0;
      }
    });

  if (authLoading || loading) {
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
          Lớp học của tôi
        </Typography>
        <SkeletonGrid />
      </Box>
    );
  }

  if (!isAuthenticated) {
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
          Lớp học của tôi
        </Typography>
        <Alert severity="info" sx={{ mb: 3 }}>
          Bạn cần đăng nhập để xem lớp học của mình
        </Alert>
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
          Lớp học của tôi
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
          🎓 Lớp học của tôi 🎓
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500 }}>
          Khám phá và học tập cùng bạn bè!
        </Typography>
      </Box>

      {/* Join Class Button */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<AddIcon />}
          onClick={() => navigate('/join-class')}
          sx={{ 
            borderRadius: 3,
            py: 1.5,
            px: 4,
            background: darkMode 
            ? 'linear-gradient(135deg, #FF7B7B 0%, #EF5B5B 100%)'
            : 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #D94A4A 0%, #EF5B5B 100%)',
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 25px rgba(239, 91, 91, 0.3)'
            },
            transition: 'all 0.3s ease'
          }}
        >
          Tham gia lớp học mới
        </Button>
      </Box>

      {/* Classrooms Grid */}
      {classrooms.length > 0 ? (
        <Paper 
          elevation={0} 
          sx={{ 
            p: 4, 
            borderRadius: 4,
            background: darkMode 
              ? 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)'
              : 'linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%)',
            border: '1px solid rgba(239, 91, 91, 0.1)'
          }}
        >
          {/* Search and Filter Bar */}
          <SearchFilterBar
            searchValue={searchTerm}
            onSearchChange={handleSearchChange}
            searchPlaceholder="Tìm kiếm lớp học..."
            sortOptions={[
              { value: 'name-asc', label: 'Tên A-Z' },
              { value: 'name-desc', label: 'Tên Z-A' },
              { value: 'students-asc', label: 'Số học sinh ít nhất' },
              { value: 'students-desc', label: 'Số học sinh nhiều nhất' },
              { value: 'joined-asc', label: 'Tham gia cũ nhất' },
              { value: 'joined-desc', label: 'Tham gia mới nhất' }
            ]}
            sortValue={sortBy}
            onSortChange={handleSortChange}
            onClearAll={handleClearAll}
            sx={{ mb: 3 }}
          />

          <Grid container spacing={3}>
            {filteredAndSortedClassrooms.map((c) => (
              <Grid item xs={12} sm={6} md={4} key={c._id}>
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
                      borderColor: darkMode ? '#FF7B7B' : '#EF5B5B'
                    } 
                  }}
                >
                  <CardContent sx={{ p: 3, textAlign: 'center' }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: darkMode ? '#FF7B7B' : '#EF5B5B', 
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
                      {c.title}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {c.teacherNames ? `Giáo viên: ${c.teacherNames}` : ''}
                    </Typography>
                    
                    <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 2 }}>
                      <Chip 
                        size="small" 
                        icon={<PeopleIcon />}
                        label={`${c.studentsCount || 0} bạn`} 
                        sx={{ borderColor: darkMode ? '#FF7B7B' : '#EF5B5B', color: darkMode ? '#FF7B7B' : '#EF5B5B' }}
                        variant="outlined" 
                      />
                      <Chip 
                        size="small" 
                        icon={<AssignmentIcon />}
                        label={`${c.assignmentsCount || 0} bài tập`} 
                        sx={{ borderColor: '#AED6E6', color: '#AED6E6' }}
                        variant="outlined" 
                      />
                    </Stack>
                    
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => navigate(`/student/classrooms/${c._id}`)}
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
                      Vào lớp học
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      ) : (
        <Paper 
          elevation={0} 
          sx={{ 
            p: 6, 
            textAlign: 'center',
            borderRadius: 4,
            background: darkMode 
              ? 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)'
              : 'linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%)',
            border: '1px solid rgba(239, 91, 91, 0.1)'
          }}
        >
          <SchoolIcon sx={{ fontSize: 80, color: darkMode ? '#FF7B7B' : '#EF5B5B', mb: 2 }} />
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
            Chưa có lớp học nào
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Hãy tham gia lớp học để bắt đầu học tập cùng bạn bè!
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            onClick={() => navigate('/join-class')}
            sx={{ 
              borderRadius: 3,
              py: 1.5,
              px: 4,
              background: darkMode 
            ? 'linear-gradient(135deg, #FF7B7B 0%, #EF5B5B 100%)'
            : 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #D94A4A 0%, #EF5B5B 100%)',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(239, 91, 91, 0.3)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            Tham gia lớp học
          </Button>
        </Paper>
      )}

      {/* Pagination */}
      {classrooms.length > 0 && totalPages > 1 && (
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
