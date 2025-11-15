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
  Skeleton,
  Button,
} from '@mui/material';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { assignmentsApi, AssignmentItem } from '../../../api/assignments';
import { classesApi } from '../../../api/admin';
import { useTheme } from '../../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';

interface AssignmentWithClassroom extends AssignmentItem {
  classroomId: string;
  classroomName?: string;
  mySubmission?: {
    _id: string;
    grade?: number;
    graded?: boolean;
    submittedAt?: string;
  };
}

export default function StudentAssignments() {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<AssignmentWithClassroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Theme colors
  const primaryTextColor = darkMode ? '#f8fafc' : '#102a43';
  const secondaryTextColor = darkMode ? 'rgba(248, 250, 252, 0.7)' : 'rgba(16, 42, 67, 0.64)';
  const cardBackground = darkMode
    ? 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)'
    : 'linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%)';
  const surfaceBorder = darkMode ? 'rgba(148, 163, 184, 0.2)' : 'rgba(79, 70, 229, 0.12)';
  const skeletonBaseColor = darkMode ? 'rgba(148, 163, 184, 0.2)' : 'rgba(148, 163, 184, 0.25)';

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all classrooms for the student
      interface Classroom {
        _id: string;
        title?: string;
        name?: string;
        [key: string]: unknown;
      }
      let classrooms: Classroom[] = [];
      try {
        const classroomsResponse = await classesApi.listMy(1, 100);
        classrooms = classroomsResponse.items || [];
      } catch (err: unknown) {
        const error = err as { response?: { status?: number; data?: { message?: string } } };
        // Handle 401 gracefully - user might not be authenticated or token expired
        if (error?.response?.status === 401) {
          setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          setAssignments([]);
          return;
        }
        throw err;
      }

      if (classrooms.length === 0) {
        setAssignments([]);
        return;
      }

      const allAssignments: AssignmentWithClassroom[] = [];

      // Get assignments from each classroom
      for (const classroom of classrooms) {
        try {
          const classroomAssignments = await assignmentsApi.list(classroom._id);
          
          // Get submission status for each assignment
          const assignmentsWithSubmissions = await Promise.all(
            classroomAssignments.map(async (assignment) => {
              try {
                const submission = await assignmentsApi.getMySubmission(classroom._id, assignment._id);
                return {
                  ...assignment,
                  classroomId: classroom._id,
                  classroomName: classroom.title || classroom.name || 'Lớp học',
                  mySubmission: submission || undefined,
                };
              } catch {
                return {
                  ...assignment,
                  classroomId: classroom._id,
                  classroomName: classroom.title || classroom.name || 'Lớp học',
                };
              }
            })
          );

          allAssignments.push(...assignmentsWithSubmissions);
        } catch (err) {
          // Skip classrooms that fail to load assignments
          // Don't show error for individual classroom failures
        }
      }

      // Sort by due date (upcoming first, then by creation date)
      allAssignments.sort((a, b) => {
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });

      setAssignments(allAssignments);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string; error?: string } }; message?: string };
      const apiMsg = error?.response?.data?.message || error?.response?.data?.error || error?.message;
      setError(apiMsg || 'Không thể tải danh sách bài tập');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (assignment: AssignmentWithClassroom) => {
    if (assignment.mySubmission?.graded) return '#4CAF50'; // Graded
    if (assignment.mySubmission) return '#2196F3'; // Submitted
    if (assignment.dueDate && new Date(assignment.dueDate) < new Date()) return '#F44336'; // Overdue
    if (assignment.dueDate && new Date(assignment.dueDate) <= new Date(Date.now() + 24 * 60 * 60 * 1000)) return '#FF9800'; // Due soon
    return '#9E9E9E'; // Not started
  };

  const getStatusText = (assignment: AssignmentWithClassroom) => {
    if (assignment.mySubmission?.graded) return 'Đã chấm';
    if (assignment.mySubmission) return 'Đã nộp';
    if (assignment.dueDate && new Date(assignment.dueDate) < new Date()) return 'Quá hạn';
    if (assignment.dueDate && new Date(assignment.dueDate) <= new Date(Date.now() + 24 * 60 * 60 * 1000)) return 'Sắp đến hạn';
    return 'Chưa nộp';
  };

  const renderLoadingSkeleton = () => {
    const assignmentsSkeleton = Array.from({ length: 6 });

    return (
      <Box sx={{ p: { xs: 2, md: 3 }, color: primaryTextColor }}>
        {/* Header Skeleton */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Skeleton
            variant="text"
            height={48}
            width="40%"
            sx={{ bgcolor: skeletonBaseColor, mx: 'auto', mb: 1 }}
            animation="wave"
          />
          <Skeleton
            variant="text"
            height={24}
            width="60%"
            sx={{ bgcolor: skeletonBaseColor, mx: 'auto' }}
            animation="wave"
          />
        </Box>

        {/* Stats Skeleton */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {Array.from({ length: 3 }).map((_, index) => (
            <Grid item xs={12} sm={4} key={`stat-skeleton-${index}`}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  background: cardBackground,
                  border: `1px solid ${surfaceBorder}`,
                }}
              >
                <Skeleton
                  variant="text"
                  height={56}
                  width="60%"
                  sx={{ bgcolor: skeletonBaseColor, mb: 1 }}
                  animation="wave"
                />
                <Skeleton
                  variant="text"
                  height={20}
                  width="80%"
                  sx={{ bgcolor: skeletonBaseColor }}
                  animation="wave"
                />
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Assignments Grid Skeleton */}
        <Grid container spacing={3}>
          {assignmentsSkeleton.map((_, index) => (
            <Grid item xs={12} md={6} key={`assignment-skeleton-${index}`}>
              <Card
                sx={{
                  height: '100%',
                  borderRadius: 4,
                  border: `1px solid ${surfaceBorder}`,
                  background: cardBackground,
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Skeleton
                    variant="text"
                    height={32}
                    width="80%"
                    sx={{ bgcolor: skeletonBaseColor, mb: 1 }}
                    animation="wave"
                  />
                  <Skeleton
                    variant="text"
                    height={20}
                    width="60%"
                    sx={{ bgcolor: skeletonBaseColor, mb: 2 }}
                    animation="wave"
                  />
                  <Skeleton
                    variant="rectangular"
                    height={100}
                    width="100%"
                    sx={{ bgcolor: skeletonBaseColor, mb: 2, borderRadius: 1 }}
                    animation="wave"
                  />
                  <Skeleton
                    variant="rectangular"
                    height={36}
                    width={120}
                    sx={{ bgcolor: skeletonBaseColor, borderRadius: 1 }}
                    animation="wave"
                  />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  if (loading) {
    return renderLoadingSkeleton();
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const pendingCount = assignments.filter((a) => !a.mySubmission).length;
  const submittedCount = assignments.filter((a) => a.mySubmission && !a.mySubmission.graded).length;
  const gradedCount = assignments.filter((a) => a.mySubmission?.graded).length;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, color: primaryTextColor }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            mb: 1,
            color: primaryTextColor,
            textShadow: darkMode
              ? '0px 12px 32px rgba(15,23,42,0.55)'
              : '0px 12px 32px rgba(79,70,229,0.28)',
          }}
        >
          📝 Bài tập của tôi
        </Typography>
        <Typography variant="body1" sx={{ color: secondaryTextColor }}>
          Quản lý và theo dõi tất cả bài tập từ các lớp học
        </Typography>
      </Box>

      {/* Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              textAlign: 'center',
              borderRadius: 3,
              background: darkMode
                ? 'linear-gradient(135deg, #FF7B7B 0%, #EF5B5B 100%)'
                : 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
              color: '#ffffff',
              boxShadow: darkMode
                ? '0 20px 40px rgba(190, 24, 93, 0.25)'
                : '0 20px 45px rgba(236, 72, 153, 0.3)',
            }}
          >
            <Typography variant="h3" fontWeight="bold" sx={{ color: '#ffffff' }}>
              {pendingCount}
            </Typography>
            <Typography variant="body2" sx={{ color: '#ffffff', opacity: 0.85 }}>
              Chưa nộp
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              textAlign: 'center',
              borderRadius: 3,
              background: darkMode
                ? 'linear-gradient(135deg, #AED6E6 0%, #87CEEB 100%)'
                : 'linear-gradient(135deg, #9BC4E6 0%, #7BB3E6 100%)',
              color: '#ffffff',
              boxShadow: darkMode
                ? '0 20px 40px rgba(190, 24, 93, 0.25)'
                : '0 20px 45px rgba(236, 72, 153, 0.3)',
            }}
          >
            <Typography variant="h3" fontWeight="bold" sx={{ color: '#ffffff' }}>
              {submittedCount}
            </Typography>
            <Typography variant="body2" sx={{ color: '#ffffff', opacity: 0.85 }}>
              Đã nộp
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              textAlign: 'center',
              borderRadius: 3,
              background: darkMode
                ? 'linear-gradient(135deg, #FF7B7B 0%, #EF5B5B 100%)'
                : 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
              color: '#ffffff',
              boxShadow: darkMode
                ? '0 20px 40px rgba(190, 24, 93, 0.25)'
                : '0 20px 45px rgba(236, 72, 153, 0.3)',
            }}
          >
            <Typography variant="h3" fontWeight="bold" sx={{ color: '#ffffff' }}>
              {gradedCount}
            </Typography>
            <Typography variant="body2" sx={{ color: '#ffffff', opacity: 0.85 }}>
              Đã chấm
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Assignments Grid */}
      {assignments.length > 0 ? (
        <Grid container spacing={3}>
          {assignments.map((assignment) => (
            <Grid item xs={12} md={6} key={assignment._id}>
              <Card
                sx={{
                  height: '100%',
                  borderRadius: 4,
                  border: `1px solid ${getStatusColor(assignment)}`,
                  background: cardBackground,
                  transition: 'all 0.3s ease',
                  boxShadow: darkMode
                    ? '0 16px 36px rgba(15, 23, 42, 0.45)'
                    : '0 24px 36px rgba(148, 163, 184, 0.25)',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: darkMode
                      ? '0 24px 48px rgba(15, 23, 42, 0.55)'
                      : '0 32px 52px rgba(100, 116, 139, 0.3)',
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" alignItems="center" gap={2} sx={{ mb: 2 }}>
                    <AssignmentTurnedInIcon
                      sx={{
                        fontSize: 40,
                        color: getStatusColor(assignment),
                      }}
                    />
                    <Box flex={1}>
                      <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5, color: primaryTextColor }}>
                        {assignment.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: secondaryTextColor }}>
                        {assignment.classroomName}
                      </Typography>
                    </Box>
                  </Box>

                  {assignment.description && (
                    <Typography
                      variant="body2"
                      sx={{
                        mb: 2,
                        color: secondaryTextColor,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {assignment.description}
                    </Typography>
                  )}

                  <Divider sx={{ mb: 2, borderColor: surfaceBorder }} />

                  <Box sx={{ mb: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="body2" fontWeight={600} sx={{ color: primaryTextColor }}>
                        Trạng thái:
                      </Typography>
                      <Chip
                        label={getStatusText(assignment)}
                        size="small"
                        sx={{
                          bgcolor: getStatusColor(assignment),
                          color: 'white',
                          fontWeight: 600,
                        }}
                      />
                    </Box>

                    {assignment.dueDate && (
                      <Box display="flex" alignItems="center" gap={1} sx={{ mb: 1 }}>
                        <AccessTimeIcon sx={{ fontSize: 18, color: secondaryTextColor }} />
                        <Typography variant="body2" sx={{ color: secondaryTextColor }}>
                          Hạn nộp: {new Date(assignment.dueDate).toLocaleDateString('vi-VN')}
                        </Typography>
                      </Box>
                    )}

                    {assignment.totalPoints && (
                      <Typography variant="body2" sx={{ color: secondaryTextColor }}>
                        Điểm tối đa: {assignment.totalPoints}
                      </Typography>
                    )}

                    {assignment.mySubmission?.graded && assignment.mySubmission.grade !== undefined && (
                      <Box display="flex" alignItems="center" gap={1} sx={{ mt: 1 }}>
                        <CheckCircleIcon sx={{ fontSize: 18, color: '#4CAF50' }} />
                        <Typography variant="body2" sx={{ color: '#4CAF50', fontWeight: 600 }}>
                          Điểm: {assignment.mySubmission.grade}/{assignment.totalPoints || 'N/A'}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => {
                      if (assignment.mySubmission) {
                        navigate(`/classes/${assignment.classroomId}`);
                      } else {
                        navigate(`/classes/${assignment.classroomId}/assignments/${assignment._id}/submit`);
                      }
                    }}
                    sx={{
                      borderRadius: 2,
                      background: darkMode
                        ? 'linear-gradient(135deg, #FF7B7B 0%, #EF5B5B 100%)'
                        : 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
                      color: '#ffffff',
                      fontWeight: 600,
                      boxShadow: darkMode
                        ? '0 20px 40px rgba(190, 24, 93, 0.25)'
                        : '0 20px 45px rgba(236, 72, 153, 0.3)',
                      '&:hover': {
                        background: darkMode
                          ? 'linear-gradient(135deg, #D94A4A 0%, #EF5B5B 100%)'
                          : 'linear-gradient(135deg, #D94A4A 0%, #EF5B5B 100%)',
                        boxShadow: darkMode
                          ? '0 20px 40px rgba(190, 24, 93, 0.25)'
                          : '0 20px 45px rgba(236, 72, 153, 0.3)',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {assignment.mySubmission ? 'Xem chi tiết' : 'Nộp bài'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper
          elevation={0}
          sx={{
            borderRadius: 4,
            textAlign: 'center',
            p: 6,
            background: cardBackground,
            color: '#ffffff',
            boxShadow: darkMode
              ? '0 20px 40px rgba(190, 24, 93, 0.25)'
              : '0 20px 45px rgba(236, 72, 153, 0.3)',
          }}
        >
          <Typography variant="h2" sx={{ mb: 2, color: primaryTextColor }}>
            📝
          </Typography>
          <Typography variant="h5" fontWeight={600} sx={{ mb: 2, color: primaryTextColor }}>
            Chưa có bài tập nào
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, opacity: 0.9, color: secondaryTextColor }}>
            Các bài tập từ lớp học của bạn sẽ hiển thị ở đây
          </Typography>
        </Paper>
      )}
    </Box>
  );
}

