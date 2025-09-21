import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  TextField, 
  Chip, 
  Stack, 
  CardActionArea,
  Paper,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Avatar,
  Rating,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Divider,
  Badge
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import PublicIcon from '@mui/icons-material/Public';
import SchoolIcon from '@mui/icons-material/School';
import PeopleIcon from '@mui/icons-material/People';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import StarIcon from '@mui/icons-material/Star';
import VisibilityIcon from '@mui/icons-material/Visibility';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import { coursesApi, CourseItem } from '../api/courses';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import Pagination from '../components/Pagination';

export default function PublicCoursesPage() {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  
  // Data states
  const [items, setItems] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search and filter states
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Available filter options
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableLevels, setAvailableLevels] = useState<string[]>([]);
  
  // UI states
  const [showFilters, setShowFilters] = useState(false);
  const [bookmarkedCourses, setBookmarkedCourses] = useState<Set<string>>(new Set());

  // Load courses data
  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Simulate loading delay for better UX
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const res = await coursesApi.listPublic(currentPage, itemsPerPage, search);
        setItems(res.items || []);
        setTotalItems(res.total || 0);
        setTotalPages(Math.ceil((res.total || 0) / itemsPerPage));
        
        // Extract unique categories and levels for filters
        const allCoursesRes = await coursesApi.getPublic();
        const categories = [...new Set(allCoursesRes?.map(course => course.category).filter(Boolean) || [])] as string[];
        const levels = [...new Set(allCoursesRes?.map(course => course.level).filter(Boolean) || [])] as string[];
        setAvailableCategories(categories);
        setAvailableLevels(levels);
        
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Không thể tải danh sách môn học');
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(loadCourses, 300);
    return () => clearTimeout(timeoutId);
  }, [currentPage, itemsPerPage, search, selectedCategory, selectedLevel, sortBy]);

  // Handle bookmark toggle
  const handleBookmarkToggle = (courseId: string) => {
    setBookmarkedCourses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(courseId)) {
        newSet.delete(courseId);
      } else {
        newSet.add(courseId);
      }
      return newSet;
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedLevel('');
    setSortBy('newest');
    setCurrentPage(1);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header Section */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 3, 
          background: darkMode 
            ? 'linear-gradient(135deg, #FF7B7B 0%, #EF5B5B 100%)'
            : 'linear-gradient(135deg, #FF7B7B 0%, #EF5B5B 100%)',
          color: 'white',
          borderRadius: 3
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
            <PublicIcon />
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ color: 'white' }}>
              Môn học công khai
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9, color: 'white' }}>
              Khám phá và tham gia các môn học chất lượng cao
            </Typography>
          </Box>
        </Stack>
        
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            placeholder="Tìm kiếm môn học..."
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ 
              flexGrow: 1,
              maxWidth: 400,
              '& .MuiOutlinedInput-root': {
                bgcolor: 'rgba(255,255,255,0.9)',
                '& fieldset': { border: 'none' },
                '&:hover fieldset': { border: 'none' },
                '&.Mui-focused fieldset': { border: 'none' }
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={() => setShowFilters(!showFilters)}
            sx={{ 
              bgcolor: 'rgba(255,255,255,0.1)',
              borderColor: 'rgba(255,255,255,0.3)',
              color: 'white',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.2)',
                borderColor: 'rgba(255,255,255,0.5)'
              }
            }}
          >
            Bộ lọc
          </Button>
        </Stack>
      </Paper>

      {/* Filters Section */}
      {showFilters && (
        <Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <FilterListIcon color="primary" />
            <Typography variant="h6">Bộ lọc tìm kiếm</Typography>
          </Stack>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Môn học</InputLabel>
                <Select
                  value={selectedCategory}
                  label="Môn học"
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <MenuItem value="">Tất cả môn học</MenuItem>
                  {availableCategories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Cấp độ</InputLabel>
                <Select
                  value={selectedLevel}
                  label="Cấp độ"
                  onChange={(e) => setSelectedLevel(e.target.value)}
                >
                  <MenuItem value="">Tất cả cấp độ</MenuItem>
                  {availableLevels.map((level) => (
                    <MenuItem key={level} value={level}>
                      {level}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Sắp xếp</InputLabel>
                <Select
                  value={sortBy}
                  label="Sắp xếp"
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <MenuItem value="newest">Mới nhất</MenuItem>
                  <MenuItem value="oldest">Cũ nhất</MenuItem>
                  <MenuItem value="popular">Phổ biến</MenuItem>
                  <MenuItem value="rating">Đánh giá cao</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                onClick={clearFilters}
                sx={{ height: '40px', width: '100%' }}
              >
                Xóa bộ lọc
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={60} />
        </Box>
      ) : (
        <>
          {/* Results Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" color="text.secondary">
              {totalItems > 0 ? `Tìm thấy ${totalItems} môn học` : 'Không tìm thấy môn học nào'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Trang {currentPage} / {totalPages}
            </Typography>
          </Box>

          {/* Courses Grid */}
          {items.length > 0 ? (
            <Grid container spacing={3}>
              {items.map((course) => (
                <Grid key={course._id} item xs={12} sm={6} md={4} lg={3}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 6
                      }
                    }}
                  >
                    <CardActionArea 
                      onClick={() => navigate(`/courses/${course._id}`)}
                      sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                    >
                      {/* Course Header */}
                      <Box sx={{ p: 2, pb: 1 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                          <Avatar 
                            sx={{ 
                              bgcolor: 'primary.main',
                              width: 48,
                              height: 48
                            }}
                          >
                            <SchoolIcon />
                          </Avatar>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBookmarkToggle(course._id);
                            }}
                            sx={{ 
                              color: bookmarkedCourses.has(course._id) ? 'warning.main' : 'text.secondary',
                              '&:hover': { bgcolor: 'action.hover' }
                            }}
                          >
                            {bookmarkedCourses.has(course._id) ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                          </IconButton>
                        </Stack>
                        
                        <Typography 
                          variant="h6" 
                          fontWeight="bold" 
                          sx={{ 
                            mb: 1,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            minHeight: '3.6em'
                          }}
                        >
                          {course.title}
                        </Typography>
                        
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ 
                            mb: 2,
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            minHeight: '4.5em'
                          }}
                        >
                          {course.description}
                        </Typography>
                      </Box>

                      {/* Course Info */}
                      <Box sx={{ p: 2, pt: 0, mt: 'auto' }}>
                        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                          {course.category && (
                            <Chip 
                              size="small" 
                              label={course.category}
                              color="primary"
                              variant="outlined"
                            />
                          )}
                          {course.level && (
                            <Chip 
                              size="small" 
                              label={course.level}
                              color="secondary"
                              variant="outlined"
                            />
                          )}
                        </Stack>

                        <Divider sx={{ mb: 2 }} />

                        {/* Course Stats */}
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Stack direction="row" spacing={1} alignItems="center">
                            <PeopleIcon fontSize="small" color="action" />
                            <Typography variant="caption" color="text.secondary">
                              {course.enrollmentCount || 0} học sinh
                            </Typography>
                          </Stack>
                          
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <StarIcon fontSize="small" sx={{ color: 'warning.main' }} />
                            <Typography variant="caption" color="text.secondary">
                              {course.averageRating || 0}
                            </Typography>
                          </Stack>
                        </Stack>

                        {/* Action Button */}
                        <Button
                          variant="contained"
                          fullWidth
                          startIcon={<VisibilityIcon />}
                          sx={{ 
                            mt: 2,
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 'bold'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/courses/${course._id}`);
                          }}
                        >
                          Xem chi tiết
                        </Button>
                      </Box>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            /* Empty State */
            <Paper 
              elevation={0} 
              sx={{ 
                p: 6, 
                textAlign: 'center',
                bgcolor: 'grey.50',
                borderRadius: 3
              }}
            >
              <PublicIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Không tìm thấy môn học nào
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc để tìm thấy môn học phù hợp
              </Typography>
              <Button variant="outlined" onClick={clearFilters}>
                Xóa bộ lọc
              </Button>
            </Paper>
          )}

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
        </>
      )}
    </Box>
  );
}


