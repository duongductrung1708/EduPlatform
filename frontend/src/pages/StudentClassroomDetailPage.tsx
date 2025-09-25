import React, { useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { Box, Container, Typography, Chip, Alert, Grid, Card, CardContent, Button, Breadcrumbs, Link as MuiLink, Snackbar, Stack, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider, IconButton, Paper, Skeleton, Tooltip, Dialog, DialogTitle, DialogContent } from '@mui/material';
import { classesApi } from '../api/admin';
import { lessonsApi, LessonItem } from '../api/lessons';
import { assignmentsApi, AssignmentItem } from '../api/assignments';
import { useSocket } from '../hooks/useSocket';
import BackButton from '../components/BackButton';
import Breadcrumb from '../components/Breadcrumb';
import DownloadIcon from '@mui/icons-material/Download';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import MovieIcon from '@mui/icons-material/Movie';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { ChatBox } from '../components/ChatBox';
import { resolveFileUrl } from '../utils/url';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

const StudentClassroomDetailPage: React.FC = () => {
  const { id } = useParams();
  const classroomId = id as string;

  const [info, setInfo] = useState<any | null>(null);
  const [lessons, setLessons] = useState<LessonItem[]>([]);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [mySubmissions, setMySubmissions] = useState<Record<string, any>>({});
  const { joinClassroom, onClassMessage, onJoinedClassroom, socket } = useSocket();
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string }>(() => ({ open: false, message: '' }));
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [previewKind, setPreviewKind] = useState<'image'|'video'|'pdf'|'doc'|'other'>('other');
  const [previewTitle, setPreviewTitle] = useState<string>('Xem tài liệu');
  
  // Inline preview components
  const LazyImage: React.FC<{ src: string; alt: string; width?: number | string; height?: number | string; style?: React.CSSProperties }> = ({ src, alt, width = '100%', height = 140, style }) => {
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
          style={{ width: '100%', borderRadius: 8, border: '1px solid rgba(0,0,0,0.08)', display: ready ? 'block' : 'none' }}
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
          style={{ width: '100%', height, border: 0, display: ready ? 'block' : 'none', borderRadius: 8 }}
        />
      </Box>
    );
  };

  useEffect(() => {
    (async () => {
      try {
        const [cls, ls, asg] = await Promise.all([
          classesApi.getById(classroomId),
          lessonsApi.list(classroomId),
          assignmentsApi.list(classroomId),
        ]);
        setInfo(cls);
        setLessons(ls);
        setAssignments(asg);
        // fetch my submission status per assignment
        const map: Record<string, any> = {};
        await Promise.all(asg.map(async (a: any) => {
          try {
            const sub = await assignmentsApi.getMySubmission(classroomId, a._id);
            if (sub) map[a._id] = sub;
          } catch {}
        }));
        setMySubmissions(map);
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Không thể tải thông tin lớp học');
      }
    })();
    // join realtime room
    if (classroomId) {
      joinClassroom(classroomId);
    }
    const handleJoined = () => {
      setToast({ open: true, message: 'Đã kết nối lớp (realtime)' });
    };
    const handleMsg = (data: any) => {
      if (data?.message) setToast({ open: true, message: `Tin nhắn mới: ${data.message}` });
    };
    const handleGraded = (data: { assignmentId: string; studentId: string; grade?: number; feedback?: string; graded: boolean }) => {
      // If the graded submission belongs to this classroom and current user, refresh my submission state for that assignment
      setMySubmissions(prev => ({
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
          { label: info?.name || 'Chi tiết lớp học', current: true }
        ]}
      />
      
      {/* Back Button */}
      <BackButton to="/dashboard" />
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast({ open: false, message: '' })}
        message={toast.message}
      />
      <Breadcrumbs sx={{ mb: 1 }}>
        <MuiLink component={RouterLink} to="/student" underline="hover" color="inherit">Trang học sinh</MuiLink>
        <Typography color="text.secondary">{info?.title || 'Lớp học'}</Typography>
      </Breadcrumbs>
      <Box display="flex" alignItems="center" justifyContent="space_between" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{info?.title || 'Lớp học'}</Typography>
          <Box display="flex" gap={1} sx={{ mt: 0.5 }}>
            {info?.courseId?.title && <Chip size="small" label={`Khóa học: ${info.courseId.title}`} />}
            {info?.schedule?.startDate && <Chip size="small" label={`Bắt đầu: ${new Date(info.schedule.startDate).toLocaleDateString()}`} />}
          </Box>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={12}>
          <Typography variant="h6" sx={{ mb: 1 }}>Bài giảng</Typography>
          <Grid container spacing={2}>
            {lessons.map((l) => (
              <Grid item xs={12} key={l._id}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{l.title}</Typography>
                    {l.topic && <Typography variant="body2" color="text.secondary">Chủ đề: {l.topic}</Typography>}
                    {l.week !== undefined && <Typography variant="body2" color="text.secondary">Tuần: {l.week}</Typography>}
                    {l.attachments && l.attachments.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          📎 Tài liệu đính kèm ({l.attachments.length}):
                        </Typography>
                        <List dense disablePadding>
                          {l.attachments.map((a, idx) => {
                            const getIcon = () => {
                              const name = (a.name || a.url || '').toLowerCase();
                              const type = (a.type || '').toLowerCase();
                              if (name.endsWith('.pdf') || type.includes('pdf')) return <PictureAsPdfIcon fontSize="small" color="error" />;
                              if (type.includes('image')) return <ImageIcon fontSize="small" color="primary" />;
                              if (type.includes('video')) return <MovieIcon fontSize="small" color="action" />;
                              return <InsertDriveFileIcon fontSize="small" color="action" />;
                            };
                            const formatSize = (size?: number) => {
                              if (!size || size <= 0) return '';
                              if (size < 1024) return `${size} B`;
                              if (size < 1024 * 1024) return `${Math.round(size / 102.4) / 10} KB`;
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
                                if (/(png|jpe?g|gif|webp|svg)$/i.test(ext) || (a.type || '').includes('image')) {
                                  setPreviewKind('image');
                                  setPreviewUrl(fileUrl);
                                  return;
                                }
                                if (/(mp4|webm|ogg)$/i.test(ext) || (a.type || '').includes('video')) {
                                  setPreviewKind('video');
                                  setPreviewUrl(fileUrl);
                                  return;
                                }
                                if (ext === 'pdf' || (a.type || '').includes('pdf')) {
                                  setPreviewKind('pdf');
                                  setPreviewUrl(fileUrl);
                                  return;
                                }
                                const office = new Set(['doc','docx','xls','xlsx','ppt','pptx']);
                                const google = new Set(['odt','ods','odp','rtf','txt','csv']);
                                const enc = encodeURIComponent(fileUrl);
                                if (office.has(ext)) {
                                  setPreviewKind('doc');
                                  setPreviewUrl(`https://view.officeapps.live.com/op/embed.aspx?src=${enc}`);
                                  return;
                                }
                                if (google.has(ext)) {
                                  setPreviewKind('doc');
                                  setPreviewUrl(`https://docs.google.com/gview?embedded=true&url=${enc}`);
                                  return;
                                }
                              } catch {}
                              setPreviewKind('other');
                              setPreviewUrl(fileUrl);
                            };
                            return (
                              <React.Fragment key={idx}>
                                <ListItem
                                  disablePadding
                                  secondaryAction={
                                    <Tooltip title="Xem nhanh">
                                      <IconButton
                                        edge="end"
                                        size="small"
                                        onClick={() => { setPreviewTitle(a.name || 'Xem tài liệu'); determinePreview(); setPreviewOpen(true); }}
                                        aria-label="Xem nhanh"
                                      >
                                        <OpenInNewIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  }
                                >
                                  <ListItemButton component="a" href={fileUrl} target="_blank" rel="noreferrer" sx={{ borderRadius: 1 }}>
                                    <ListItemIcon sx={{ minWidth: 32 }}>
                                      {getIcon()}
                                    </ListItemIcon>
                                    <ListItemText
                                      primary={a.name || (fileUrl || '')}
                                      secondary={secondary}
                                      primaryTypographyProps={{ variant: 'body2' }}
                                      secondaryTypographyProps={{ variant: 'caption' }}
                                    />
                                  </ListItemButton>
                                </ListItem>
                                {idx < l.attachments!.length - 1 && <Divider component="li" sx={{ my: 0.25 }} />}
                              </React.Fragment>
                            );
                          })}
                        </List>
                        
                      </Box>
                    )}
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <IconButton
                        size="small"
                        aria-label={expandedLessonId === l._id ? 'Ẩn thảo luận' : 'Thảo luận'}
                        title={expandedLessonId === l._id ? 'Ẩn thảo luận' : 'Thảo luận'}
                        color={expandedLessonId === l._id ? 'primary' : 'default'}
                        onClick={() => setExpandedLessonId(prev => prev === l._id ? null : l._id)}
                      >
                        <ChatBubbleOutlineIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                    {expandedLessonId === l._id && (
                      <Box sx={{ mt: 1 }}>
                        <ChatBox classroomId={classroomId} lessonId={l._id} />
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {lessons.length === 0 && <Typography variant="body2" color="text.secondary" sx={{ px: 2 }}>Chưa có bài giảng</Typography>}
          </Grid>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="h6" sx={{ mb: 1 }}>Bài tập</Typography>
          <Grid container spacing={2}>
            {assignments.map((a) => (
              <Grid item xs={12} key={a._id}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{a.title}</Typography>
                    {a.dueDate && <Typography variant="body2" color="text.secondary">Hạn nộp: {new Date(a.dueDate).toLocaleString()}</Typography>}
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Chip size="small" color={mySubmissions[a._id] ? 'success' : 'default'} label={mySubmissions[a._id] ? 'Đã nộp' : 'Chưa nộp'} />
                      {mySubmissions[a._id]?.graded && (
                        <Chip size="small" color="primary" label={`Điểm: ${mySubmissions[a._id].grade}`} />
                      )}
                      <Button size="small" variant={mySubmissions[a._id] ? 'contained' : 'outlined'} component={RouterLink} to={`/classes/${classroomId}/assignments/${a._id}/submit`}>
                        {mySubmissions[a._id] ? 'Xem/Nộp lại' : 'Nộp bài'}
                      </Button>
                    </Box>
                    {mySubmissions[a._id]?.feedback && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Nhận xét: {mySubmissions[a._id].feedback}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {assignments.length === 0 && <Typography variant="body2" color="text.secondary" sx={{ px: 2 }}>Chưa có bài tập</Typography>}
          </Grid>
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
          <Typography variant="body2" color="text.secondary">Không hỗ trợ xem nhanh định dạng này. Vui lòng mở trong tab mới.</Typography>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
};

export default StudentClassroomDetailPage;


