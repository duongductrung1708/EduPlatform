import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton
} from '@mui/material';
import {
  Warning as WarningIcon,
  Close as CloseIcon
} from '@mui/icons-material';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'delete' | 'warning' | 'info';
  loading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title = 'Xác nhận',
  message = 'Bạn có chắc chắn muốn thực hiện hành động này?',
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  type = 'warning',
  loading = false
}) => {
  const getIconColor = () => {
    switch (type) {
      case 'delete':
        return '#EF5B5B';
      case 'warning':
        return '#FF9800';
      case 'info':
        return '#2196F3';
      default:
        return '#FF9800';
    }
  };

  const getConfirmButtonColor = () => {
    switch (type) {
      case 'delete':
        return {
          background: 'linear-gradient(45deg, #EF5B5B, #FF7B7B)',
          '&:hover': { background: 'linear-gradient(45deg, #D94A4A, #EF5B5B)' }
        };
      case 'warning':
        return {
          background: 'linear-gradient(45deg, #FF9800, #FFB74D)',
          '&:hover': { background: 'linear-gradient(45deg, #F57C00, #FF9800)' }
        };
      case 'info':
        return {
          background: 'linear-gradient(45deg, #2196F3, #64B5F6)',
          '&:hover': { background: 'linear-gradient(45deg, #1976D2, #2196F3)' }
        };
      default:
        return {
          background: 'linear-gradient(45deg, #FF9800, #FFB74D)',
          '&:hover': { background: 'linear-gradient(45deg, #F57C00, #FF9800)' }
        };
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
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle
        sx={{
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          color: '#333',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 2,
          px: 3,
          borderBottom: '1px solid rgba(0,0,0,0.1)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <WarningIcon 
            sx={{ 
              color: getIconColor(),
              fontSize: 28
            }} 
          />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: '#666',
            '&:hover': {
              backgroundColor: 'rgba(0,0,0,0.1)',
              color: '#333'
            }
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Typography 
          variant="body1" 
          sx={{ 
            color: '#555',
            lineHeight: 1.6,
            fontSize: '1rem'
          }}
        >
          {message}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1.5 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            borderColor: '#ddd',
            color: '#666',
            px: 3,
            py: 1,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 500,
            '&:hover': {
              borderColor: '#bbb',
              backgroundColor: 'rgba(0,0,0,0.05)'
            }
          }}
          disabled={loading}
        >
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          sx={{
            ...getConfirmButtonColor(),
            color: 'white',
            px: 3,
            py: 1,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            '&:disabled': {
              background: '#ccc',
              color: '#666'
            }
          }}
          disabled={loading}
        >
          {loading ? 'Đang xử lý...' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
