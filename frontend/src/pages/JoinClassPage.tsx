import React, { useState, useEffect } from 'react';
import { Container, Paper, TextField, Button, Typography, Box, Alert } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { classesApi } from '../api/admin';

const JoinClassPage: React.FC = () => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const invite = params.get('invite') || params.get('code') || params.get('c');
    if (invite) setCode(invite);
  }, [location.search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const joined = await classesApi.join(code.trim());
      setSuccess(`Đã tham gia lớp: ${joined.title}`);
      setTimeout(() => navigate('/dashboard'), 800);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err?.response?.data?.message || 'Không thể tham gia lớp');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 6 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>Tham gia lớp học</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        <Box component="form" onSubmit={handleSubmit}>
          <TextField fullWidth label="Nhập mã mời" placeholder="VD: ABC-123" value={code} onChange={(e) => setCode(e.target.value)} />
          <Box mt={2} display="flex" justifyContent="flex-end">
            <Button type="submit" variant="contained" disabled={loading || !code.trim()}>
              {loading ? 'Đang tham gia...' : 'Tham gia'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default JoinClassPage;


