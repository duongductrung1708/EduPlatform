import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Paper, Typography, Box, Alert, List, ListItem, ListItemText, TextField, Button } from '@mui/material';
import { assignmentsApi } from '../api/assignments';

const GradeSubmissionsPage: React.FC = () => {
  const { classroomId, assignmentId } = useParams();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [grades, setGrades] = useState<Record<string, { grade: string; feedback: string }>>({});

  const fetchSubmissions = async () => {
    if (!classroomId || !assignmentId) return;
    try {
      setError(null);
      const list = await assignmentsApi.listSubmissions(classroomId, assignmentId);
      setSubmissions(list);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Không thể tải danh sách bài nộp');
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [classroomId, assignmentId]);

  const gradeOne = async (submissionId: string) => {
    if (!classroomId || !assignmentId) return;
    const s = grades[submissionId] || { grade: '', feedback: '' };
    const gradeNum = Number(s.grade);
    if (Number.isNaN(gradeNum)) {
      setError('Điểm phải là số');
      return;
    }
    try {
      await assignmentsApi.grade(classroomId, assignmentId, submissionId, { grade: gradeNum, feedback: s.feedback });
      setSuccess('Đã chấm điểm');
      fetchSubmissions();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Không thể chấm điểm');
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 6 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>Chấm điểm bài nộp</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}
        <List>
          {submissions.map((s) => (
            <ListItem key={s._id} alignItems="flex-start" sx={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <ListItemText primary={s.student?.name || s.studentId} secondary={
                <Box>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{s.contentText}</Typography>
                  {s.attachments && s.attachments.length > 0 && (
                    <ul>
                      {s.attachments.map((a: any, idx: number) => (
                        <li key={idx}><a href={a.url} target="_blank" rel="noreferrer">{a.name || a.url}</a></li>
                      ))}
                    </ul>
                  )}
                </Box>
              } />
              <Box display="flex" gap={2} alignItems="center">
                <TextField label="Điểm" size="small" value={grades[s._id]?.grade || ''} onChange={(e) => setGrades(prev => ({ ...prev, [s._id]: { ...(prev[s._id] || { grade: '', feedback: '' }), grade: e.target.value } }))} sx={{ width: 100 }} />
                <TextField label="Nhận xét" size="small" value={grades[s._id]?.feedback || ''} onChange={(e) => setGrades(prev => ({ ...prev, [s._id]: { ...(prev[s._id] || { grade: '', feedback: '' }), feedback: e.target.value } }))} sx={{ flex: 1 }} />
                <Button variant="contained" onClick={() => gradeOne(s._id)}>Lưu</Button>
              </Box>
            </ListItem>
          ))}
        </List>
      </Paper>
    </Container>
  );
};

export default GradeSubmissionsPage;


