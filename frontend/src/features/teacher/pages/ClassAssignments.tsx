import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, Grid, Card, CardContent, Chip, Breadcrumbs, Link as MuiLink } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { assignmentsApi, AssignmentItem, AssignmentAttachment } from '../../../api/assignments';
import { uploadsApi } from '../../../api/uploads';
import { classesApi } from '../../../api/admin';
import { coursesApi, CourseItem } from '../../../api/courses';
import { useAuth } from '../../../contexts/AuthContext';

export default function ClassAssignments() {
  const { id } = useParams();
  const classroomId = id as string;
  const navigate = useNavigate();
  const { user } = useAuth();

  const [items, setItems] = useState<AssignmentItem[]>([]);
  const [showOverdue, setShowOverdue] = useState(false);
  const [showSubmitted, setShowSubmitted] = useState<'all' | 'submitted' | 'not_submitted'>('all');
  const [mySubmissions, setMySubmissions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<AssignmentAttachment[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [totalPoints, setTotalPoints] = useState<number | ''>('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [classroomInfo, setClassroomInfo] = useState<any | null>(null);
  const [courseInfo, setCourseInfo] = useState<CourseItem | null>(null);

  const fetchAssignments = async () => {
    if (!classroomId) return;
    try {
      setLoading(true);
      setError(null);
      const list = await assignmentsApi.list(classroomId);
      setItems(list);
      // For students, fetch my-submission status per assignment
      if (user?.role === 'student') {
        const map: Record<string, boolean> = {};
        await Promise.all(list.map(async (a) => {
          try {
            const sub = await assignmentsApi.getMySubmission(classroomId, a._id);
            map[a._id] = !!sub;
          } catch {}
        }));
        setMySubmissions(map);
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Không thể tải bài tập');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
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

  const createAssignment = async () => {
    if (!classroomId || !title.trim()) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await assignmentsApi.create(classroomId, { title: title.trim(), description, attachments, dueDate: dueDate || undefined, totalPoints: totalPoints === '' ? undefined : Number(totalPoints) });
      setOpen(false);
      setTitle('');
      setDescription('');
      setAttachments([]);
      setDueDate('');
      setTotalPoints('');
      setSuccess('Đã tạo bài tập');
      fetchAssignments();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Không thể tạo bài tập');
    } finally {
      setSaving(false);
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
              <Typography color="text.primary">Bài tập</Typography>
            </Breadcrumbs>
          )}
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Bài tập</Typography>
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
        <Button variant="contained" onClick={() => setOpen(true)}>Tạo bài tập</Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

      <Box display="flex" gap={2} sx={{ mb: 2 }}>
        <Button variant={showOverdue ? 'contained' : 'outlined'} onClick={() => setShowOverdue(v => !v)}>Chỉ hiển thị quá hạn</Button>
        {user?.role === 'student' && (
          <Box display="flex" gap={1}>
            <Button variant={showSubmitted === 'all' ? 'contained' : 'outlined'} onClick={() => setShowSubmitted('all')}>Tất cả</Button>
            <Button variant={showSubmitted === 'not_submitted' ? 'contained' : 'outlined'} onClick={() => setShowSubmitted('not_submitted')}>Chưa nộp</Button>
            <Button variant={showSubmitted === 'submitted' ? 'contained' : 'outlined'} onClick={() => setShowSubmitted('submitted')}>Đã nộp</Button>
          </Box>
        )}
      </Box>

      <Grid container spacing={2}>
        {items.filter(it => {
          const now = Date.now();
          const isOverdue = !!it.dueDate && new Date(it.dueDate).getTime() < now;
          if (showOverdue && !isOverdue) return false;
          if (user?.role === 'student') {
            const submitted = !!mySubmissions[it._id];
            if (showSubmitted === 'submitted' && !submitted) return false;
            if (showSubmitted === 'not_submitted' && submitted) return false;
          }
          return true;
        }).map(it => (
          <Grid item xs={12} md={6} key={it._id}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1 }}>{it.title}</Typography>
                {it.description && <Typography variant="body2" sx={{ mb: 1 }}>{it.description}</Typography>}
                {(it.dueDate || it.totalPoints) && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {it.dueDate ? `Hạn nộp: ${new Date(it.dueDate).toLocaleString()}` : ''}
                    {it.dueDate && it.totalPoints ? ' · ' : ''}
                    {it.totalPoints ? `Thang điểm: ${it.totalPoints}` : ''}
                  </Typography>
                )}
                {user?.role === 'student' && (
                  <Typography variant="caption" color="text.secondary">
                    Trạng thái: {mySubmissions[it._id] ? 'Đã nộp' : 'Chưa nộp'}
                  </Typography>
                )}
                {it.attachments && it.attachments.length > 0 && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">Tài liệu đính kèm:</Typography>
                    <ul>
                      {it.attachments.map((a, idx) => (
                        <li key={idx}><a href={a.url} target="_blank" rel="noreferrer">{a.name || a.url}</a></li>
                      ))}
                    </ul>
                  </Box>
                )}
                <Box display="flex" gap={1} sx={{ mt: 1 }}>
                  {user?.role === 'student' && (
                    <Button size="small" variant="outlined" onClick={() => navigate(`/classes/${classroomId}/assignments/${it._id}/submit`)}>
                      Nộp bài
                    </Button>
                  )}
                  {user?.role === 'teacher' && (
                    <Button size="small" variant="outlined" onClick={() => navigate(`/teacher/classes/${classroomId}/assignments/${it._id}/submissions`)}>
                      Chấm bài
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Tạo bài tập</DialogTitle>
        <DialogContent>
          <TextField label="Tiêu đề" fullWidth sx={{ mt: 1, mb: 2 }} value={title} onChange={(e) => setTitle(e.target.value)} />
          <TextField label="Mô tả" fullWidth multiline minRows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          <Box display="flex" gap={2} sx={{ mt: 2 }}>
            <TextField label="Hạn nộp" type="datetime-local" fullWidth value={dueDate} onChange={(e) => setDueDate(e.target.value)} InputLabelProps={{ shrink: true }} />
            <TextField label="Thang điểm" type="number" fullWidth value={totalPoints} onChange={(e) => setTotalPoints(e.target.value === '' ? '' : Number(e.target.value))} />
          </Box>
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
          <Button variant="contained" disabled={saving || !title.trim()} onClick={createAssignment}>{saving ? 'Đang lưu...' : 'Tạo'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}


