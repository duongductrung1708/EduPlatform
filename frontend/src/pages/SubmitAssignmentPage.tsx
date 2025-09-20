import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Paper, TextField, Button, Typography, Box, Alert } from '@mui/material';
import { assignmentsApi } from '../api/assignments';
import { uploadsApi } from '../api/uploads';

const SubmitAssignmentPage: React.FC = () => {
  const { classroomId, assignmentId } = useParams();
  const [contentText, setContentText] = useState('');
  const [attachments, setAttachments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classroomId || !assignmentId) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await assignmentsApi.submit(classroomId, assignmentId, { contentText, attachments });
      setSuccess('Đã nộp bài thành công');
      setContentText('');
      setAttachments([]);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Không thể nộp bài');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 6 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>Nộp bài tập</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        <Box component="form" onSubmit={handleSubmit}>
          <TextField label="Nội dung bài làm" fullWidth multiline minRows={4} value={contentText} onChange={(e) => setContentText(e.target.value)} />
          <Box sx={{ mt: 2 }}>
            <Button component="label" variant="outlined">
              Đính kèm tệp
              <input type="file" hidden multiple onChange={(e) => onFiles(e.target.files)} />
            </Button>
            <Box sx={{ mt: 1 }}>
              {attachments.map((a, i) => (
                <Typography key={i} variant="body2">{a.name}</Typography>
              ))}
            </Box>
          </Box>
          <Box mt={2} display="flex" justifyContent="flex-end">
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? 'Đang nộp...' : 'Nộp bài'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default SubmitAssignmentPage;


