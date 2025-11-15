import React, { useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { Box, Container, Typography, Breadcrumbs, Link as MuiLink, Paper, Alert, Chip, Stack, List, ListItem, ListItemIcon, ListItemText, Divider, IconButton, CircularProgress, Button, Skeleton } from '@mui/material';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import MovieIcon from '@mui/icons-material/Movie';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { coursesApi } from '../api/courses';
import { progressApi } from '../api/progress';
import { useAuth } from '../contexts/AuthContext';

export default function LessonDetailPage() {
  const { id, lessonId } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  interface LessonContent {
    videoUrl?: string;
    htmlContent?: string;
    [key: string]: unknown;
  }
  interface Lesson {
    _id: string;
    title: string;
    description?: string;
    type?: string;
    content?: LessonContent;
    contentHtml?: string;
    attachments?: Array<{ url?: string; name?: string; type?: string; [key: string]: unknown }>;
    estimatedDuration?: number;
    [key: string]: unknown;
  }
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [moduleTitle, setModuleTitle] = useState<string>('');
  const [courseTitle, setCourseTitle] = useState<string>('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [markingComplete, setMarkingComplete] = useState(false);
  const [completionMessage, setCompletionMessage] = useState<string | null>(null);
  const [completionError, setCompletionError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        if (!id || !lessonId) return;
        const modules = await coursesApi.getModules(id);
        interface Lesson {
          _id: string;
          title: string;
          [key: string]: unknown;
        }
        let found: Lesson | null = null;
        let modTitle = '';
        for (const m of modules) {
          try {
            const lessons = await coursesApi.getLessons(m._id);
            const l = (lessons || []).find((x: { _id?: string; [key: string]: unknown }) => String(x._id) === String(lessonId));
            if (l) {
              found = l;
              modTitle = m.title;
              break;
            }
          } catch {}
        }
        if (!found) {
          setError('Không tìm thấy bài học');
        } else {
          setLesson(found);
          setModuleTitle(modTitle);
          try {
            const course = await coursesApi.getById(id);
            setCourseTitle(course.title);
          } catch {}
        }
      } catch (e: unknown) {
        const err = e as { response?: { data?: { message?: string } } };
        setError(err?.response?.data?.message || 'Không thể tải bài học');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, lessonId]);

  useEffect(() => {
    const checkLessonCompletion = async () => {
      if (!lessonId || !user || user.role !== 'student') {
        setIsCompleted(false);
        return;
      }
      try {
        const progressList = await progressApi.getStudentProgress();
        const alreadyCompleted = progressList.some(entry => {
          const completedLessons = entry?.progress?.completedLessons || [];
          return completedLessons.some((completedId: string | { _id?: string; id?: string; toString?: () => string } | unknown) => {
            const id = typeof completedId === 'string' 
              ? completedId 
              : typeof completedId === 'object' && completedId !== null
                ? (completedId as { _id?: string; id?: string; toString?: () => string })._id || (completedId as { _id?: string; id?: string; toString?: () => string }).id || (typeof (completedId as { toString?: () => string }).toString === 'function' ? (completedId as { toString: () => string }).toString() : String(completedId))
                : String(completedId);
            return String(id) === String(lessonId);
          });
        });
        setIsCompleted(alreadyCompleted);
      } catch (err) {
        console.error('Không thể tải tiến độ bài học', err);
      }
    };

    checkLessonCompletion();
  }, [lessonId, user]);

  const handleMarkLessonCompleted = async () => {
    if (!lessonId) return;
    setCompletionError(null);
    setCompletionMessage(null);
    setMarkingComplete(true);
    try {
      await progressApi.completeLesson(lessonId);
      setIsCompleted(true);
      setCompletionMessage('Đã đánh dấu hoàn thành bài học này.');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setCompletionError(error?.response?.data?.message || 'Không thể cập nhật tiến độ. Vui lòng thử lại.');
    } finally {
      setMarkingComplete(false);
    }
  };

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
    const videoRef = React.useRef<HTMLVideoElement | null>(null);
    const enterFullscreen = () => {
      const el = videoRef.current as HTMLVideoElement & { requestFullscreen?: () => Promise<void>; webkitRequestFullscreen?: () => Promise<void>; mozRequestFullScreen?: () => Promise<void>; msRequestFullscreen?: () => Promise<void> };
      if (!el) return;
      if (el.requestFullscreen) el.requestFullscreen();
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
      else if (el.msRequestFullscreen) el.msRequestFullscreen();
    };
    return (
      <Box sx={{ position: 'relative', width: '100%', borderRadius: 2 }}>
        {!ready && <Skeleton variant="rounded" width="100%" height={180} />}
        <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 2, display: ready ? 'block' : 'none' }}>
          <IconButton size="small" aria-label="Toàn màn hình" title="Toàn màn hình" onClick={enterFullscreen}>
            <FullscreenIcon fontSize="small" />
          </IconButton>
        </Box>
        <video
          ref={videoRef}
          src={src}
          controls
          preload="metadata"
          onLoadedMetadata={() => setReady(true)}
          style={{ width: '100%', borderRadius: 8, border: '1px solid rgba(0,0,0,0.08)', display: ready ? 'block' : 'none' }}
        />
      </Box>
    );
  };

  const LazyIframe: React.FC<{ src: string; height?: number }> = ({ src, height = 500 }) => {
    const [ready, setReady] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const toggleExpand = () => setExpanded(v => !v);
    const openNew = () => window.open(src, '_blank', 'noopener,noreferrer');
    const h = expanded ? Math.max(window.innerHeight * 0.8, height) : height;
    return (
      <Box sx={{ position: 'relative', width: '100%' }}>
        {!ready && <Skeleton variant="rounded" width="100%" height={h} />} 
        <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 2, display: ready ? 'flex' : 'none', gap: 1 }}>
          <IconButton size="small" aria-label="Mở tab mới" title="Mở tab mới" onClick={openNew}>
            <OpenInNewIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" aria-label={expanded ? 'Thu nhỏ' : 'Mở rộng'} title={expanded ? 'Thu nhỏ' : 'Mở rộng'} onClick={toggleExpand}>
            {expanded ? <FullscreenExitIcon fontSize="small" /> : <FullscreenIcon fontSize="small" />}
          </IconButton>
        </Box>
        <iframe
          src={src}
          title="preview"
          loading="lazy"
          onLoad={() => setReady(true)}
          style={{ width: '100%', height: h, border: 0, display: ready ? 'block' : 'none' }}
        />
      </Box>
    );
  };

  interface Attachment {
    name?: string;
    url?: string;
    type?: string;
    [key: string]: unknown;
  }
  const getIcon = (a: Attachment) => {
    const name = (a.name || a.url || '').toLowerCase();
    const type = (a.type || '').toLowerCase();
    if (name.endsWith('.pdf') || type.includes('pdf')) return <PictureAsPdfIcon fontSize="small" color="error" />;
    if (type.includes('image')) return <ImageIcon fontSize="small" color="primary" />;
    if (type.includes('video')) return <MovieIcon fontSize="small" color="action" />;
    return <InsertDriveFileIcon fontSize="small" color="action" />;
  };

  const getTypeLabel = (t?: string) => {
    switch ((t || '').toLowerCase()) {
      case 'document': return 'Tài liệu';
      case 'video': return 'Video';
      case 'interactive': return 'Tương tác';
      case 'quiz': return 'Trắc nghiệm';
      case 'assignment': return 'Bài tập';
      case 'discussion': return 'Thảo luận';
      default: return 'Bài học';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 3, mb: 4 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <MuiLink component={RouterLink} to={"/courses/" + id} underline="hover" color="inherit">
          {courseTitle || 'Môn học'}
        </MuiLink>
        <Typography color="text.primary">Bài học</Typography>
      </Breadcrumbs>

      <Button component={RouterLink} to={"/courses/" + id} startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>Quay lại môn học</Button>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <CircularProgress size={20} />
          <Typography>Đang tải bài học...</Typography>
        </Box>
      )}

      {lesson && (
        <Paper elevation={2} sx={{ p: 0, borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ p: 3, background: 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)', color: 'white' }}>
            <Typography variant="h5" fontWeight={800} sx={{ color: 'white' }}>{lesson.title}</Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Chip label={getTypeLabel(lesson.type || '')} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
              {moduleTitle && <Chip label={`Chương: ${moduleTitle}`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />}
              {typeof lesson.estimatedDuration === 'number' && (
                <Chip label={`${lesson.estimatedDuration} phút`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
              )}
            </Stack>
          </Box>

          <Box sx={{ p: 3 }}>
            {/* Mô tả/ nội dung HTML */}
            {lesson.description && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>Mô tả</Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>{lesson.description}</Typography>
              </Box>
            )}

            {/* Video (URL) */}
            {lesson.content?.videoUrl && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>Video</Typography>
                <Box sx={{ position: 'relative', pt: '56.25%', borderRadius: 2, overflow: 'hidden' }}>
                  <iframe
                    src={lesson.content.videoUrl as string}
                    title="Video bài học"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                  />
                </Box>
              </Box>
            )}

            {(lesson.content?.htmlContent || lesson.contentHtml) && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>Nội dung</Typography>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    '& img': {
                      maxWidth: '100%',
                      height: 'auto',
                      display: 'block',
                      borderRadius: 1,
                      my: 1,
                    },
                    '& iframe': {
                      width: '100% !important',
                      height: 'auto',
                      minHeight: 300,
                      border: 0,
                      borderRadius: 1,
                    },
                    '& video': {
                      width: '100%',
                      borderRadius: 1,
                      outline: 'none',
                    },
                    '& table': {
                      width: '100%',
                      borderCollapse: 'collapse',
                      my: 1,
                    },
                    '& table, & th, & td': {
                      border: '1px solid rgba(0,0,0,0.12)',
                      padding: '6px 8px',
                    },
                    '& pre, & code': {
                      backgroundColor: 'rgba(0,0,0,0.04)',
                      borderRadius: 1,
                      px: 0.5,
                      py: 0.25,
                    },
                    '& blockquote': {
                      borderLeft: '4px solid rgba(0,0,0,0.12)',
                      pl: 2,
                      ml: 0,
                      color: 'text.secondary',
                    },
                  }}
                >
                  <div style={{ lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: (lesson.content?.htmlContent || lesson.contentHtml || '') as string }} />
                </Paper>
              </Box>
            )}

            {lesson.attachments && lesson.attachments.length > 0 && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>Tài liệu đính kèm ({lesson.attachments.length}):</Typography>
                <List dense disablePadding>
                  {lesson.attachments.map((a, idx: number) => {
                    const attachment = a as { url?: string; name?: string; type?: string; [key: string]: unknown };
                    const url = attachment.url || '';
                    return (
                      <React.Fragment key={idx}>
                        <ListItem disablePadding>
                          <ListItemIcon sx={{ minWidth: 32 }}>{getIcon(attachment)}</ListItemIcon>
                          <ListItemText
                            primaryTypographyProps={{ variant: 'body2' }}
                            primary={<MuiLink href={url} target="_blank" rel="noreferrer">{attachment.name || url}</MuiLink>}
                          />
                        </ListItem>
                        {idx < (lesson.attachments?.length || 0) - 1 && <Divider component="li" sx={{ my: 0.25 }} />}
                      </React.Fragment>
                    );
                  })}
                </List>

                {/* Preview block */}
                <Box sx={{ mt: 1 }}>
                  <Stack direction="row" spacing={2} flexWrap="wrap">
                    {lesson.attachments.map((a, idx: number) => {
                      const attachment = a as { url?: string; name?: string; type?: string; [key: string]: unknown };
                      const url: string = attachment.url || '';
                      const lower = url.toLowerCase();
                      const type = (attachment.type || '').toLowerCase();
                      const isImg = /\.(png|jpe?g|gif|webp|svg)$/.test(lower) || type.includes('image');
                      const isMp4 = /\.(mp4|webm|ogg)$/.test(lower) || type.includes('video');
                      const isPdf = lower.endsWith('.pdf') || type.includes('pdf');
                      if (isImg) {
                        return (
                          <Box key={`img-${idx}`} sx={{ width: 220 }}>
                            <LazyImage src={url} alt={(attachment.name || 'attachment') as string} />
                          </Box>
                        );
                      }
                      if (isMp4) {
                        return (
                          <Box key={`vid-${idx}`} sx={{ width: 320 }}>
                            <LazyVideo src={url} />
                          </Box>
                        );
                      }
                      if (isPdf) {
                        return (
                          <Box key={`pdf-${idx}`} sx={{ width: '100%' }}>
                            <Paper variant="outlined" sx={{ p: 1, borderRadius: 2 }}>
                              <LazyIframe src={url} />
                            </Paper>
                          </Box>
                        );
                      }
                      return null;
                    })}
                  </Stack>
                </Box>
              </Box>
            )}
            {user?.role === 'student' && (
              <Box sx={{ mt: 3 }}>
                {completionMessage && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    {completionMessage}
                  </Alert>
                )}
                {completionError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {completionError}
                  </Alert>
                )}
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircleIcon />}
                  disabled={isCompleted || markingComplete}
                  onClick={handleMarkLessonCompleted}
                  sx={{ color: 'white' }}
                >
                  {isCompleted ? 'Đã hoàn thành' : markingComplete ? 'Đang cập nhật...' : 'Đánh dấu đã hoàn thành'}
                </Button>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  Tiến độ môn học sẽ được cập nhật sau khi bạn đánh dấu hoàn thành.
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>
      )}
    </Container>
  );
}


