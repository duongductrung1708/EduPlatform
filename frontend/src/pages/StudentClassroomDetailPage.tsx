import React, { useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Chip,
  Alert,
  Grid,
  Card,
  CardContent,
  Button,
  Breadcrumbs,
  Link as MuiLink,
  Snackbar,
  Stack,
  IconButton,
  Paper,
  Skeleton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
} from '@mui/material';
import { classesApi } from '../api/admin';
import { lessonsApi, LessonItem } from '../api/lessons';
import { assignmentsApi, AssignmentItem } from '../api/assignments';
import { useSocket } from '../hooks/useSocket';
import BackButton from '../components/BackButton';
import Breadcrumb from '../components/Breadcrumb';
import DownloadIcon from '@mui/icons-material/Download';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import MovieIcon from '@mui/icons-material/Movie';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import BookIcon from '@mui/icons-material/Book';
import AssignmentIcon from '@mui/icons-material/Assignment';
import LabelIcon from '@mui/icons-material/Label';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { ChatBox } from '../components/ChatBox';
import { resolveFileUrl } from '../utils/url';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { ShimmerBox } from '../components/LoadingSkeleton';

const StudentClassroomDetailPage: React.FC = () => {
  const { id } = useParams();
  const classroomId = id as string;

  const [info, setInfo] = useState<any | null>(null);
  const [lessons, setLessons] = useState<LessonItem[]>([]);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [mySubmissions, setMySubmissions] = useState<Record<string, any>>({});
  const { joinClassroom, onClassMessage, onJoinedClassroom, socket } = useSocket();
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string }>(() => ({
    open: false,
    message: '',
  }));
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [previewKind, setPreviewKind] = useState<'image' | 'video' | 'pdf' | 'doc' | 'other'>(
    'other',
  );
  const [previewTitle, setPreviewTitle] = useState<string>('Xem tài liệu');
  const [loading, setLoading] = useState(true);

  // Inline preview components
  const LazyImage: React.FC<{
    src: string;
    alt: string;
    width?: number | string;
    height?: number | string;
    style?: React.CSSProperties;
  }> = ({ src, alt, width = '100%', height = 140, style }) => {
    const [loaded, setLoaded] = useState(false);
    return (
      <Box sx={{ position: 'relative', width, height }}>
        {!loaded && <Skeleton variant="rounded" width="100%" height="100%" />}
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          style={{
            display: loaded ? 'block' : 'none',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: 8,
            border: '1px solid rgba(0,0,0,0.08)',
            ...(style || {}),
          }}
        />
      </Box>
    );
  };

  const LazyVideo: React.FC<{ src: string }> = ({ src }) => {
    const [ready, setReady] = useState(false);
    return (
      <Box sx={{ position: 'relative', width: '100%', borderRadius: 2 }}>
        {!ready && <Skeleton variant="rounded" width="100%" height={180} />}
        <video
          src={src}
          controls
          preload="metadata"
          onLoadedMetadata={() => setReady(true)}
          style={{
            width: '100%',
            borderRadius: 8,
            border: '1px solid rgba(0,0,0,0.08)',
            display: ready ? 'block' : 'none',
          }}
        />
      </Box>
    );
  };

  const LazyIframe: React.FC<{ src: string; height?: number }> = ({ src, height = 400 }) => {
    const [ready, setReady] = useState(false);
    return (
      <Box sx={{ position: 'relative', width: '100%' }}>
        {!ready && <Skeleton variant="rounded" width="100%" height={height} />}
        <iframe
          src={src}
          title="preview"
          loading="lazy"
          onLoad={() => setReady(true)}
          style={{
            width: '100%',
            height,
            border: 0,
            display: ready ? 'block' : 'none',
            borderRadius: 8,
          }}
        />
      </Box>
    );
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [cls, ls, asg] = await Promise.all([
          classesApi.getById(classroomId),
          lessonsApi.list(classroomId),
          assignmentsApi.list(classroomId),
        ]);
        setInfo(cls);
        setLessons(ls);
        setAssignments(asg);
        // fetch my submission status per assignment
        interface Assignment {
          _id: string;
          [key: string]: unknown;
        }
        const map: Record<string, { _id: string; [key: string]: unknown }> = {};
        await Promise.all(
          asg.map(async (a: Assignment) => {
            try {
              const sub = await assignmentsApi.getMySubmission(classroomId, a._id);
              if (sub) map[a._id] = sub;
            } catch {}
          }),
        );
        setMySubmissions(map);
      } catch (e: unknown) {
        const err = e as { response?: { data?: { message?: string } } };
        setError(err?.response?.data?.message || 'Không thể tải thông tin lớp học');
      } finally {
        setLoading(false);
      }
    })();
    // join realtime room
    if (classroomId) {
      joinClassroom(classroomId);
    }
    const handleJoined = () => {
      setToast({ open: true, message: 'Đã kết nối lớp (realtime)' });
    };
    const handleMsg = (data: { message?: string }) => {
      if (data?.message) setToast({ open: true, message: `Tin nhắn mới: ${data.message}` });
    };
    const handleGraded = (data: {
      assignmentId: string;
      studentId: string;
      grade?: number;
      feedback?: string;
      graded: boolean;
    }) => {
      // If the graded submission belongs to this classroom and current user, refresh my submission state for that assignment
      setMySubmissions((prev) => ({
        ...prev,
        [data.assignmentId]: {
          ...(prev[data.assignmentId] || {}),
          graded: data.graded,
          grade: data.grade,
          feedback: data.feedback,
        },
      }));
      setToast({ open: true, message: `Bài tập đã được chấm: ${data.grade ?? ''}` });
    };
    onJoinedClassroom(handleJoined);
    onClassMessage(handleMsg);
    // Wire graded event
    socket?.on('submissionGraded', handleGraded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classroomId]);

  return (
    <>
      <Container maxWidth="lg" sx={{ mt: 3, mb: 4 }}>
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: 'Trang chủ', path: '/dashboard' },
            { label: 'Lớp học', path: '/dashboard' },
            { label: info?.name || 'Chi tiết lớp học', current: true },
          ]}
        />

        {/* Back Button */}
        <BackButton to="/dashboard" />

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Snackbar
          open={toast.open}
          autoHideDuration={3000}
          onClose={() => setToast({ open: false, message: '' })}
          message={toast.message}
        />
        <Breadcrumbs sx={{ mb: 1 }}>
          <MuiLink component={RouterLink} to="/student" underline="hover" color="inherit">
            Trang học sinh
          </MuiLink>
          <Typography color="text.secondary">{info?.title || 'Lớp học'}</Typography>
        </Breadcrumbs>
        <Box display="flex" alignItems="center" justifyContent="space_between" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              {info?.title || 'Lớp học'}
            </Typography>
            <Box display="flex" gap={1} sx={{ mt: 0.5 }}>
              {info?.courseId?.title && (
                <Chip size="small" label={`Khóa học: ${info.courseId.title}`} />
              )}
              {info?.schedule?.startDate && (
                <Chip
                  size="small"
                  label={`Bắt đầu: ${new Date(info.schedule.startDate).toLocaleDateString()}`}
                />
              )}
            </Box>
          </Box>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={12}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Bài giảng
            </Typography>
            {loading ? (
              <Grid container spacing={2}>
                {Array.from({ length: 3 }).map((_, idx) => (
                  <Grid item xs={12} key={idx}>
                    <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
                      <Box
                        sx={{
                          background:
                            'linear-gradient(90deg, #e0e0e0 0px, #f0f0f0 40px, #e0e0e0 80px)',
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
                        <ShimmerBox width="60%" height="28px" borderRadius="4px" />
                      </Box>
                      <CardContent sx={{ p: 2.5 }}>
                        <ShimmerBox width="100%" height="16px" borderRadius="4px" sx={{ mb: 1 }} />
                        <ShimmerBox width="80%" height="16px" borderRadius="4px" sx={{ mb: 2 }} />
                        <Box display="flex" gap={1} sx={{ mb: 2 }}>
                          <ShimmerBox width="100px" height="24px" borderRadius="16px" />
                          <ShimmerBox width="80px" height="24px" borderRadius="16px" />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Grid container spacing={2}>
                {lessons.map((l) => (
                  <Grid item xs={12} key={l._id}>
                    <Card
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'all 0.3s ease',
                        border: '1px solid',
                        borderColor: 'divider',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: 6,
                        },
                      }}
                    >
                      {/* Header with gradient */}
                      <Box
                        sx={{
                          background: 'linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)',
                          color: 'white',
                          p: 2,
                          pb: 1.5,
                        }}
                      >
                        <Box
                          display="flex"
                          alignItems="flex-start"
                          justifyContent="space-between"
                          sx={{ mb: 1 }}
                        >
                          <Box display="flex" alignItems="center" gap={1} flex={1}>
                            <BookIcon sx={{ fontSize: 28, color: 'white' }} />
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: 700,
                                color: 'white',
                                flex: 1,
                                textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                              }}
                            >
                              {l.title}
                            </Typography>
                          </Box>
                          <Tooltip
                            title={expandedLessonId === l._id ? 'Ẩn thảo luận' : 'Thảo luận'}
                          >
                            <IconButton
                              size="small"
                              sx={{
                                color: 'white',
                                bgcolor: 'rgba(255,255,255,0.25)',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.4)' },
                              }}
                              onClick={() =>
                                setExpandedLessonId((prev) => (prev === l._id ? null : l._id))
                              }
                            >
                              <ChatBubbleOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>

                        {/* Tags, Topic, Week chips */}
                        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
                          {l.topic && (
                            <Chip
                              icon={<LabelIcon sx={{ color: 'white !important' }} />}
                              label={l.topic}
                              size="small"
                              sx={{
                                bgcolor: 'rgba(255,255,255,0.35)',
                                color: 'white',
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                '& .MuiChip-icon': {
                                  color: 'white',
                                },
                              }}
                            />
                          )}
                          {l.week !== undefined && (
                            <Chip
                              icon={<CalendarTodayIcon sx={{ color: 'white !important' }} />}
                              label={`Tuần ${l.week}`}
                              size="small"
                              sx={{
                                bgcolor: 'rgba(255,255,255,0.35)',
                                color: 'white',
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                '& .MuiChip-icon': {
                                  color: 'white',
                                },
                              }}
                            />
                          )}
                          {l.tags &&
                            l.tags.length > 0 &&
                            l.tags.map((tag, idx) => (
                              <Chip
                                key={idx}
                                label={tag}
                                size="small"
                                sx={{
                                  bgcolor: 'rgba(255,255,255,0.35)',
                                  color: 'white',
                                  fontWeight: 600,
                                  fontSize: '0.7rem',
                                }}
                              />
                            ))}
                        </Stack>
                      </Box>

                      <CardContent
                        sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2.5 }}
                      >
                        {l.attachments && l.attachments.length > 0 && (
                          <Box sx={{ mt: 2 }}>
                            <Typography
                              variant="body2"
                              sx={{ mb: 1.5, fontWeight: 600, color: 'text.primary' }}
                            >
                              Tài liệu đính kèm ({l.attachments.length})
                            </Typography>
                            <Stack spacing={1}>
                              {l.attachments.map((a, idx) => {
                                const getIcon = () => {
                                  const name = (a.name || a.url || '').toLowerCase();
                                  const type = (a.type || '').toLowerCase();
                                  if (name.endsWith('.pdf') || type.includes('pdf'))
                                    return <PictureAsPdfIcon fontSize="small" color="error" />;
                                  if (type.includes('image'))
                                    return <ImageIcon fontSize="small" color="primary" />;
                                  if (type.includes('video'))
                                    return <MovieIcon fontSize="small" color="action" />;
                                  return <InsertDriveFileIcon fontSize="small" color="action" />;
                                };
                                const formatSize = (size?: number) => {
                                  if (!size || size <= 0) return '';
                                  if (size < 1024) return `${size} B`;
                                  if (size < 1024 * 1024)
                                    return `${Math.round(size / 102.4) / 10} KB`;
                                  return `${Math.round(size / 104857.6) / 10} MB`;
                                };
                                const secondary = formatSize(a.size);
                                const fileUrl = resolveFileUrl(a.url) || a.url;
                                const determinePreview = () => {
                                  try {
                                    const u = new URL(fileUrl);
                                    const pathname = u.pathname || '';
                                    const ext = (pathname.split('.').pop() || '').toLowerCase();
                                    const lower = (fileUrl || '').toLowerCase();
                                    if (
                                      /(png|jpe?g|gif|webp|svg)$/i.test(ext) ||
                                      (a.type || '').includes('image')
                                    ) {
                                      setPreviewKind('image');
                                      setPreviewUrl(fileUrl);
                                      return;
                                    }
                                    if (
                                      /(mp4|webm|ogg)$/i.test(ext) ||
                                      (a.type || '').includes('video')
                                    ) {
                                      setPreviewKind('video');
                                      setPreviewUrl(fileUrl);
                                      return;
                                    }
                                    if (ext === 'pdf' || (a.type || '').includes('pdf')) {
                                      setPreviewKind('pdf');
                                      setPreviewUrl(fileUrl);
                                      return;
                                    }
                                    const office = new Set([
                                      'doc',
                                      'docx',
                                      'xls',
                                      'xlsx',
                                      'ppt',
                                      'pptx',
                                    ]);
                                    const google = new Set([
                                      'odt',
                                      'ods',
                                      'odp',
                                      'rtf',
                                      'txt',
                                      'csv',
                                    ]);
                                    const enc = encodeURIComponent(fileUrl);
                                    if (office.has(ext)) {
                                      setPreviewKind('doc');
                                      setPreviewUrl(
                                        `https://view.officeapps.live.com/op/embed.aspx?src=${enc}`,
                                      );
                                      return;
                                    }
                                    if (google.has(ext)) {
                                      setPreviewKind('doc');
                                      setPreviewUrl(
                                        `https://docs.google.com/gview?embedded=true&url=${enc}`,
                                      );
                                      return;
                                    }
                                  } catch {}
                                  setPreviewKind('other');
                                  setPreviewUrl(fileUrl);
                                };
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
                                    <Box sx={{ color: 'primary.main' }}>{getIcon()}</Box>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                      <Typography
                                        variant="body2"
                                        sx={{ fontWeight: 500, mb: 0.25 }}
                                        noWrap
                                      >
                                        {a.name || fileUrl || ''}
                                      </Typography>
                                      {secondary && (
                                        <Typography variant="caption" color="text.secondary">
                                          {secondary}
                                        </Typography>
                                      )}
                                    </Box>
                                    <Box display="flex" gap={0.5}>
                                      <Tooltip title="Xem nhanh">
                                        <IconButton
                                          size="small"
                                          onClick={() => {
                                            setPreviewTitle(a.name || 'Xem tài liệu');
                                            determinePreview();
                                            setPreviewOpen(true);
                                          }}
                                          sx={{ color: 'primary.main' }}
                                        >
                                          <OpenInNewIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
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
                                    </Box>
                                  </Paper>
                                );
                              })}
                            </Stack>
                          </Box>
                        )}

                        {expandedLessonId === l._id && (
                          <Box
                            sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}
                          >
                            <ChatBox classroomId={classroomId} lessonId={l._id} />
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
                {lessons.length === 0 && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ px: 2, py: 3, textAlign: 'center' }}
                  >
                    Chưa có bài giảng
                  </Typography>
                )}
              </Grid>
            )}
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Bài tập
            </Typography>
            {loading ? (
              <Grid container spacing={2}>
                {Array.from({ length: 2 }).map((_, idx) => (
                  <Grid item xs={12} key={idx}>
                    <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
                      <Box
                        sx={{
                          background:
                            'linear-gradient(90deg, #e0e0e0 0px, #f0f0f0 40px, #e0e0e0 80px)',
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
                        <ShimmerBox width="70%" height="24px" borderRadius="4px" />
                      </Box>
                      <CardContent sx={{ p: 2.5 }}>
                        <ShimmerBox
                          width="100%"
                          height="16px"
                          borderRadius="4px"
                          sx={{ mb: 1.5 }}
                        />
                        <Box display="flex" gap={1} sx={{ mb: 1.5 }}>
                          <ShimmerBox width="80px" height="24px" borderRadius="16px" />
                          <ShimmerBox width="100px" height="32px" borderRadius="4px" />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Grid container spacing={2}>
                {assignments.map((a) => {
                  const isOverdue =
                    a.dueDate && new Date(a.dueDate) < new Date() && !mySubmissions[a._id];
                  const isSubmitted = !!mySubmissions[a._id];
                  const isGraded = mySubmissions[a._id]?.graded;

                  return (
                    <Grid item xs={12} key={a._id}>
                      <Card
                        sx={{
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          transition: 'all 0.3s ease',
                          border: '1px solid',
                          borderColor: isOverdue ? 'error.main' : 'divider',
                          borderWidth: isOverdue ? 2 : 1,
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: 6,
                          },
                        }}
                      >
                        {/* Header with gradient */}
                        <Box
                          sx={{
                            background: isOverdue
                              ? 'linear-gradient(135deg, #EF5350 0%, #E53935 100%)'
                              : isGraded
                                ? 'linear-gradient(135deg, #66BB6A 0%, #43A047 100%)'
                                : 'linear-gradient(135deg, #FFA726 0%, #FB8C00 100%)',
                            color: 'white',
                            p: 2,
                            pb: 1.5,
                          }}
                        >
                          <Box display="flex" alignItems="center" gap={1} sx={{ mb: 1 }}>
                            <AssignmentIcon sx={{ fontSize: 28, color: 'white' }} />
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: 700,
                                color: 'white',
                                flex: 1,
                                textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                              }}
                            >
                              {a.title}
                            </Typography>
                          </Box>

                          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
                            {a.dueDate && (
                              <Chip
                                icon={<AccessTimeIcon sx={{ color: 'white !important' }} />}
                                label={`Hạn nộp: ${new Date(a.dueDate).toLocaleDateString('vi-VN')}`}
                                size="small"
                                sx={{
                                  bgcolor: 'rgba(255,255,255,0.35)',
                                  color: 'white',
                                  fontWeight: 600,
                                  fontSize: '0.75rem',
                                  '& .MuiChip-icon': {
                                    color: 'white',
                                  },
                                }}
                              />
                            )}
                            {a.totalPoints && (
                              <Chip
                                label={`${a.totalPoints} điểm`}
                                size="small"
                                sx={{
                                  bgcolor: 'rgba(255,255,255,0.35)',
                                  color: 'white',
                                  fontWeight: 600,
                                  fontSize: '0.75rem',
                                }}
                              />
                            )}
                            {isOverdue && (
                              <Chip
                                label="Quá hạn"
                                size="small"
                                sx={{
                                  bgcolor: 'rgba(255,255,255,0.9)',
                                  color: 'error.main',
                                  fontWeight: 700,
                                  fontSize: '0.75rem',
                                }}
                              />
                            )}
                          </Stack>
                        </Box>

                        <CardContent
                          sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2.5 }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              flexWrap: 'wrap',
                              mb: 2,
                            }}
                          >
                            <Chip
                              icon={isSubmitted ? <CheckCircleIcon /> : undefined}
                              label={isSubmitted ? 'Đã nộp' : 'Chưa nộp'}
                              size="small"
                              color={isSubmitted ? 'success' : 'default'}
                              sx={{ fontWeight: 600, color: 'white' }}
                            />
                            {isGraded && (
                              <Chip
                                label={`Điểm: ${mySubmissions[a._id].grade}${a.totalPoints ? `/${a.totalPoints}` : ''}`}
                                size="small"
                                color="primary"
                                sx={{ fontWeight: 600 }}
                              />
                            )}
                          </Box>

                          {mySubmissions[a._id]?.feedback && (
                            <Paper
                              variant="outlined"
                              sx={{
                                p: 1.5,
                                mb: 2,
                                bgcolor: 'action.hover',
                                borderColor: 'primary.main',
                              }}
                            >
                              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                Nhận xét:
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {mySubmissions[a._id].feedback}
                              </Typography>
                            </Paper>
                          )}

                          <Button
                            fullWidth
                            variant="contained"
                            component={RouterLink}
                            to={`/classes/${classroomId}/assignments/${a._id}/submit`}
                            sx={{
                              mt: 'auto',
                              background: isSubmitted
                                ? 'linear-gradient(135deg, #42A5F5 0%, #1E88E5 100%)'
                                : 'linear-gradient(135deg, #EF5B5B 0%, #E53935 100%)',
                              '&:hover': {
                                background: isSubmitted
                                  ? 'linear-gradient(135deg, #1E88E5 0%, #1565C0 100%)'
                                  : 'linear-gradient(135deg, #E53935 0%, #C62828 100%)',
                              },
                              fontWeight: 600,
                            }}
                          >
                            {isSubmitted ? 'Xem/Nộp lại' : 'Nộp bài'}
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
                {assignments.length === 0 && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ px: 2, py: 3, textAlign: 'center' }}
                  >
                    Chưa có bài tập
                  </Typography>
                )}
              </Grid>
            )}
          </Grid>
        </Grid>
      </Container>

      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} fullWidth maxWidth="lg">
        <DialogTitle>{previewTitle}</DialogTitle>
        <DialogContent>
          {previewKind === 'image' && (
            <Box sx={{ width: '100%', maxHeight: '70vh' }}>
              <LazyImage src={previewUrl} alt={previewTitle} height={300} />
            </Box>
          )}
          {previewKind === 'video' && (
            <Box sx={{ width: '100%' }}>
              <LazyVideo src={previewUrl} />
            </Box>
          )}
          {previewKind === 'pdf' && (
            <Paper variant="outlined" sx={{ p: 1, borderRadius: 2 }}>
              <LazyIframe src={previewUrl} height={500} />
            </Paper>
          )}
          {previewKind === 'doc' && (
            <Paper variant="outlined" sx={{ p: 1, borderRadius: 2 }}>
              <LazyIframe src={previewUrl} height={500} />
            </Paper>
          )}
          {previewKind === 'other' && (
            <Typography variant="body2" color="text.secondary">
              Không hỗ trợ xem nhanh định dạng này. Vui lòng mở trong tab mới.
            </Typography>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default StudentClassroomDetailPage;
