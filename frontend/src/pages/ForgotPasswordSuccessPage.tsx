import React, { useState } from 'react';
import { Container, Paper, Typography, Box, Button, Alert } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EmailIcon from '@mui/icons-material/Email';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '../api/auth';
import Logo from '../components/Logo';

const ForgotPasswordSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  
  // Get email from location state or URL params
  const email = location.state?.email || new URLSearchParams(location.search).get('email') || 'email của bạn';

  const handleResendEmail = async () => {
    if (!email || email === 'email của bạn') return;
    
    setResending(true);
    setResendError(null);
    setResendSuccess(false);
    
    try {
      await authApi.forgotPassword(email);
      setResendSuccess(true);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setResendError(err?.response?.data?.message || 'Không thể gửi lại email');
    } finally {
      setResending(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: (t) => t.palette.mode === 'dark'
        ? 'linear-gradient(135deg, #0f172a 0%, #111827 100%)'
        : 'linear-gradient(135deg, #e3f2fd 0%, #f5f7ff 100%)',
      p: 2,
      position: 'relative',
    }}>
      <Box sx={{ position: 'absolute', top: 16, left: 16 }}>
        <Logo height={48} />
      </Box>
      <Container maxWidth="sm">
        <Paper sx={{ p: 4, borderRadius: 3 }} elevation={8}>
          <Box textAlign="center" sx={{ mb: 3 }}>
            <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Email đã được gửi
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến email của bạn
            </Typography>
          </Box>

          <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <EmailIcon sx={{ mr: 1 }} />
              <Typography variant="subtitle2" fontWeight={600}>
                Kiểm tra email của bạn
              </Typography>
            </Box>
            <Typography variant="body2">
              Chúng tôi đã gửi liên kết đặt lại mật khẩu đến <strong>{email}</strong>
            </Typography>
          </Alert>

          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              <strong>Hướng dẫn tiếp theo:</strong>
            </Typography>
            <Box component="ol" sx={{ pl: 2, m: 0 }}>
              <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Kiểm tra hộp thư đến của bạn (có thể trong thư mục spam)
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Nhấp vào liên kết trong email để đặt lại mật khẩu
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Tạo mật khẩu mới an toàn
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary">
                Đăng nhập với mật khẩu mới
              </Typography>
            </Box>
          </Box>

          {resendSuccess && (
            <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
              <Typography variant="body2">
                <strong>Thành công!</strong> Email đã được gửi lại. Vui lòng kiểm tra hộp thư.
              </Typography>
            </Alert>
          )}

          {resendError && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              <Typography variant="body2">
                <strong>Lỗi:</strong> {resendError}
              </Typography>
            </Alert>
          )}

          <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
            <Typography variant="body2">
              <strong>Lưu ý:</strong> Liên kết đặt lại mật khẩu sẽ hết hạn sau 30 phút. 
              Nếu bạn không nhận được email, vui lòng kiểm tra thư mục spam hoặc thử lại.
            </Typography>
          </Alert>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="outlined"
              onClick={handleResendEmail}
              disabled={resending || email === 'email của bạn'}
              sx={{ py: 1.2, fontWeight: 600 }}
            >
              {resending ? 'Đang gửi...' : 'Gửi lại email'}
            </Button>
            <Button
              variant="contained"
              onClick={() => navigate('/auth/login')}
              sx={{ py: 1.2, fontWeight: 600 }}
            >
              Quay lại đăng nhập
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default ForgotPasswordSuccessPage;
