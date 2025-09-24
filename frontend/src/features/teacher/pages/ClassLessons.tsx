import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, Grid, Card, CardContent, IconButton, Chip, Breadcrumbs, Link as MuiLink, Stack, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider, Tooltip } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import MovieIcon from '@mui/icons-material/Movie';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { lessonsApi, LessonItem, LessonAttachment } from '../../../api/lessons';
import { uploadsApi } from '../../../api/uploads';
import { classesApi } from '../../../api/admin';
import { coursesApi, CourseItem } from '../../../api/courses';
import { useAuth } from '../../../contexts/AuthContext';
import { ChatBox } from '../../../components/ChatBox';

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
  const [success, setSuccess] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<LessonItem | null>(null);
  const [classroomInfo, setClassroomInfo] = useState<any | null>(null);
  const [courseInfo, setCourseInfo] = useState<CourseItem | null>(null);
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null);

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
    for (const file of Array.from(files)) {
      try {
        const res = await uploadsApi.uploadFile(file);
        const type = (file.type || '').split('/')[0] || 'file';
        setAttachments(prev => [...prev, { url: res.url, type, name: res.filename, size: res.size }]);
      } catch (e) {
        setError('Upload thất bại cho ' + file.name);
      }
    }
  };

  const createLesson = async () => {
    if (!classroomId || !title.trim()) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payloadTags = tags.split(',').map(s => s.trim()).filter(Boolean);
      await lessonsApi.create(classroomId, { title: title.trim(), contentHtml, attachments, topic: topic || undefined, week: week === '' ? undefined : Number(week), tags: payloadTags });
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
      const removed = original.filter(o => !current.some(c => c.url === o.url));
      if (removed.length > 0) {
        await Promise.all(removed.map(async (f) => {
          try {
            const url = new URL(f.url, window.location.origin);
            const parts = (url.pathname || '').split('/');
            const idx = parts.findIndex(p => p === 'uploads');
            const stored = idx >= 0 ? parts[parts.length - 1] : '';
            if (stored) {
              await uploadsApi.deleteStoredFile(stored);
            }
          } catch {}
        }));
      }
      const payloadTags = tags.split(',').map(s => s.trim()).filter(Boolean);
      await lessonsApi.update(classroomId, editing._id, { title, contentHtml, attachments, topic: topic || undefined, week: week === '' ? undefined : Number(week), tags: payloadTags });
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
              <MuiLink component={RouterLink} to="/teacher/classrooms" underline="hover" color="inherit">
                Lớp của tôi
              </MuiLink>
              {courseInfo && (
                <MuiLink component={RouterLink} to={`/courses/${courseInfo._id}`} underline="hover" color="inherit">
                  {courseInfo.title}
                </MuiLink>
              )}
              <Typography color="text.secondary">{classroomInfo.title || 'Lớp'}</Typography>
              <Typography color="text.primary">Bài giảng</Typography>
            </Breadcrumbs>
          )}
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Bài giảng</Typography>
          {classroomInfo && (
            <Box display="flex" alignItems="center" gap={1} sx={{ mt: 0.5 }}>
              {courseInfo && (
                <Chip size="small" label={`Khóa học: ${courseInfo.title} (${courseInfo.category || 'Khác'} - ${courseInfo.level || 'N/A'})`} />
              )}
              {classroomInfo.schedule?.startDate && (
                <Chip size="small" label={`Bắt đầu: ${new Date(classroomInfo.schedule.startDate).toLocaleDateString()}`} />
              )}
            </Box>
          )}
        </Box>
        {(user?.role === 'teacher' || user?.role === 'admin') && (
          <Button variant="contained" onClick={() => setOpen(true)}>Tạo bài giảng</Button>
        )}
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

      <Box display="flex" gap={2} sx={{ mb: 2 }}>
        <TextField label="Lọc theo nhãn" size="small" value={filterTag} onChange={(e) => setFilterTag(e.target.value)} />
      </Box>

      <Grid container spacing={2}>
        {items.filter(it => !filterTag || (it.tags || []).some(t => t.toLowerCase().includes(filterTag.toLowerCase()))).map(it => (
          <Grid item xs={12} md={12} key={it._id}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1 }}>{it.title}</Typography>
                {(it.topic || it.week !== undefined || (it.tags && it.tags.length > 0)) && (
                  <Box sx={{ mb: 1 }}>
                    {it.topic && <Typography variant="body2">Chủ đề: {it.topic}</Typography>}
                    {it.week !== undefined && <Typography variant="body2">Tuần: {it.week}</Typography>}
                    {it.tags && it.tags.length > 0 && <Typography variant="body2">Nhãn: {it.tags.join(', ')}</Typography>}
                  </Box>
                )}
                <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                  {(user?.role === 'teacher' || user?.role === 'admin') && (
                    <>
                      <IconButton
                        size="small"
                        aria-label="Sửa bài giảng"
                        title="Sửa bài giảng"
                        onClick={() => startEdit(it)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        aria-label="Xóa bài giảng"
                        title="Xóa bài giảng"
                        onClick={() => removeLesson(it)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </>
                  )}
                  <IconButton
                    size="small"
                    aria-label={expandedLessonId === it._id ? 'Ẩn thảo luận' : 'Thảo luận'}
                    title={expandedLessonId === it._id ? 'Ẩn thảo luận' : 'Thảo luận'}
                    color={expandedLessonId === it._id ? 'primary' : 'default'}
                    onClick={() => setExpandedLessonId(prev => prev === it._id ? null : it._id)}
                  >
                    <ChatBubbleOutlineIcon fontSize="small" />
                  </IconButton>
                </Stack>
                {expandedLessonId === it._id && (
                  <Box sx={{ mt: 1 }}>
                    <ChatBox classroomId={classroomId} lessonId={it._id} />
                  </Box>
                )}
                {it.attachments && it.attachments.length > 0 && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Tài liệu đính kèm ({it.attachments.length}):</Typography>
                    <List dense disablePadding>
                      {it.attachments.map((a, idx) => {
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
                        return (
                          <React.Fragment key={idx}>
                            <ListItem disablePadding>
                              <ListItemButton component="a" href={a.url} target="_blank" rel="noreferrer" sx={{ borderRadius: 1 }}>
                                <ListItemIcon sx={{ minWidth: 32 }}>
                                  {getIcon()}
                                </ListItemIcon>
                                <ListItemText
                                  primary={a.name || a.url}
                                  secondary={secondary}
                                  primaryTypographyProps={{ variant: 'body2' }}
                                  secondaryTypographyProps={{ variant: 'caption' }}
                                />
                              </ListItemButton>
                            </ListItem>
                            {idx < it.attachments!.length - 1 && <Divider component="li" sx={{ my: 0.25 }} />}
                          </React.Fragment>
                        );
                      })}
                    </List>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Tạo bài giảng</DialogTitle>
        <DialogContent>
          <TextField label="Tiêu đề" fullWidth sx={{ mt: 1, mb: 2 }} value={title} onChange={(e) => setTitle(e.target.value)} />
          <TextField label="Nội dung (HTML)" fullWidth multiline minRows={6} value={contentHtml} onChange={(e) => setContentHtml(e.target.value)} />
          <Box display="flex" gap={2} sx={{ mt: 2 }}>
            <TextField label="Chủ đề" fullWidth value={topic} onChange={(e) => setTopic(e.target.value)} />
            <TextField label="Tuần" type="number" fullWidth value={week} onChange={(e) => setWeek(e.target.value === '' ? '' : Number(e.target.value))} />
          </Box>
          <TextField label="Nhãn (phân cách bằng dấu phẩy)" fullWidth sx={{ mt: 2 }} value={tags} onChange={(e) => setTags(e.target.value)} />
          <Box sx={{ mt: 2 }}>
            <Button component="label" variant="outlined">
              Chọn tệp để tải lên
              <input type="file" hidden multiple onChange={(e) => onFiles(e.target.files)} />
            </Button>
            <Box sx={{ mt: 1 }}>
              {attachments.map((a, i) => (
                <Typography key={i} variant="body2">{a.name} - {a.type}</Typography>
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Hủy</Button>
          <Button variant="contained" disabled={saving || !title.trim()} onClick={createLesson}>{saving ? 'Đang lưu...' : 'Tạo'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Sửa bài giảng</DialogTitle>
        <DialogContent>
          <TextField label="Tiêu đề" fullWidth sx={{ mt: 1, mb: 2 }} value={title} onChange={(e) => setTitle(e.target.value)} />
          <TextField label="Nội dung (HTML)" fullWidth multiline minRows={6} value={contentHtml} onChange={(e) => setContentHtml(e.target.value)} />
          <Box display="flex" gap={2} sx={{ mt: 2 }}>
            <TextField label="Chủ đề" fullWidth value={topic} onChange={(e) => setTopic(e.target.value)} />
            <TextField label="Tuần" type="number" fullWidth value={week} onChange={(e) => setWeek(e.target.value === '' ? '' : Number(e.target.value))} />
          </Box>
          <TextField label="Nhãn (phân cách bằng dấu phẩy)" fullWidth sx={{ mt: 2 }} value={tags} onChange={(e) => setTags(e.target.value)} />
          <Box sx={{ mt: 2 }}>
            <Button component="label" variant="outlined">
              Thêm tệp đính kèm
              <input type="file" hidden multiple onChange={(e) => onFiles(e.target.files)} />
            </Button>
            <Box sx={{ mt: 1 }}>
              <List dense disablePadding>
                {attachments.map((a, idx) => (
                  <React.Fragment key={idx}>
                    <ListItem
                      secondaryAction={
                        <IconButton edge="end" aria-label="Xóa tệp" title="Xóa tệp" onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      }
                      disablePadding
                    >
                      <ListItemButton component="a" href={a.url} target="_blank" rel="noreferrer" sx={{ borderRadius: 1 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          {(a.name || a.url || '').toLowerCase().endsWith('.pdf') || (a.type || '').toLowerCase().includes('pdf') ? (
                            <PictureAsPdfIcon fontSize="small" color="error" />
                          ) : (a.type || '').toLowerCase().includes('image') ? (
                            <ImageIcon fontSize="small" color="primary" />
                          ) : (a.type || '').toLowerCase().includes('video') ? (
                            <MovieIcon fontSize="small" color="action" />
                          ) : (
                            <InsertDriveFileIcon fontSize="small" color="action" />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={a.name || a.url}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItemButton>
                    </ListItem>
                    {idx < attachments.length - 1 && <Divider component="li" sx={{ my: 0.25 }} />}
                  </React.Fragment>
                ))}
              </List>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Hủy</Button>
          <Button variant="contained" disabled={saving || !title.trim()} onClick={saveEdit}>{saving ? 'Đang lưu...' : 'Lưu'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}


