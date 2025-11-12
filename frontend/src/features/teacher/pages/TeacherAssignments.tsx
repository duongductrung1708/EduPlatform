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
  IconButton,
  Tooltip,
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PeopleIcon from '@mui/icons-material/People';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { assignmentsApi, AssignmentItem } from '../../../api/assignments';
import { classesApi } from '../../../api/admin';
import { useTheme } from '../../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { ShimmerBox, DarkShimmerBox } from '../../../components/LoadingSkeleton';

interface AssignmentWithClassroom extends AssignmentItem {
  classroomId: string;
  classroomName?: string;
  submissionsCount?: number;
}

export default function TeacherAssignments() {
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
  const surfaceBorder = darkMode ? 'rgba(148, 163, 184, 0.2)' : 'rgba(239, 91, 91, 0.12)';

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all classrooms for the teacher
      let classrooms: any[] = [];
      try {
        const classroomsResponse = await classesApi.listMy(1, 100);
        classrooms = classroomsResponse.items || [];
      } catch (err: any) {
        if (err?.response?.status === 401) {
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
          
          // Get submission count for each assignment
          const assignmentsWithSubmissions = await Promise.all(
            classroomAssignments.map(async (assignment) => {
              try {
                const submissions = await assignmentsApi.listSubmissions(classroom._id, assignment._id);
                return {
                  ...assignment,
                  classroomId: classroom._id,
                  classroomName: (classroom as any).title || (classroom as any).name || 'Lớp học',
                  submissionsCount: submissions?.length || 0,
                };
              } catch {
                return {
                  ...assignment,
                  classroomId: classroom._id,
                  classroomName: (classroom as any).title || (classroom as any).name || 'Lớp học',
                  submissionsCount: 0,
                };
              }
            })
          );

          allAssignments.push(...assignmentsWithSubmissions);
        } catch (err) {
          // Skip classrooms that fail to load assignments
        }
      }

      // Sort by creation date (newest first)
      allAssignments.sort((a, b) => {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });

      setAssignments(allAssignments);
    } catch (err: any) {
      const apiMsg = err?.response?.data?.message || err?.response?.data?.error || err?.message;
      setError(apiMsg || 'Không thể tải danh sách bài tập');
    } finally {
      setLoading(false);
    }
  };

  const handleViewAssignment = (classroomId: string, assignmentId: string) => {
    navigate(`/teacher/classrooms/${classroomId}/assignments`);
  };

  const renderLoadingSkeleton = () => {
    const Shimmer = darkMode ? DarkShimmerBox : ShimmerBox;
    return (
      <Grid container spacing={3}>
        {Array.from({ length: 6 }).map((_, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Card
              sx={{
                background: cardBackground,
                border: `1px solid ${surfaceBorder}`,
                borderRadius: 3,
                overflow: 'hidden',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Shimmer height="24px" width="70%" borderRadius="4px" />
                    <Box sx={{ mt: 1.5 }}>
                      <Shimmer height="20px" width="40%" borderRadius="4px" />
                    </Box>
                  </Box>
                  <Shimmer height="32px" width="32px" borderRadius="50%" />
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Shimmer height="16px" width="100%" borderRadius="4px" />
                  <Box sx={{ mt: 1 }}>
                    <Shimmer height="16px" width="80%" borderRadius="4px" />
                  </Box>
                </Box>
                <Divider sx={{ my: 2, borderColor: surfaceBorder }} />
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <Shimmer height="24px" width="120px" borderRadius="12px" />
                  <Shimmer height="24px" width="100px" borderRadius="12px" />
                  <Shimmer height="24px" width="80px" borderRadius="12px" />
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
          Bài tập
        </Typography>
        {renderLoadingSkeleton()}
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 3, fontWeight: 600, color: primaryTextColor }}>
          Bài tập
        </Typography>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: primaryTextColor }}>
          Bài tập
        </Typography>
        <Chip
          label={`${assignments.length} bài tập`}
          sx={{
            bgcolor: darkMode ? 'rgba(239, 91, 91, 0.2)' : 'rgba(239, 91, 91, 0.1)',
            color: '#EF5B5B',
            fontWeight: 600,
          }}
        />
      </Box>

      {assignments.length === 0 ? (
        <Paper
          sx={{
            p: 6,
            textAlign: 'center',
            background: cardBackground,
            border: `1px solid ${surfaceBorder}`,
            borderRadius: 3,
          }}
        >
          <AssignmentIcon sx={{ fontSize: 64, color: secondaryTextColor, mb: 2 }} />
          <Typography variant="h6" sx={{ color: primaryTextColor, mb: 1 }}>
            Chưa có bài tập nào
          </Typography>
          <Typography variant="body2" sx={{ color: secondaryTextColor }}>
            Tạo bài tập mới trong lớp học của bạn để bắt đầu
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {assignments.map((assignment) => (
            <Grid item xs={12} md={6} key={`${assignment.classroomId}-${assignment._id}`}>
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
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          color: primaryTextColor,
                          mb: 1,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {assignment.title}
                      </Typography>
                      <Chip
                        label={assignment.classroomName || 'Lớp học'}
                        size="small"
                        sx={{
                          bgcolor: darkMode ? 'rgba(239, 91, 91, 0.2)' : 'rgba(239, 91, 91, 0.1)',
                          color: '#EF5B5B',
                          fontWeight: 500,
                        }}
                      />
                    </Box>
                    <Tooltip title="Xem chi tiết">
                      <IconButton
                        size="small"
                        onClick={() => handleViewAssignment(assignment.classroomId, assignment._id)}
                        sx={{
                          color: '#EF5B5B',
                          '&:hover': {
                            bgcolor: darkMode ? 'rgba(239, 91, 91, 0.2)' : 'rgba(239, 91, 91, 0.1)',
                          },
                        }}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  {assignment.description && (
                    <Typography
                      variant="body2"
                      sx={{
                        color: secondaryTextColor,
                        mb: 2,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {assignment.description}
                    </Typography>
                  )}

                  <Divider sx={{ my: 2, borderColor: surfaceBorder }} />

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
                    {assignment.dueDate && (
                      <Chip
                        icon={<AccessTimeIcon sx={{ fontSize: 16 }} />}
                        label={`Hạn: ${new Date(assignment.dueDate).toLocaleDateString('vi-VN')}`}
                        size="small"
                        sx={{
                          bgcolor: darkMode ? 'rgba(255, 152, 0, 0.2)' : 'rgba(255, 152, 0, 0.1)',
                          color: '#FF9800',
                        }}
                      />
                    )}
                    <Chip
                      icon={<PeopleIcon sx={{ fontSize: 16 }} />}
                      label={`${assignment.submissionsCount || 0} bài nộp`}
                      size="small"
                      sx={{
                        bgcolor: darkMode ? 'rgba(33, 150, 243, 0.2)' : 'rgba(33, 150, 243, 0.1)',
                        color: '#2196F3',
                      }}
                    />
                    {assignment.totalPoints && (
                      <Chip
                        label={`${assignment.totalPoints} điểm`}
                        size="small"
                        sx={{
                          bgcolor: darkMode ? 'rgba(76, 175, 80, 0.2)' : 'rgba(76, 175, 80, 0.1)',
                          color: '#4CAF50',
                        }}
                      />
                    )}
                  </Box>

                  {assignment.createdAt && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: secondaryTextColor,
                        display: 'block',
                        mt: 2,
                      }}
                    >
                      Tạo: {new Date(assignment.createdAt).toLocaleDateString('vi-VN')}
                    </Typography>
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

