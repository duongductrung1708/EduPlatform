import React, { useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Alert,
  Card,
  CardContent,
  TextField,
  Button,
  Stack,
  Chip,
  Grid,
  IconButton,
  Tooltip,
  CircularProgress,
  Divider,
} from '@mui/material';
import { assignmentsApi } from '../api/assignments';
import BackButton from '../components/BackButton';
import Breadcrumb from '../components/Breadcrumb';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import GradeIcon from '@mui/icons-material/Grade';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DownloadIcon from '@mui/icons-material/Download';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { ShimmerBox } from '../components/LoadingSkeleton';
import { resolveFileUrl } from '../utils/url';

const GradeSubmissionsPage: React.FC = () => {
  const { classroomId, assignmentId } = useParams();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [assignment, setAssignment] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState<Record<string, boolean>>({});
  const [grades, setGrades] = useState<Record<string, { grade: string; feedback: string }>>({});

  const fetchSubmissions = async () => {
    if (!classroomId || !assignmentId) return;
    try {
      setLoading(true);
      setError(null);
      const [list, assignmentData] = await Promise.all([
        assignmentsApi.listSubmissions(classroomId, assignmentId),
        assignmentsApi.getById(classroomId, assignmentId).catch(() => null),
      ]);
      setSubmissions(list);
      setAssignment(assignmentData);

      // Pre-fill grades from existing submissions
      const gradesMap: Record<string, { grade: string; feedback: string }> = {};
      list.forEach((s: any) => {
        if (s.grade !== undefined || s.feedback) {
          gradesMap[s._id] = {
            grade: s.grade?.toString() || '',
            feedback: s.feedback || '',
          };
        }
      });
      setGrades(gradesMap);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Không thể tải danh sách bài nộp');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [classroomId, assignmentId]);

  const gradeOne = async (submissionId: string) => {
    if (!classroomId || !assignmentId) return;
    const s = grades[submissionId] || { grade: '', feedback: '' };

    // Validate grade if provided
    if (s.grade) {
      const gradeNum = parseFloat(s.grade);
      if (Number.isNaN(gradeNum)) {
        setError('Điểm phải là số');
        return;
      }
      if (gradeNum < 0) {
        setError('Điểm không được âm');
        return;
      }
      if (assignment?.totalPoints && gradeNum > assignment.totalPoints) {
        setError(`Điểm không được vượt quá ${assignment.totalPoints}`);
        return;
      }
    }

    if (!s.grade && !s.feedback) {
      setError('Vui lòng nhập điểm hoặc nhận xét');
      return;
    }

    try {
      setGrading((prev) => ({ ...prev, [submissionId]: true }));
      setError(null);
      const payload: { grade?: number; feedback?: string } = {};
      if (s.grade) {
        payload.grade = parseFloat(s.grade);
      }
      if (s.feedback) {
        payload.feedback = s.feedback;
      }
      await assignmentsApi.grade(classroomId, assignmentId, submissionId, payload);
      setSuccess('Đã chấm điểm thành công');
      fetchSubmissions();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Không thể chấm điểm');
    } finally {
      setGrading((prev) => ({ ...prev, [submissionId]: false }));
    }
  };

  const formatSize = (size?: number) => {
    if (!size || size <= 0) return '';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${Math.round(size / 102.4) / 10} KB`;
    return `${Math.round(size / 104857.6) / 10} MB`;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 3, mb: 4 }}>
      <BackButton to={`/teacher/classrooms/${classroomId}/assignments`} />
      <Breadcrumb
        items={[
          { label: 'Trang chủ', path: '/dashboard' },
          { label: 'Lớp học', path: '/teacher/classrooms' },
          { label: assignment?.title || 'Chấm điểm', current: true },
        ]}
      />

      {assignment && (
        <Card
          sx={{
            mb: 3,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              background: 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
              color: 'white',
              p: 2.5,
            }}
          >
            <Box display="flex" alignItems="center" gap={1.5}>
              <AssignmentIcon sx={{ fontSize: 32, color: 'white' }} />
              <Box flex={1}>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: 'white',
                    textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                    mb: 0.5,
                  }}
                >
                  {assignment.title}
                </Typography>
                {assignment.description && (
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                    {assignment.description}
                  </Typography>
                )}
              </Box>
            </Box>
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 2 }}>
              {assignment.dueDate && (
                <Chip
                  icon={<AccessTimeIcon sx={{ color: 'white !important' }} />}
                  label={`Hạn nộp: ${new Date(assignment.dueDate).toLocaleString('vi-VN')}`}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.35)',
                    color: 'white',
                    fontWeight: 600,
                    '& .MuiChip-icon': {
                      color: 'white',
                    },
                  }}
                />
              )}
              {assignment.totalPoints && (
                <Chip
                  icon={<GradeIcon sx={{ color: 'white !important' }} />}
                  label={`${assignment.totalPoints} điểm`}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.35)',
                    color: 'white',
                    fontWeight: 600,
                    '& .MuiChip-icon': {
                      color: 'white',
                    },
                  }}
                />
              )}
              <Chip
                label={`${submissions.length} bài nộp`}
                size="small"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.35)',
                  color: 'white',
                  fontWeight: 600,
                }}
              />
            </Stack>
          </Box>
        </Card>
      )}

      <Card
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: 3,
        }}
      >
        <Box
          sx={{
            background: 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
            color: 'white',
            p: 2.5,
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: 'white',
              textShadow: '0 1px 2px rgba(0,0,0,0.1)',
            }}
          >
            Chấm điểm bài nộp
          </Typography>
        </Box>

        <CardContent sx={{ p: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}

          {loading ? (
            <Stack spacing={2}>
              {Array.from({ length: 3 }).map((_, idx) => (
                <Card key={idx} sx={{ border: '1px solid', borderColor: 'divider' }}>
                  <Box
                    sx={{
                      background: 'linear-gradient(90deg, #e0e0e0 0px, #f0f0f0 40px, #e0e0e0 80px)',
                      backgroundSize: '1000px 100%',
                      animation: 'shimmer 2s infinite linear',
                      '@keyframes shimmer': {
                        '0%': { backgroundPosition: '-1000px 0' },
                        '100%': { backgroundPosition: '1000px 0' },
                      },
                      p: 2,
                      pb: 1.5,
                    }}
                  >
                    <ShimmerBox width="40%" height="24px" borderRadius="4px" />
                  </Box>
                  <CardContent sx={{ p: 2.5 }}>
                    <ShimmerBox width="100%" height="16px" borderRadius="4px" sx={{ mb: 1 }} />
                    <ShimmerBox width="80%" height="16px" borderRadius="4px" sx={{ mb: 2 }} />
                    <Box display="flex" gap={1} sx={{ mb: 2 }}>
                      <ShimmerBox width="100px" height="40px" borderRadius="4px" />
                      <ShimmerBox width="200px" height="40px" borderRadius="4px" />
                      <ShimmerBox width="80px" height="40px" borderRadius="4px" />
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          ) : submissions.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                Chưa có bài nộp nào
              </Typography>
            </Box>
          ) : (
            <Stack spacing={2}>
              {submissions.map((s) => {
                // Extract student name safely
                const studentName =
                  typeof s.student === 'object' && s.student?.name
                    ? s.student.name
                    : typeof s.student === 'string'
                      ? s.student
                      : typeof s.studentId === 'string'
                        ? s.studentId
                        : 'Học sinh';

                const studentEmail =
                  typeof s.student === 'object' && s.student?.email ? s.student.email : '';

                const isGraded = s.grade !== undefined && s.grade !== null;
                const submittedAt = s.submittedAt || s.createdAt;

                return (
                  <Card
                    key={s._id}
                    sx={{
                      border: '1px solid',
                      borderColor: isGraded ? 'success.main' : 'divider',
                      borderWidth: isGraded ? 2 : 1,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 4,
                      },
                    }}
                  >
                    {/* Header */}
                    <Box
                      sx={{
                        background: isGraded
                          ? 'linear-gradient(135deg, #66BB6A 0%, #43A047 100%)'
                          : 'linear-gradient(135deg, #42A5F5 0%, #1E88E5 100%)',
                        color: 'white',
                        p: 2,
                        pb: 1.5,
                      }}
                    >
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box display="flex" alignItems="center" gap={1.5} flex={1}>
                          <PersonIcon sx={{ fontSize: 28, color: 'white' }} />
                          <Box>
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: 700,
                                color: 'white',
                                textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                              }}
                            >
                              {studentName}
                            </Typography>
                            {studentEmail && (
                              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                                {studentEmail}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                        <Stack direction="row" spacing={1}>
                          {submittedAt && (
                            <Chip
                              icon={<AccessTimeIcon sx={{ color: 'white !important' }} />}
                              label={new Date(submittedAt).toLocaleString('vi-VN')}
                              size="small"
                              sx={{
                                bgcolor: 'rgba(255,255,255,0.35)',
                                color: 'white',
                                fontWeight: 600,
                                fontSize: '0.7rem',
                                '& .MuiChip-icon': {
                                  color: 'white',
                                },
                              }}
                            />
                          )}
                          {isGraded && (
                            <Chip
                              icon={<CheckCircleIcon sx={{ color: 'green !important' }} />}
                              label={`Đã chấm: ${s.grade}${assignment?.totalPoints ? `/${assignment.totalPoints}` : ''}`}
                              size="small"
                              sx={{
                                bgcolor: 'rgba(255,255,255,0.9)',
                                color: 'success.dark',
                                fontWeight: 700,
                                '& .MuiChip-icon': {
                                  color: 'success.dark',
                                },
                              }}
                            />
                          )}
                        </Stack>
                      </Box>
                    </Box>

                    <CardContent sx={{ p: 2.5 }}>
                      {/* Content */}
                      {s.contentText && (
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 2,
                            mb: 2,
                            bgcolor: 'action.hover',
                            borderColor: 'divider',
                          }}
                        >
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                            {s.contentText}
                          </Typography>
                        </Paper>
                      )}

                      {/* Attachments */}
                      {s.attachments && s.attachments.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                            Tệp đính kèm ({s.attachments.length}):
                          </Typography>
                          <Stack spacing={1}>
                            {s.attachments.map((a: any, idx: number) => {
                              const fileUrl = resolveFileUrl(a.url) || a.url;
                              return (
                                <Paper
                                  key={idx}
                                  variant="outlined"
                                  sx={{
                                    p: 1.5,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.5,
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                      bgcolor: 'action.hover',
                                      boxShadow: 2,
                                    },
                                  }}
                                >
                                  <AttachFileIcon sx={{ color: 'primary.main' }} />
                                  <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
                                      {a.name || fileUrl}
                                    </Typography>
                                    {a.size && (
                                      <Typography variant="caption" color="text.secondary">
                                        {formatSize(a.size)}
                                      </Typography>
                                    )}
                                  </Box>
                                  <Tooltip title="Tải xuống">
                                    <IconButton
                                      size="small"
                                      component="a"
                                      href={fileUrl}
                                      download
                                      sx={{ color: 'primary.main' }}
                                    >
                                      <DownloadIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Paper>
                              );
                            })}
                          </Stack>
                        </Box>
                      )}

                      <Divider sx={{ my: 2 }} />

                      {/* Grading Form */}
                      <Box>
                        <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
                          Chấm điểm
                        </Typography>
                        <Grid container spacing={2} alignItems="flex-start">
                          <Grid item xs={12} sm={3}>
                            <TextField
                              label="Điểm"
                              size="small"
                              fullWidth
                              type="number"
                              value={grades[s._id]?.grade || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                // Allow empty, numbers, and decimals
                                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                  setGrades((prev) => ({
                                    ...prev,
                                    [s._id]: {
                                      ...(prev[s._id] || { grade: '', feedback: '' }),
                                      grade: value,
                                    },
                                  }));
                                }
                              }}
                              placeholder={
                                assignment?.totalPoints
                                  ? `0-${assignment.totalPoints}`
                                  : 'Điểm (VD: 8.5)'
                              }
                              inputProps={{
                                min: 0,
                                max: assignment?.totalPoints || undefined,
                                step: 0.01,
                              }}
                            />
                            {assignment?.totalPoints && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ mt: 0.5, display: 'block' }}
                              >
                                Tối đa: {assignment.totalPoints} điểm (có thể nhập thập phân)
                              </Typography>
                            )}
                          </Grid>
                          <Grid item xs={12} sm={7}>
                            <TextField
                              label="Nhận xét"
                              size="small"
                              fullWidth
                              multiline
                              minRows={2}
                              value={grades[s._id]?.feedback || ''}
                              onChange={(e) =>
                                setGrades((prev) => ({
                                  ...prev,
                                  [s._id]: {
                                    ...(prev[s._id] || { grade: '', feedback: '' }),
                                    feedback: e.target.value,
                                  },
                                }))
                              }
                              placeholder="Nhập nhận xét cho học sinh..."
                            />
                          </Grid>
                          <Grid item xs={12} sm={2}>
                            <Button
                              variant="contained"
                              fullWidth
                              onClick={() => gradeOne(s._id)}
                              disabled={grading[s._id]}
                              sx={{
                                background: 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
                                '&:hover': {
                                  background: 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
                                },
                                fontWeight: 600,
                                height: '100%',
                                minHeight: 40,
                              }}
                            >
                              {grading[s._id] ? (
                                <CircularProgress size={20} sx={{ color: 'white' }} />
                              ) : (
                                'Lưu'
                              )}
                            </Button>
                          </Grid>
                        </Grid>

                        {/* Existing feedback display */}
                        {isGraded && s.feedback && (
                          <Paper
                            variant="outlined"
                            sx={{
                              p: 1.5,
                              mt: 2,
                              bgcolor: 'success.light',
                              borderColor: 'success.main',
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600, mb: 0.5, color: 'white' }}
                            >
                              Nhận xét hiện tại:
                            </Typography>
                            <Typography variant="body2" color="white">
                              {s.feedback}
                            </Typography>
                          </Paper>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                );
              })}
            </Stack>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default GradeSubmissionsPage;
