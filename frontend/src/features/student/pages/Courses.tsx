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
  Tabs, 
  Tab, 
  CardActionArea,
  Avatar,
  Paper,
  Button,
  InputAdornment
} from '@mui/material';
import { School, Public, Search, People, AccessTime } from '@mui/icons-material';
import { coursesApi, CourseItem } from '../../../api/courses';
import { useNavigate } from 'react-router-dom';
import { SkeletonGrid } from '../../../components/LoadingSkeleton';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function StudentCourses() {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [enrolledClasses, setEnrolledClasses] = useState<any[]>([]);
  const [publicCourses, setPublicCourses] = useState<CourseItem[]>([]);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Simulate loading delay for better UX
        await new Promise(resolve => setTimeout(resolve, 600));
        
        const [enrolledRes, publicRes] = await Promise.all([
          coursesApi.getMyEnrolled(),
          coursesApi.listPublic(1, 100)
        ]);
        
        setEnrolledClasses(enrolledRes || []);
        setPublicCourses(publicRes.items);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (!loading) {
      const t = setTimeout(async () => {
        try {
          const res = await coursesApi.listPublic(1, 50, search);
          setPublicCourses(res.items);
        } catch {}
      }, 250);
      return () => clearTimeout(t);
    }
  }, [search, loading]);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 700, 
            mb: 1, 
            background: 'linear-gradient(45deg, #667eea, #764ba2)',
            backgroundClip: 'text', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent'
          }}
        >
          📚 Môn học của tôi
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Khám phá các lớp học và môn học thú vị
        </Typography>
      </Box>
      
      <Paper 
        elevation={2} 
        sx={{ 
          borderRadius: 3,
          mb: 3,
          overflow: 'hidden'
        }}
      >
        <Tabs 
          value={tabValue} 
          onChange={(_, newValue) => setTabValue(newValue)} 
          sx={{ 
            '& .MuiTab-root': {
              minHeight: 60,
              fontSize: '1.1rem',
              fontWeight: 600
            },
            '& .Mui-selected': {
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white !important'
            }
          }}
        >
          <Tab 
            icon={<School />} 
            label="Lớp đã tham gia" 
            sx={{ flex: 1 }}
          />
          <Tab 
            icon={<Public />} 
            label="Môn học công khai" 
            sx={{ flex: 1 }}
          />
        </Tabs>
      </Paper>

      <TabPanel value={tabValue} index={0}>
        {loading ? (
          <SkeletonGrid count={6} columns={{ xs: 12, sm: 6, md: 4, lg: 3 }} showAvatar={true} showChips={true} showButton={true} />
        ) : (
          <Grid container spacing={3}>
            {enrolledClasses.map((c) => (
            <Grid key={c._id} item xs={12} sm={6} md={4} lg={3}>
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
                <CardActionArea onClick={() => navigate(`/courses/${c._id}`)}>
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
                      🎓
                    </Avatar>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      {c.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                      {c.description || 'Môn học thú vị'}
                    </Typography>
                    <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 2 }}>
                      <Chip 
                        size="small" 
                        icon={<People />}
                        label={`${c.enrollmentCount || 0} học sinh`} 
                        sx={{ borderColor: '#EF5B5B', color: '#EF5B5B' }}
                        variant="outlined" 
                      />
                      <Chip 
                        size="small" 
                        icon={<AccessTime />}
                        label={`${c.estimatedDuration || 0} phút`} 
                        sx={{ borderColor: '#AED6E6', color: '#AED6E6' }}
                        variant="outlined" 
                      />
                    </Stack>
                    <Button
                      variant="contained"
                      fullWidth
                      sx={{ 
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #D94A4A 0%, #EF5B5B 100%)',
                        }
                      }}
                    >
                      Vào lớp học
                    </Button>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
          {enrolledClasses.length === 0 && (
            <Grid item xs={12}>
              <Paper 
                elevation={2} 
                sx={{ 
                  borderRadius: 3,
                  textAlign: 'center',
                  p: 6,
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  color: 'white'
                }}
              >
                <Typography variant="h2" sx={{ mb: 2 }}>
                  🎈
                </Typography>
                <Typography variant="h5" fontWeight={600} sx={{ mb: 2 }}>
                  Chưa có lớp học nào
                </Typography>
                <Typography variant="body1" sx={{ mb: 3, opacity: 0.9 }}>
                  Hãy tham gia lớp học đầu tiên để bắt đầu hành trình học tập!
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<School />}
                  onClick={() => navigate('/join-class')}
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
                  Tham gia lớp học ngay!
                </Button>
              </Paper>
            </Grid>
          )}
        </Grid>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Box sx={{ mb: 3 }}>
          <TextField
            placeholder="Tìm kiếm môn học..."
            size="medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ 
              width: { xs: '100%', sm: 400 },
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                fontSize: '1.1rem'
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        {loading ? (
          <SkeletonGrid count={6} columns={{ xs: 12, sm: 6, md: 4, lg: 3 }} showAvatar={true} showChips={true} showButton={true} />
        ) : (
          <Grid container spacing={3}>
            {publicCourses.map((c) => (
            <Grid key={c._id} item xs={12} sm={6} md={4} lg={3}>
              <Card 
                sx={{ 
                  borderRadius: 3,
                  border: '2px solid',
                  borderColor: 'divider',
                  '&:hover': {
                    boxShadow: 4,
                    transform: 'translateY(-4px)',
                    transition: 'all 0.3s ease',
                    borderColor: 'secondary.main'
                  }
                }}
              >
                <CardActionArea onClick={() => navigate(`/courses/${c._id}`)}>
                  <CardContent sx={{ p: 3, textAlign: 'center' }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: 'secondary.main', 
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
                      {c.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                      {c.description}
                    </Typography>
                    <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 2 }}>
                      {c.category && (
                        <Chip 
                          size="small" 
                          label={c.category} 
                          sx={{ borderColor: '#EF5B5B', color: '#EF5B5B' }}
                          variant="outlined" 
                        />
                      )}
                      {c.level && (
                        <Chip 
                          size="small" 
                          label={c.level} 
                          sx={{ borderColor: '#AED6E6', color: '#AED6E6' }}
                          variant="outlined" 
                        />
                      )}
                    </Stack>
                    <Button
                      variant="contained"
                      fullWidth
                      sx={{ 
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #D94A4A 0%, #EF5B5B 100%)',
                        }
                      }}
                    >
                      Xem môn học
                    </Button>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
          {publicCourses.length === 0 && (
            <Grid item xs={12}>
              <Paper 
                elevation={2} 
                sx={{ 
                  borderRadius: 3,
                  textAlign: 'center',
                  p: 6,
                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  color: 'white'
                }}
              >
                <Typography variant="h2" sx={{ mb: 2 }}>
                  🔍
                </Typography>
                <Typography variant="h5" fontWeight={600} sx={{ mb: 2 }}>
                  Không tìm thấy môn học nào
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Hãy thử tìm kiếm với từ khóa khác hoặc khám phá các môn học khác.
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
        )}
      </TabPanel>
    </Box>
  );
}
