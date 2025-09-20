import React, { useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { Box, Container, Typography, Chip, Alert, Grid, Card, CardContent, Button, Breadcrumbs, Link as MuiLink, Snackbar } from '@mui/material';
import { classesApi } from '../api/admin';
import { lessonsApi, LessonItem } from '../api/lessons';
import { assignmentsApi, AssignmentItem } from '../api/assignments';
import { useSocket } from '../hooks/useSocket';

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
    <Container maxWidth="lg" sx={{ mt: 3, mb: 4 }}>
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
        <Grid item xs={12} md={6}>
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
                        {l.attachments.map((a, i) => (
                          <Button key={i} size="small" component="a" href={a.url} target="_blank" rel="noreferrer">{a.name || 'Tải tệp'}</Button>
                        ))}
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
  );
};

export default StudentClassroomDetailPage;


