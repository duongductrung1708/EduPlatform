import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Alert,
  IconButton,
  Chip,
  Stack,
  Paper,
  Fade,
  Zoom,
  Tooltip,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  InsertDriveFile as InsertDriveFileIcon,
  Description as DescriptionIcon,
  PictureAsPdf as PictureAsPdfIcon,
  TableChart as TableChartIcon,
  Slideshow as SlideshowIcon,
  TextSnippet as TextSnippetIcon,
} from '@mui/icons-material';
import { uploadsApi } from '../api/uploads';

interface FileUploadProps {
  onFileUploaded: (fileData: { url: string; fileName: string; fileType: string }) => void;
  onFileRemoved?: () => void;
  acceptedTypes?: string[];
  maxSize?: number; // in MB
  folder?: string;
  disabled?: boolean;
  existingFile?: { url: string; fileName: string; fileType: string };
}

export default function FileUpload({
  onFileUploaded,
  onFileRemoved,
  acceptedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
  maxSize = 10, // 10MB
  folder = 'lessons',
  disabled = false,
  existingFile,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{ url: string; fileName: string; fileType: string } | null>(existingFile || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (acceptedTypes.length > 0 && !acceptedTypes.includes(file.type)) {
      setError(`Loại file không được hỗ trợ. Chỉ chấp nhận: ${acceptedTypes.join(', ')}`);
      return;
    }

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File quá lớn. Kích thước tối đa: ${maxSize}MB`);
      return;
    }

    setError(null);
    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const result = await uploadsApi.uploadFile(file, folder);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      const fileData = {
        url: result.url,
        fileName: file.name,
        fileType: file.type,
      };

      setUploadedFile(fileData);
      onFileUploaded(fileData);

      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 1000);

    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Lỗi khi upload file');
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setError(null);
    onFileRemoved?.();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleButtonClick = () => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <PictureAsPdfIcon sx={{ color: '#d32f2f', fontSize: 28 }} />;
    if (fileType.includes('word')) return <DescriptionIcon sx={{ color: '#1976d2', fontSize: 28 }} />;
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return <TableChartIcon sx={{ color: '#388e3c', fontSize: 28 }} />;
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return <SlideshowIcon sx={{ color: '#f57c00', fontSize: 28 }} />;
    if (fileType.includes('text')) return <TextSnippetIcon sx={{ color: '#7b1fa2', fontSize: 28 }} />;
    return <InsertDriveFileIcon sx={{ color: '#616161', fontSize: 28 }} />;
  };

  const getFileTypeLabel = (fileType: string) => {
    if (fileType.includes('pdf')) return 'PDF';
    if (fileType.includes('word') || fileType.includes('document')) return 'DOCX';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return 'XLSX';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return 'PPTX';
    if (fileType.includes('text')) return 'TXT';
    if (fileType.includes('image')) return 'IMG';
    if (fileType.includes('video')) return 'VID';
    if (fileType.includes('audio')) return 'AUD';
    if (fileType.includes('zip') || fileType.includes('rar')) return 'ZIP';
    // Fallback: try to extract from MIME type
    const extension = fileType.split('/')[1];
    if (extension) {
      return extension.toUpperCase().substring(0, 4);
    }
    return 'FILE';
  };

  return (
    <Box>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        disabled={disabled || uploading}
      />

      {!uploadedFile ? (
        <Fade in={true} timeout={500}>
          <Paper
            elevation={uploading ? 8 : 2}
            sx={{
              border: '2px dashed',
              borderColor: error ? 'error.main' : uploading ? 'success.main' : 'primary.main',
              borderRadius: 3,
              p: 4,
              textAlign: 'center',
              cursor: disabled || uploading ? 'not-allowed' : 'pointer',
              opacity: disabled || uploading ? 0.7 : 1,
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              background: uploading 
                ? 'linear-gradient(135deg, rgba(76, 175, 80, 0.05) 0%, rgba(76, 175, 80, 0.1) 100%)'
                : error 
                ? 'linear-gradient(135deg, rgba(244, 67, 54, 0.05) 0%, rgba(244, 67, 54, 0.1) 100%)'
                : 'linear-gradient(135deg, rgba(239, 91, 91, 0.05) 0%, rgba(239, 91, 91, 0.1) 100%)',
              '&:hover': {
                borderColor: disabled || uploading ? undefined : 'primary.dark',
                backgroundColor: disabled || uploading ? undefined : 'rgba(239, 91, 91, 0.08)',
                transform: disabled || uploading ? undefined : 'translateY(-2px)',
                boxShadow: disabled || uploading ? undefined : '0 8px 25px rgba(239, 91, 91, 0.15)',
              },
            }}
            onClick={handleButtonClick}
          >
            <Zoom in={true} timeout={600}>
              <Box>
                <CloudUploadIcon 
                  sx={{ 
                    fontSize: 64, 
                    color: uploading ? 'success.main' : error ? 'error.main' : 'primary.main', 
                    mb: 2,
                    animation: uploading ? 'pulse 2s infinite' : 'none',
                    '@keyframes pulse': {
                      '0%': { transform: 'scale(1)' },
                      '50%': { transform: 'scale(1.1)' },
                      '100%': { transform: 'scale(1)' },
                    },
                  }} 
                />
                <Typography variant="h5" fontWeight={600} gutterBottom sx={{ color: uploading ? 'success.main' : error ? 'error.main' : 'text.primary' }}>
                  {uploading ? 'Đang upload...' : error ? 'Upload thất bại' : 'Chọn file để upload'}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  {uploading ? 'Vui lòng đợi trong giây lát' : 'Kéo thả file vào đây hoặc click để chọn'}
                </Typography>
                <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 2 }}>
                  <Chip icon={<PictureAsPdfIcon />} label="PDF" size="small" color="error" variant="outlined" />
                  <Chip icon={<DescriptionIcon />} label="Word" size="small" color="primary" variant="outlined" />
                  <Chip icon={<TableChartIcon />} label="Excel" size="small" color="success" variant="outlined" />
                  <Chip icon={<SlideshowIcon />} label="PowerPoint" size="small" color="warning" variant="outlined" />
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  Tối đa {maxSize}MB • Hỗ trợ tất cả định dạng tài liệu
                </Typography>
                
                {uploading && (
                  <Fade in={true} timeout={300}>
                    <Box sx={{ mt: 3 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={uploadProgress} 
                        sx={{ 
                          mb: 1, 
                          height: 8, 
                          borderRadius: 4,
                          backgroundColor: 'rgba(76, 175, 80, 0.2)',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: 'success.main',
                            borderRadius: 4,
                          },
                        }}
                      />
                      <Typography variant="body2" color="success.main" fontWeight={500}>
                        {uploadProgress}% hoàn thành
                      </Typography>
                    </Box>
                  </Fade>
                )}
              </Box>
            </Zoom>
          </Paper>
        </Fade>
      ) : (
        <Zoom in={true} timeout={500}>
          <Paper
            elevation={4}
            sx={{
              border: '2px solid',
              borderColor: 'success.main',
              borderRadius: 3,
              p: 3,
              background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.05) 0%, rgba(76, 175, 80, 0.1) 100%)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(76, 175, 80, 0.2)',
              },
            }}
          >
            <Stack direction="row" alignItems="center" spacing={3}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: '#e3f2fd',
                  border: '2px solid #bbdefb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
              >
                {getFileIcon(uploadedFile.fileType)}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
                  <Typography 
                    variant="h6" 
                    fontWeight={600} 
                    color="primary.main"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '300px',
                      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                      fontSize: '1.1rem',
                    }}
                    title={uploadedFile.fileName}
                  >
                    {uploadedFile.fileName}
                  </Typography>
                  <Chip 
                    label="Đã upload" 
                    color="success" 
                    size="small" 
                    icon={<CheckCircleIcon sx={{ color: 'white' }} />}
                    sx={{ 
                      fontWeight: 600,
                      backgroundColor: '#4caf50',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: '#45a049',
                      }
                    }}
                  />
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  File đã được upload thành công và sẵn sàng sử dụng
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <Chip 
                    label={getFileTypeLabel(uploadedFile.fileType)} 
                    size="small" 
                    variant="filled"
                    sx={{
                      backgroundColor: '#e3f2fd',
                      color: '#1976d2',
                      fontWeight: 600,
                      border: '1px solid #bbdefb',
                      '&:hover': {
                        backgroundColor: '#bbdefb',
                        color: '#0d47a1',
                      }
                    }}
                  />
                  <Chip 
                    label="Sẵn sàng" 
                    size="small" 
                    variant="filled"
                    sx={{
                      backgroundColor: '#e8f5e8',
                      color: '#2e7d32',
                      fontWeight: 600,
                      border: '1px solid #c8e6c9',
                      '&:hover': {
                        backgroundColor: '#c8e6c9',
                        color: '#1b5e20',
                      }
                    }}
                  />
                </Stack>
              </Box>
              <Tooltip title="Xóa file">
                <IconButton 
                  onClick={handleRemoveFile}
                  color="error"
                  size="large"
                  disabled={disabled}
                  sx={{
                    backgroundColor: '#ffebee',
                    color: '#f44336',
                    border: '1px solid #ffcdd2',
                    '&:hover': {
                      backgroundColor: '#ffcdd2',
                      color: '#d32f2f',
                      transform: 'scale(1.1)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Paper>
        </Zoom>
      )}

      {error && (
        <Fade in={true} timeout={300}>
          <Alert 
            severity="error" 
            sx={{ 
              mt: 2, 
              borderRadius: 2,
              '& .MuiAlert-icon': {
                fontSize: '1.5rem',
              },
            }}
            action={
              <IconButton
                color="inherit"
                size="small"
                onClick={() => setError(null)}
              >
                <DeleteIcon fontSize="inherit" />
              </IconButton>
            }
          >
            <Typography variant="body2" fontWeight={500}>
              {error}
            </Typography>
          </Alert>
        </Fade>
      )}
    </Box>
  );
}
