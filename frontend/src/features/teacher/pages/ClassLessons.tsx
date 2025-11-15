import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Grid,
  Card,
  CardContent,
  IconButton,
  Chip,
  Breadcrumbs,
  Link as MuiLink,
  Stack,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
  Paper,
  CircularProgress,
} from '@mui/material';
import ReactQuillWrapper from '../../../components/ReactQuillWrapper';
import { Link as RouterLink } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import MovieIcon from '@mui/icons-material/Movie';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import BookIcon from '@mui/icons-material/Book';
import LabelIcon from '@mui/icons-material/Label';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import { lessonsApi, LessonItem, LessonAttachment } from '../../../api/lessons';
import { uploadsApi } from '../../../api/uploads';
import { classesApi } from '../../../api/admin';
import { coursesApi, CourseItem } from '../../../api/courses';
import { useAuth } from '../../../contexts/AuthContext';
import { ChatBox } from '../../../components/ChatBox';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { resolveFileUrl } from '../../../utils/url';
import { ShimmerBox } from '../../../components/LoadingSkeleton';

export default function ClassLessons() {
  const { id } = useParams();
  const classroomId = id as string;
  const { user } = useAuth();

  const [items, setItems] = useState<LessonItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [contentHtml, setContentHtml] = useState('');
  const [attachments, setAttachments] = useState<LessonAttachment[]>([]);
  const [topic, setTopic] = useState('');
  const [week, setWeek] = useState<number | ''>('');
  const [tags, setTags] = useState<string>('');
  const [filterTag, setFilterTag] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<LessonItem | null>(null);
  const [classroomInfo, setClassroomInfo] = useState<any | null>(null);
  const [courseInfo, setCourseInfo] = useState<CourseItem | null>(null);
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [lessonToDelete, setLessonToDelete] = useState<LessonItem | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [previewKind, setPreviewKind] = useState<'image' | 'video' | 'pdf' | 'doc' | 'other'>(
    'other',
  );
  const [previewTitle, setPreviewTitle] = useState<string>('Xem tài liệu');

  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, 4, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ indent: '-1' }, { indent: '+1' }],
      [{ align: [] }],
      [{ color: [] }, { background: [] }],
      ['link', 'image', 'video'],
      ['clean'],
    ],
  } as const;

  const quillFormats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'blockquote',
    'code-block',
    'list',
    'bullet',
    'indent',
    'align',
    'color',
    'background',
    'link',
    'image',
    'video',
  ];

  const fetchLessons = async () => {
    if (!classroomId) return;
    try {
      setLoading(true);
      setError(null);
      const list = await lessonsApi.list(classroomId);
      setItems(list);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Không thể tải bài giảng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLessons();
    (async () => {
      try {
        if (classroomId) {
          const info = await classesApi.getById(classroomId);
          setClassroomInfo(info);
          const courseId = typeof info.courseId === 'object' ? info.courseId._id : info.courseId;
          if (courseId) {
            try {
              const c = await coursesApi.getById(courseId);
              setCourseInfo(c);
            } catch {}
          }
        }
      } catch {}
    })();
  }, [classroomId]);

  const onFiles = async (files: FileList | null) => {
    if (!files) return;
    setUploading(true);
    setError(null);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        try {
          const res = await uploadsApi.uploadFile(file);
          const type = (file.type || '').split('/')[0] || 'file';
          return { url: res.url, type, name: res.filename, size: res.size };
        } catch (e) {
          throw new Error(`Upload thất bại cho ${file.name}`);
        }
      });
      const uploadedFiles = await Promise.all(uploadPromises);
      setAttachments((prev) => [...prev, ...uploadedFiles]);
    } catch (e: any) {
      setError(e?.message || 'Upload thất bại');
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const createLesson = async () => {
    if (!classroomId || !title.trim()) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payloadTags = tags
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      await lessonsApi.create(classroomId, {
        title: title.trim(),
        contentHtml,
        attachments,
        topic: topic || undefined,
        week: week === '' ? undefined : Number(week),
        tags: payloadTags,
      });
      setOpen(false);
      setTitle('');
      setContentHtml('');
      setAttachments([]);
      setTopic('');
      setWeek('');
      setTags('');
      setSuccess('Đã tạo bài giảng');
      fetchLessons();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Không thể tạo bài giảng');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (lesson: LessonItem) => {
    setEditing(lesson);
    setTitle(lesson.title);
    setContentHtml(lesson.contentHtml || '');
    setAttachments(lesson.attachments || []);
    setTopic(lesson.topic || '');
    setWeek(lesson.week ?? '');
    setTags((lesson.tags || []).join(', '));
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!classroomId || !editing) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      // Delete removed files from server (best-effort)
      const original = editing.attachments || [];
      const current = attachments || [];
      const removed = original.filter((o) => !current.some((c) => c.url === o.url));
      if (removed.length > 0) {
        await Promise.all(
          removed.map(async (f) => {
            try {
              const url = new URL(f.url, window.location.origin);
              const parts = (url.pathname || '').split('/');
              const idx = parts.findIndex((p) => p === 'uploads');
              const stored = idx >= 0 ? parts[parts.length - 1] : '';
              if (stored) {
                await uploadsApi.deleteStoredFile(stored);
              }
            } catch {}
          }),
        );
      }
      const payloadTags = tags
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      await lessonsApi.update(classroomId, editing._id, {
        title,
        contentHtml,
        attachments,
        topic: topic || undefined,
        week: week === '' ? undefined : Number(week),
        tags: payloadTags,
      });
      setEditOpen(false);
      setEditing(null);
      setTitle('');
      setContentHtml('');
      setAttachments([]);
      setTopic('');
      setWeek('');
      setTags('');
      setSuccess('Đã cập nhật bài giảng');
      fetchLessons();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Không thể cập nhật');
    } finally {
      setSaving(false);
    }
  };

  const removeLesson = async (lesson: LessonItem) => {
    if (!classroomId) return;
    try {
      await lessonsApi.remove(classroomId, lesson._id);
      setSuccess('Đã xóa bài giảng');
      fetchLessons();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Không thể xóa bài giảng');
    }
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Box>
          {classroomInfo && (
            <Breadcrumbs sx={{ mb: 0.5 }}>
              <MuiLink
                component={RouterLink}
                to="/teacher/classrooms"
                underline="hover"
                color="inherit"
              >
                Lớp của tôi
              </MuiLink>
              {courseInfo && (
                <MuiLink
                  component={RouterLink}
                  to={`/courses/${courseInfo._id}`}
                  underline="hover"
                  color="inherit"
                >
                  {courseInfo.title}
                </MuiLink>
              )}
              <Typography color="text.secondary">{classroomInfo.title || 'Lớp'}</Typography>
              <Typography color="text.primary">Bài giảng</Typography>
            </Breadcrumbs>
          )}
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            Bài giảng
          </Typography>
          {classroomInfo && (
            <Box display="flex" alignItems="center" gap={1} sx={{ mt: 0.5 }}>
              {courseInfo && (
                <Chip
                  size="small"
                  label={`Khóa học: ${courseInfo.title} (${courseInfo.category || 'Khác'} - ${courseInfo.level || 'N/A'})`}
                />
              )}
              {classroomInfo.schedule?.startDate && (
                <Chip
                  size="small"
                  label={`Bắt đầu: ${new Date(classroomInfo.schedule.startDate).toLocaleDateString()}`}
                />
              )}
            </Box>
          )}
        </Box>
        {(user?.role === 'teacher' || user?.role === 'admin') && (
          <Button variant="contained" onClick={() => setOpen(true)}>
            Tạo bài giảng
          </Button>
        )}
      </Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Box display="flex" gap={2} sx={{ mb: 2 }}>
        <TextField
          label="Lọc theo nhãn"
          size="small"
          value={filterTag}
          onChange={(e) => setFilterTag(e.target.value)}
          sx={{ minWidth: 250 }}
        />
      </Box>

      {loading ? (
        <Grid container spacing={2}>
          {Array.from({ length: 3 }).map((_, idx) => (
            <Grid item xs={12} key={idx}>
              <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
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
          {items
            .filter(
              (it) =>
                !filterTag ||
                (it.tags || []).some((t) => t.toLowerCase().includes(filterTag.toLowerCase())),
            )
            .map((it) => (
              <Grid item xs={12} key={it._id}>
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
                      background: 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
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
                          {it.title}
                        </Typography>
                      </Box>
                      <Box display="flex" gap={0.5} ml={1}>
                        {(user?.role === 'teacher' || user?.role === 'admin') && (
                          <>
                            <Tooltip title="Chỉnh sửa">
                              <IconButton
                                size="small"
                                sx={{
                                  color: 'white',
                                  bgcolor: 'rgba(255,255,255,0.25)',
                                  '&:hover': { bgcolor: 'rgba(255,255,255,0.4)' },
                                }}
                                onClick={() => startEdit(it)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Xóa">
                              <IconButton
                                size="small"
                                sx={{
                                  color: 'white',
                                  bgcolor: 'rgba(255,255,255,0.25)',
                                  '&:hover': { bgcolor: 'rgba(255,255,255,0.4)' },
                                }}
                                onClick={() => {
                                  setLessonToDelete(it);
                                  setConfirmOpen(true);
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        <Tooltip title={expandedLessonId === it._id ? 'Ẩn thảo luận' : 'Thảo luận'}>
                          <IconButton
                            size="small"
                            sx={{
                              color: 'white',
                              bgcolor: 'rgba(255,255,255,0.25)',
                              '&:hover': { bgcolor: 'rgba(255,255,255,0.4)' },
                            }}
                            onClick={() =>
                              setExpandedLessonId((prev) => (prev === it._id ? null : it._id))
                            }
                          >
                            <ChatBubbleOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>

                    {/* Tags, Topic, Week chips */}
                    <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
                      {it.topic && (
                        <Chip
                          icon={<LabelIcon sx={{ color: 'white !important' }} />}
                          label={it.topic}
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
                      {it.week !== undefined && (
                        <Chip
                          icon={<CalendarTodayIcon sx={{ color: 'white !important' }} />}
                          label={`Tuần ${it.week}`}
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
                      {it.tags &&
                        it.tags.length > 0 &&
                        it.tags.map((tag, idx) => (
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
                    {/* Content HTML */}
                    {it.contentHtml && (
                      <Box
                        sx={{
                          mb: 2,
                          '& img': {
                            maxWidth: '100%',
                            height: 'auto',
                            borderRadius: 1,
                          },
                          '& pre': {
                            backgroundColor: 'action.hover',
                            p: 1,
                            borderRadius: 1,
                            overflow: 'auto',
                          },
                        }}
                        dangerouslySetInnerHTML={{ __html: it.contentHtml }}
                      />
                    )}

                    {/* Attachments */}
                    {it.attachments && it.attachments.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mb: 1, display: 'block', fontWeight: 600 }}
                        >
                          Tài liệu đính kèm ({it.attachments.length}):
                        </Typography>
                        <Stack spacing={0.5}>
                          {it.attachments.map((a, idx) => {
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
                              if (size < 1024 * 1024) return `${Math.round(size / 102.4) / 10} KB`;
                              return `${Math.round(size / 104857.6) / 10} MB`;
                            };
                            const fileUrl = resolveFileUrl(a.url) || a.url;
                            return (
                              <Paper
                                key={idx}
                                variant="outlined"
                                sx={{
                                  p: 1,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                  transition: 'all 0.2s',
                                  '&:hover': {
                                    bgcolor: 'action.hover',
                                    borderColor: 'primary.main',
                                  },
                                }}
                              >
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  {getIcon()}
                                </Box>
                                <Typography
                                  variant="body2"
                                  component="a"
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  sx={{
                                    flex: 1,
                                    textDecoration: 'none',
                                    color: 'primary.main',
                                    fontWeight: 500,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    '&:hover': {
                                      textDecoration: 'underline',
                                    },
                                  }}
                                >
                                  {a.name || fileUrl}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                                  {formatSize(a.size)}
                                </Typography>
                                <Tooltip title="Xem nhanh">
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      try {
                                        const u = new URL(fileUrl);
                                        const pathname = u.pathname || '';
                                        const ext = pathname.split('.').pop()?.toLowerCase() || '';
                                        if (
                                          /(png|jpe?g|gif|webp|svg)$/.test(ext) ||
                                          (a.type || '').includes('image')
                                        ) {
                                          setPreviewKind('image');
                                          setPreviewUrl(fileUrl);
                                        } else if (
                                          /(mp4|webm|ogg)$/.test(ext) ||
                                          (a.type || '').includes('video')
                                        ) {
                                          setPreviewKind('video');
                                          setPreviewUrl(fileUrl);
                                        } else if (
                                          ext === 'pdf' ||
                                          (a.type || '').includes('pdf')
                                        ) {
                                          setPreviewKind('pdf');
                                          setPreviewUrl(fileUrl);
                                        } else {
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
                                          } else if (google.has(ext)) {
                                            setPreviewKind('doc');
                                            setPreviewUrl(
                                              `https://docs.google.com/gview?embedded=true&url=${enc}`,
                                            );
                                          } else {
                                            setPreviewKind('other');
                                            setPreviewUrl(fileUrl);
                                          }
                                        }
                                      } catch {
                                        setPreviewKind('other');
                                        setPreviewUrl(fileUrl);
                                      }
                                      setPreviewTitle(a.name || 'Xem tài liệu');
                                      setPreviewOpen(true);
                                    }}
                                    sx={{ p: 0.5 }}
                                  >
                                    <OpenInNewIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <IconButton
                                  size="small"
                                  component="a"
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  sx={{ p: 0.5 }}
                                >
                                  <DownloadIcon fontSize="small" />
                                </IconButton>
                              </Paper>
                            );
                          })}
                        </Stack>
                      </Box>
                    )}

                    {/* Chat Box */}
                    {expandedLessonId === it._id && (
                      <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                        <ChatBox classroomId={classroomId} lessonId={it._id} />
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
        </Grid>
      )}

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="lg"
        sx={{
          '& .MuiDialog-paper': {
            overflow: 'visible',
          },
        }}
      >
        <DialogTitle>Tạo bài giảng</DialogTitle>
        <DialogContent>
          <TextField
            label="Tiêu đề"
            fullWidth
            sx={{ mt: 1, mb: 2 }}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Nội dung
            </Typography>
            <Box
              sx={{
                '& .ql-toolbar': {
                  zIndex: 2,
                  position: 'relative',
                },
                '& .ql-container': {
                  zIndex: 2,
                  position: 'relative',
                },
                '& .ql-editor': {
                  minHeight: '120px',
                },
                '& .ql-snow .ql-picker': {
                  zIndex: 1300,
                },
                '& .ql-snow .ql-picker-options': {
                  zIndex: 1300,
                },
              }}
            >
              <ReactQuillWrapper
                theme="snow"
                value={contentHtml}
                onChange={setContentHtml as any}
                modules={quillModules}
                formats={quillFormats}
              />
            </Box>
          </Box>
          <Box display="flex" gap={2} sx={{ mt: 2 }}>
            <TextField
              label="Chủ đề"
              fullWidth
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
            <TextField
              label="Tuần"
              type="number"
              fullWidth
              value={week}
              onChange={(e) => setWeek(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </Box>
          <TextField
            label="Nhãn (phân cách bằng dấu phẩy)"
            fullWidth
            sx={{ mt: 2 }}
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />

          {/* File Upload Section */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
              Tài liệu đính kèm
            </Typography>

            {/* Upload Area */}
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                textAlign: 'center',
                border: '2px dashed',
                borderColor: 'divider',
                bgcolor: 'action.hover',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'action.selected',
                },
              }}
              onClick={() => document.getElementById('file-upload-input')?.click()}
            >
              <input
                id="file-upload-input"
                type="file"
                hidden
                multiple
                onChange={(e) => onFiles(e.target.files)}
                disabled={uploading}
              />
              {uploading ? (
                <Box>
                  <CircularProgress size={40} sx={{ mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Đang tải lên...
                  </Typography>
                </Box>
              ) : (
                <Box>
                  <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography variant="body1" sx={{ mb: 0.5, fontWeight: 500 }}>
                    Chọn tệp để tải lên
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Hoặc kéo thả tệp vào đây
                  </Typography>
                </Box>
              )}
            </Paper>

            {/* Attachments List */}
            {attachments.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Đã tải lên ({attachments.length} tệp):
                </Typography>
                <List dense>
                  {attachments.map((attachment, index) => (
                    <React.Fragment key={index}>
                      <ListItem
                        sx={{
                          bgcolor: 'background.paper',
                          borderRadius: 1,
                          mb: 0.5,
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                        secondaryAction={
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={() => removeAttachment(index)}
                            color="error"
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        }
                      >
                        <ListItemIcon>
                          <AttachFileIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {attachment.name || 'Tệp đính kèm'}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="caption" color="text.secondary">
                              {attachment.type}{' '}
                              {attachment.size ? `· ${(attachment.size / 1024).toFixed(1)} KB` : ''}
                            </Typography>
                          }
                        />
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button onClick={() => setOpen(false)} disabled={saving || uploading}>
            Hủy
          </Button>
          <Button
            variant="contained"
            disabled={saving || !title.trim() || uploading}
            onClick={createLesson}
            sx={{
              background: 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #D94A4A 0%, #EF5B5B 100%)',
              },
            }}
          >
            {saving ? 'Đang lưu...' : 'Tạo bài giảng'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} fullWidth maxWidth="lg">
        <DialogTitle>{previewTitle}</DialogTitle>
        <DialogContent>
          {previewKind === 'image' && (
            <Box sx={{ width: '100%', maxHeight: '70vh' }}>
              <img
                src={previewUrl}
                alt={previewTitle}
                style={{ maxWidth: '100%', borderRadius: 8 }}
              />
            </Box>
          )}
          {previewKind === 'video' && (
            <Box sx={{ width: '100%' }}>
              <video
                src={previewUrl}
                controls
                preload="metadata"
                style={{ width: '100%', borderRadius: 8 }}
              />
            </Box>
          )}
          {previewKind === 'pdf' && (
            <Paper variant="outlined" sx={{ p: 1, borderRadius: 2 }}>
              <iframe
                src={previewUrl}
                title="preview"
                loading="lazy"
                style={{ width: '100%', height: 500, border: 0 }}
              />
            </Paper>
          )}
          {previewKind === 'doc' && (
            <Paper variant="outlined" sx={{ p: 1, borderRadius: 2 }}>
              <iframe
                src={previewUrl}
                title="preview"
                loading="lazy"
                style={{ width: '100%', height: 500, border: 0 }}
              />
            </Paper>
          )}
          {previewKind === 'other' && (
            <Typography variant="body2" color="text.secondary">
              Không hỗ trợ xem nhanh định dạng này. Vui lòng mở trong tab mới.
            </Typography>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        fullWidth
        maxWidth="lg"
        sx={{
          '& .MuiDialog-paper': {
            overflow: 'visible',
          },
        }}
      >
        <DialogTitle>Sửa bài giảng</DialogTitle>
        <DialogContent>
          <TextField
            label="Tiêu đề"
            fullWidth
            sx={{ mt: 1, mb: 2 }}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Nội dung
            </Typography>
            <Box
              sx={{
                '& .ql-toolbar': {
                  zIndex: 2,
                  position: 'relative',
                },
                '& .ql-container': {
                  zIndex: 2,
                  position: 'relative',
                },
                '& .ql-editor': {
                  minHeight: '120px',
                },
                '& .ql-snow .ql-picker': {
                  zIndex: 1300,
                },
                '& .ql-snow .ql-picker-options': {
                  zIndex: 1300,
                },
              }}
            >
              <ReactQuillWrapper
                theme="snow"
                value={contentHtml}
                onChange={setContentHtml as any}
                modules={quillModules}
                formats={quillFormats}
              />
            </Box>
          </Box>
          <Box display="flex" gap={2} sx={{ mt: 2 }}>
            <TextField
              label="Chủ đề"
              fullWidth
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
            <TextField
              label="Tuần"
              type="number"
              fullWidth
              value={week}
              onChange={(e) => setWeek(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </Box>
          <TextField
            label="Nhãn (phân cách bằng dấu phẩy)"
            fullWidth
            sx={{ mt: 2 }}
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />

          {/* File Upload Section */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
              Tài liệu đính kèm
            </Typography>

            {/* Upload Area */}
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                textAlign: 'center',
                border: '2px dashed',
                borderColor: 'divider',
                bgcolor: 'action.hover',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'action.selected',
                },
              }}
              onClick={() => document.getElementById('file-upload-input-edit')?.click()}
            >
              <input
                id="file-upload-input-edit"
                type="file"
                hidden
                multiple
                onChange={(e) => onFiles(e.target.files)}
                disabled={uploading}
              />
              {uploading ? (
                <Box>
                  <CircularProgress size={40} sx={{ mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Đang tải lên...
                  </Typography>
                </Box>
              ) : (
                <Box>
                  <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography variant="body1" sx={{ mb: 0.5, fontWeight: 500 }}>
                    Thêm tệp đính kèm
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Hoặc kéo thả tệp vào đây
                  </Typography>
                </Box>
              )}
            </Paper>

            {/* Attachments List */}
            {attachments.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Đã tải lên ({attachments.length} tệp):
                </Typography>
                <List dense>
                  {attachments.map((attachment, index) => (
                    <React.Fragment key={index}>
                      <ListItem
                        sx={{
                          bgcolor: 'background.paper',
                          borderRadius: 1,
                          mb: 0.5,
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                        secondaryAction={
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={() => removeAttachment(index)}
                            color="error"
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        }
                      >
                        <ListItemIcon>
                          <AttachFileIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {attachment.name || 'Tệp đính kèm'}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="caption" color="text.secondary">
                              {attachment.type}{' '}
                              {attachment.size ? `· ${(attachment.size / 1024).toFixed(1)} KB` : ''}
                            </Typography>
                          }
                        />
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button onClick={() => setEditOpen(false)} disabled={saving || uploading}>
            Hủy
          </Button>
          <Button
            variant="contained"
            disabled={saving || !title.trim() || uploading}
            onClick={saveEdit}
            sx={{
              background: 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #D94A4A 0%, #EF5B5B 100%)',
              },
            }}
          >
            {saving ? 'Đang lưu...' : 'Cập nhật'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setLessonToDelete(null);
        }}
      >
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc muốn xóa bài giảng{lessonToDelete ? ` "${lessonToDelete.title}"` : ''}? Hành
            động này không thể hoàn tác.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setConfirmOpen(false);
              setLessonToDelete(null);
            }}
          >
            Hủy
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={async () => {
              if (lessonToDelete) {
                await removeLesson(lessonToDelete);
              }
              setConfirmOpen(false);
              setLessonToDelete(null);
            }}
          >
            Xóa
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
