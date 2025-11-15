import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  Close as CloseIcon,
  Email as EmailIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { authApi, AuthResponse } from '../api/auth';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

interface OtpVerificationDialogProps {
  open: boolean;
  onClose: () => void;
  email: string;
  onVerificationSuccess: (authData: AuthResponse) => void;
}

const OtpVerificationDialog: React.FC<OtpVerificationDialogProps> = ({
  open,
  onClose,
  email,
  onVerificationSuccess,
}) => {
  const { darkMode } = useTheme();
  const { refreshUserState } = useAuth();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(0);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setOtp('');
      setError('');
      setSuccess('');
      setCountdown(60); // 60 seconds cooldown for resend
    }
  }, [open]);

  const handleOtpChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.replace(/\D/g, '').slice(0, 6); // Only numbers, max 6 digits
    setOtp(value);
    setError('');
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setError('Vui lòng nhập đầy đủ 6 chữ số');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authApi.verifyOtp({ email, otp });
      setSuccess('Xác thực thành công! Đang đăng nhập...');
      
      // Wait a moment to show success message, then auto-login
      setTimeout(() => {
        // Store tokens and user data for auto-login
        localStorage.setItem('accessToken', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        // Refresh AuthContext state to reflect the new login
        refreshUserState();
        
        onVerificationSuccess(response);
        onClose();
      }, 1500);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || 'Mã OTP không đúng hoặc đã hết hạn');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    setError('');

    try {
      await authApi.resendOtp({ email });
      setSuccess('Đã gửi lại mã OTP. Vui lòng kiểm tra email.');
      setCountdown(60); // Reset countdown
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || 'Không thể gửi lại mã OTP');
    } finally {
      setResendLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && otp.length === 6) {
      handleVerifyOtp();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          bgcolor: darkMode ? '#333' : '#fff',
          color: darkMode ? '#eee' : '#333',
        }
      }}
    >
      <DialogTitle sx={{ 
        background: 'linear-gradient(45deg, #EF5B5B, #FF7B7B)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        py: 2,
        px: 3,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
      }}>
        <EmailIcon sx={{ fontSize: 28 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600, color: 'white' }}>
          Xác thực Email
        </Typography>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ py: 3, px: 3 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <CheckCircleIcon 
            sx={{ 
              fontSize: 64, 
              color: '#EF5B5B', 
              mb: 2,
              filter: 'drop-shadow(0 4px 8px rgba(239, 91, 91, 0.3))'
            }} 
          />
          <Typography variant="h6" sx={{ mb: 1, color: darkMode ? '#eee' : '#333' }}>
            Kiểm tra email của bạn
          </Typography>
          <Typography variant="body2" sx={{ color: darkMode ? '#aaa' : '#666', mb: 2 }}>
            Chúng tôi đã gửi mã xác thực 6 chữ số đến:
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              fontWeight: 600, 
              color: '#EF5B5B',
              bgcolor: darkMode ? 'rgba(239, 91, 91, 0.1)' : 'rgba(239, 91, 91, 0.05)',
              px: 2,
              py: 1,
              borderRadius: 2,
              display: 'inline-block'
            }}
          >
            {email}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
            {success}
          </Alert>
        )}

        <TextField
          fullWidth
          label="Mã xác thực (6 chữ số)"
          value={otp}
          onChange={handleOtpChange}
          onKeyPress={handleKeyPress}
          placeholder="123456"
          variant="outlined"
          disabled={loading}
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              fontSize: '1.2rem',
              textAlign: 'center',
              letterSpacing: '0.5rem',
              '& input': {
                textAlign: 'center',
                letterSpacing: '0.5rem',
                fontSize: '1.5rem',
                fontWeight: 600,
              },
            },
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                {loading && <CircularProgress size={20} />}
              </InputAdornment>
            ),
          }}
        />

        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Typography variant="body2" sx={{ color: darkMode ? '#aaa' : '#666', mb: 1 }}>
            Không nhận được email?
          </Typography>
          <Button
            onClick={handleResendOtp}
            disabled={resendLoading || countdown > 0}
            startIcon={resendLoading ? <CircularProgress size={16} /> : <RefreshIcon />}
            sx={{
              color: '#EF5B5B',
              '&:hover': {
                bgcolor: 'rgba(239, 91, 91, 0.1)',
              },
              '&:disabled': {
                color: darkMode ? '#666' : '#999',
              },
            }}
          >
            {countdown > 0 ? `Gửi lại sau ${countdown}s` : 'Gửi lại mã OTP'}
          </Button>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` }}>
        <Button 
          onClick={onClose} 
          disabled={loading}
          sx={{ 
            color: darkMode ? '#aaa' : '#777',
            '&:hover': {
              bgcolor: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
            }
          }}
        >
          Hủy
        </Button>
        <Button
          onClick={handleVerifyOtp}
          variant="contained"
          disabled={loading || otp.length !== 6}
          sx={{
            background: 'linear-gradient(45deg, #EF5B5B, #FF7B7B)',
            '&:hover': { 
              background: 'linear-gradient(45deg, #D94A4A, #EF5B5B)' 
            },
            color: 'white',
            fontWeight: 600,
            minWidth: 120,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          {loading && <CircularProgress size={20} color="inherit" />}
          Xác thực
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OtpVerificationDialog;
