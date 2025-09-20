import React from 'react';
import { Alert, AlertTitle, Box, Typography, Collapse, IconButton } from '@mui/material';
import { ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon } from '@mui/icons-material';

interface ErrorAlertProps {
  error: string;
  title?: string;
  severity?: 'error' | 'warning' | 'info';
  showDetails?: boolean;
  onClose?: () => void;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({
  error,
  title,
  severity = 'error',
  showDetails = false,
  onClose
}) => {
  const [expanded, setExpanded] = React.useState(false);

  // Parse error message to extract details
  const parseErrorMessage = (errorMsg: string) => {
    // Common error patterns
    const patterns = {
      email: /email/i,
      password: /mật khẩu|password/i,
      name: /tên|name/i,
      role: /vai trò|role/i,
      network: /network|kết nối|connection/i,
      server: /server|máy chủ/i,
      timeout: /timeout|hết hạn/i,
    };

    const matchedPatterns = Object.entries(patterns)
      .filter(([_, pattern]) => pattern.test(errorMsg))
      .map(([key, _]) => key);

    return {
      message: errorMsg,
      categories: matchedPatterns,
      isDetailed: errorMsg.length > 50 || matchedPatterns.length > 0
    };
  };

  const errorInfo = parseErrorMessage(error);

  const getErrorIcon = () => {
    if (errorInfo.categories.includes('email')) return '📧';
    if (errorInfo.categories.includes('password')) return '🔒';
    if (errorInfo.categories.includes('name')) return '👤';
    if (errorInfo.categories.includes('role')) return '🎭';
    if (errorInfo.categories.includes('network')) return '🌐';
    if (errorInfo.categories.includes('server')) return '🖥️';
    if (errorInfo.categories.includes('timeout')) return '⏰';
    return '❌';
  };

  const getErrorColor = () => {
    if (errorInfo.categories.includes('email')) return '#e3f2fd';
    if (errorInfo.categories.includes('password')) return '#fff3e0';
    if (errorInfo.categories.includes('network')) return '#f3e5f5';
    if (errorInfo.categories.includes('server')) return '#ffebee';
    return undefined;
  };

  const getSuggestions = () => {
    const suggestions: string[] = [];
    
    if (errorInfo.categories.includes('email')) {
      suggestions.push('• Kiểm tra định dạng email (ví dụ: user@example.com)');
      suggestions.push('• Đảm bảo email chưa được sử dụng bởi tài khoản khác');
    }
    
    if (errorInfo.categories.includes('password')) {
      suggestions.push('• Mật khẩu phải có ít nhất 8 ký tự');
      suggestions.push('• Kiểm tra mật khẩu có đúng không');
      suggestions.push('• Sử dụng chức năng "Quên mật khẩu" nếu cần');
    }
    
    if (errorInfo.categories.includes('name')) {
      suggestions.push('• Tên phải có ít nhất 2 ký tự');
      suggestions.push('• Không sử dụng ký tự đặc biệt');
    }
    
    if (errorInfo.categories.includes('network')) {
      suggestions.push('• Kiểm tra kết nối internet');
      suggestions.push('• Thử lại sau vài giây');
    }
    
    if (errorInfo.categories.includes('server')) {
      suggestions.push('• Hệ thống đang bảo trì, vui lòng thử lại sau');
      suggestions.push('• Liên hệ quản trị viên nếu lỗi tiếp tục');
    }

    return suggestions;
  };

  const suggestions = getSuggestions();

  return (
    <Alert 
      severity={severity} 
      sx={{ 
        mb: 2,
        backgroundColor: getErrorColor(),
        '& .MuiAlert-message': {
          width: '100%'
        }
      }}
      action={onClose ? (
        <IconButton
          aria-label="close"
          color="inherit"
          size="small"
          onClick={onClose}
        >
          ×
        </IconButton>
      ) : undefined}
    >
      <AlertTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <span>{getErrorIcon()}</span>
        {title || 'Có lỗi xảy ra'}
      </AlertTitle>
      
      <Typography variant="body2" sx={{ mb: suggestions.length > 0 ? 1 : 0 }}>
        {errorInfo.message}
      </Typography>

      {suggestions.length > 0 && (
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
            Gợi ý khắc phục:
          </Typography>
          <Box component="ul" sx={{ mt: 0.5, mb: 0, pl: 2 }}>
            {suggestions.map((suggestion, index) => (
              <Typography key={index} component="li" variant="caption" color="text.secondary">
                {suggestion}
              </Typography>
            ))}
          </Box>
        </Box>
      )}

      {errorInfo.isDetailed && showDetails && (
        <Box sx={{ mt: 1 }}>
          <IconButton
            size="small"
            onClick={() => setExpanded(!expanded)}
            sx={{ p: 0, mr: 1 }}
          >
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
          <Typography 
            variant="caption" 
            color="text.secondary" 
            sx={{ cursor: 'pointer' }}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Ẩn chi tiết' : 'Xem chi tiết'}
          </Typography>
          
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Box sx={{ mt: 1, p: 1, bgcolor: 'rgba(0,0,0,0.05)', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">
                <strong>Phân loại lỗi:</strong> {errorInfo.categories.join(', ') || 'Không xác định'}
              </Typography>
              <br />
              <Typography variant="caption" color="text.secondary">
                <strong>Thời gian:</strong> {new Date().toLocaleString('vi-VN')}
              </Typography>
            </Box>
          </Collapse>
        </Box>
      )}
    </Alert>
  );
};

export default ErrorAlert;
