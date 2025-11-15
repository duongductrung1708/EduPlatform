import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  Avatar,
  Chip,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useAuth } from '../contexts/AuthContext';
import { courseInvitationsApi } from '../api/course-invitations';
import BackButton from '../components/BackButton';
import Breadcrumb from '../components/Breadcrumb';

interface CourseInvitation {
  _id: string;
  courseId: {
    _id: string;
    title: string;
    description: string;
    category: string;
    level: string;
  };
  teacherId: {
    _id: string;
    name: string;
    email: string;
  };
  studentId: {
    _id: string;
    name: string;
    email: string;
  };
  courseTitle: string;
  teacherName: string;
  studentEmail: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expiresAt: string;
  message?: string;
  createdAt: string;
}

export default function CourseInvitationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [invitation, setInvitation] = useState<CourseInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadInvitation();
    }
  }, [id]);

  const loadInvitation = async () => {
    try {
      setLoading(true);
      const data = await courseInvitationsApi.getInvitation(id!);
      setInvitation(data);
    } catch (error: unknown) {
      const err = error as { message?: string; response?: { data?: { message?: string } } };
      console.error('Error loading invitation:', err);
      setError(err.message || err.response?.data?.message || 'Không thể tải thông tin lời mời');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!invitation || !user) return;

    try {
      setActionLoading(true);
      await courseInvitationsApi.acceptInvitation(invitation._id);
      setSuccess('Đã chấp nhận lời mời thành công! Đang chuyển hướng...');
      setTimeout(() => {
        navigate(`/courses/${invitation.courseId._id}`);
      }, 2000);
    } catch (error: unknown) {
      const err = error as { message?: string; response?: { data?: { message?: string } } };
      console.error('Error accepting invitation:', err);
      setError(err.message || err.response?.data?.message || 'Không thể chấp nhận lời mời');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!invitation || !user) return;

    try {
      setActionLoading(true);
      await courseInvitationsApi.declineInvitation(invitation._id);
      setSuccess('Đã từ chối lời mời. Đang chuyển hướng...');
      setTimeout(() => {
        navigate('/student');
      }, 2000);
    } catch (error: unknown) {
      const err = error as { message?: string; response?: { data?: { message?: string } } };
      console.error('Error declining invitation:', err);
      setError(err.message || err.response?.data?.message || 'Không thể từ chối lời mời');
    } finally {
      setActionLoading(false);
    }
  };

  const isExpired = invitation && new Date(invitation.expiresAt) < new Date();
  const isNotPending = invitation && invitation.status !== 'pending';

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)'
      }}>
        <CircularProgress size={60} sx={{ color: 'white' }} />
      </Box>
    );
  }

  if (error || !invitation) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
        p: 3
      }}>
        <Paper sx={{ p: 4, maxWidth: 500, textAlign: 'center' }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error || 'Lời mời không tồn tại hoặc đã hết hạn'}
          </Alert>
          <Button 
            variant="contained" 
            onClick={() => navigate('/student')}
            sx={{ 
              background: 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #D94A4A 0%, #EF5B5B 100%)',
              }
            }}
          >
            Về trang chủ
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
      p: 3
    }}>
      {/* Breadcrumb */}
      <Breadcrumb 
        items={[
          { label: 'Trang chủ', path: '/dashboard' },
          { label: 'Lời mời môn học', current: true }
        ]}
        sx={{ color: 'white' }}
      />
      
      {/* Back Button */}
      <BackButton to="/dashboard" sx={{ color: 'white' }} />
      <Box sx={{ maxWidth: 800, mx: 'auto' }}>
        <Paper elevation={8} sx={{ borderRadius: 4, overflow: 'hidden' }}>
          {/* Header */}
          <Box sx={{ 
            p: 4, 
            background: 'linear-gradient(135deg, #AED6E6 0%, #87CEEB 100%)',
            textAlign: 'center'
          }}>
            <SchoolIcon sx={{ fontSize: 60, color: 'white', mb: 2 }} />
            <Typography variant="h4" fontWeight={700} color="white">
              Lời mời tham gia môn học
            </Typography>
            <Typography variant="h6" color="white" sx={{ mt: 1, opacity: 0.9 }}>
              {invitation.courseTitle}
            </Typography>
          </Box>

          <Box sx={{ p: 4 }}>
            {success && (
              <Alert severity="success" sx={{ mb: 3 }}>
                {success}
              </Alert>
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {/* Course Information */}
            <Card sx={{ mb: 3, border: '2px solid', borderColor: 'divider' }}>
              <CardContent>
                <Stack spacing={3}>
                  <Box>
                    <Typography variant="h5" fontWeight={600} sx={{ mb: 1 }}>
                      📚 {invitation.courseTitle}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {invitation.courseId.description}
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {invitation.courseId.category && (
                      <Chip 
                        label={invitation.courseId.category} 
                        variant="outlined" 
                        sx={{ borderColor: '#EF5B5B', color: '#EF5B5B' }}
                      />
                    )}
                    {invitation.courseId.level && (
                      <Chip 
                        label={invitation.courseId.level} 
                        variant="outlined" 
                        sx={{ borderColor: '#AED6E6', color: '#AED6E6' }}
                      />
                    )}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            {/* Teacher Information */}
            <Card sx={{ mb: 3, border: '2px solid', borderColor: 'divider' }}>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ bgcolor: '#EF5B5B', width: 60, height: 60 }}>
                    <PersonIcon fontSize="large" />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={600}>
                      👨‍🏫 Giáo viên: {invitation.teacherName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {invitation.teacherId.email}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            {/* Message */}
            {invitation.message && (
              <Card sx={{ mb: 3, border: '2px solid', borderColor: 'divider' }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                    💬 Lời nhắn từ giáo viên:
                  </Typography>
                  <Typography variant="body1">
                    {invitation.message}
                  </Typography>
                </CardContent>
              </Card>
            )}

            {/* Expiration Info */}
            <Card sx={{ mb: 3, border: '2px solid', borderColor: isExpired ? 'error.main' : 'warning.main' }}>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <AccessTimeIcon color={isExpired ? 'error' : 'warning'} />
                  <Box>
                    <Typography variant="body1" fontWeight={600}>
                      {isExpired ? '⏰ Lời mời đã hết hạn' : '⏰ Lời mời hết hạn vào:'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(invitation.expiresAt).toLocaleString('vi-VN')}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            {/* Status */}
            {isNotPending && (
              <Alert 
                severity={invitation.status === 'accepted' ? 'success' : 'info'} 
                sx={{ mb: 3 }}
              >
                {invitation.status === 'accepted' && '✅ Bạn đã chấp nhận lời mời này'}
                {invitation.status === 'declined' && '❌ Bạn đã từ chối lời mời này'}
                {invitation.status === 'expired' && '⏰ Lời mời này đã hết hạn'}
              </Alert>
            )}

            {/* Action Buttons */}
            {invitation.status === 'pending' && !isExpired && (
              <Stack direction="row" spacing={2} justifyContent="center">
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<CheckCircleIcon />}
                  onClick={handleAccept}
                  disabled={actionLoading}
                  sx={{ 
                    py: 2,
                    px: 4,
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #388E3C 0%, #4CAF50 100%)',
                    }
                  }}
                >
                  {actionLoading ? <CircularProgress size={24} color="inherit" /> : 'Chấp nhận'}
                </Button>
                
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<CancelIcon />}
                  onClick={handleDecline}
                  disabled={actionLoading}
                  sx={{ 
                    py: 2,
                    px: 4,
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #F44336 0%, #EF5350 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #D32F2F 0%, #F44336 100%)',
                    }
                  }}
                >
                  {actionLoading ? <CircularProgress size={24} color="inherit" /> : 'Từ chối'}
                </Button>
              </Stack>
            )}

            {/* Navigation */}
            <Divider sx={{ my: 3 }} />
            <Stack direction="row" spacing={2} justifyContent="center">
              <Button
                variant="outlined"
                onClick={() => navigate('/student')}
                sx={{ 
                  borderColor: '#EF5B5B', 
                  color: '#EF5B5B',
                  '&:hover': {
                    borderColor: '#D94A4A',
                    backgroundColor: 'rgba(239, 91, 91, 0.04)'
                  }
                }}
              >
                Về trang chủ
              </Button>
              
              {invitation.status === 'accepted' && (
                <Button
                  variant="contained"
                  onClick={() => navigate(`/courses/${invitation.courseId._id}`)}
                  sx={{ 
                    background: 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #D94A4A 0%, #EF5B5B 100%)',
                    }
                  }}
                >
                  Vào môn học
                </Button>
              )}
            </Stack>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
