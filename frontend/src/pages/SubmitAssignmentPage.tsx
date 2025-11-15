import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Card,
  CardContent,
  Stack,
  IconButton,
  Tooltip,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { assignmentsApi } from '../api/assignments';
import { uploadsApi } from '../api/uploads';
import { uploadApi } from '../api/upload';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BackButton from '../components/BackButton';
import Breadcrumb from '../components/Breadcrumb';

const SubmitAssignmentPage: React.FC = () => {
  const { classroomId, assignmentId } = useParams();
  const [contentText, setContentText] = useState('');
  const [attachments, setAttachments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [assignment, setAssignment] = useState<any | null>(null);
  const [existingSubmission, setExistingSubmission] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      if (!classroomId || !assignmentId) return;
      try {
        const [assignmentData, submission] = await Promise.all([
          assignmentsApi.getById(classroomId, assignmentId),
          assignmentsApi.getMySubmission(classroomId, assignmentId).catch(() => null),
        ]);
        setAssignment(assignmentData);
        if (submission) {
          setExistingSubmission(submission);
          setContentText(submission.contentText || '');
          setAttachments(submission.attachments || []);
        }
      } catch (e: unknown) {
        const err = e as { response?: { data?: { message?: string } } };
        setError(err?.response?.data?.message || 'Không thể tải thông tin bài tập');
      }
    })();
  }, [classroomId, assignmentId]);

  const onFiles = async (files: FileList | null) => {
    if (!files) return;
    setUploading(true);
    setError(null);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        try {
          const res = await uploadsApi.uploadFile(file);
          const type = (file.type || '').split('/')[0] || 'file';
          return {
            url: res.url,
            type,
            name: res.filename || file.name,
            size: res.size || file.size,
          };
        } catch (e) {
          throw new Error(`Upload thất bại cho ${file.name}`);
        }
      });
      const uploadedFiles = await Promise.all(uploadPromises);
      setAttachments((prev) => [...prev, ...uploadedFiles]);
    } catch (e: unknown) {
      const err = e as { message?: string; response?: { data?: { message?: string } } };
      setError(err?.message || err?.response?.data?.message || 'Upload thất bại');
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = async (index: number) => {
    const attachment = attachments[index];
    if (!attachment) return;

    // Xóa file khỏi S3 hoặc local storage
    try {
      if (attachment.url) {
        const url = attachment.url;
        let keyOrFilename: string | null = null;

        // Kiểm tra nếu là S3 URL
        if (/\.s3[.-].*\.amazonaws\.com\//.test(url)) {
          try {
            const parsed = new URL(url);
            // Extract S3 key từ pathname (bỏ dấu / đầu tiên)
            keyOrFilename = decodeURIComponent((parsed.pathname || '').replace(/^\//, ''));
          } catch (e) {
            console.warn('Lỗi khi parse S3 URL:', e);
          }
        } else {
          // Local file - extract filename từ URL
          try {
            const u = new URL(url, window.location.origin);
            const parts = (u.pathname || '').split('/');
            const idx = parts.findIndex((p) => p === 'uploads' || p === 'file');
            keyOrFilename = idx >= 0 ? parts[parts.length - 1] : null;
          } catch (e) {
            console.warn('Lỗi khi parse local URL:', e);
          }
        }

        // Xóa file nếu có key/filename (endpoint /api/uploads/file/:storedFilename đã được cập nhật để hỗ trợ cả S3 và local)
        if (keyOrFilename) {
          await uploadsApi.deleteStoredFile(keyOrFilename).catch((e) => {
            console.warn('Không thể xóa file:', e);
          });
        }
      }
    } catch (e) {
      // Nếu không xóa được file, vẫn xóa khỏi danh sách
      console.warn('Lỗi khi xóa file:', e);
    }

    // Xóa khỏi danh sách attachments
    setAttachments((prev) => prev.filter((_, i) => i !== index));
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
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err?.response?.data?.message || 'Không thể nộp bài');
    } finally {
      setLoading(false);
    }
  };

  const formatSize = (size?: number) => {
    if (!size || size <= 0) return '';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${Math.round(size / 102.4) / 10} KB`;
    return `${Math.round(size / 104857.6) / 10} MB`;
  };

  return (
    <Container maxWidth="md" sx={{ mt: 3, mb: 4 }}>
      <BackButton to={`/classes/${classroomId}`} />
      <Breadcrumb
        items={[
          { label: 'Trang chủ', path: '/dashboard' },
          { label: 'Lớp học', path: '/dashboard' },
          { label: assignment?.title || 'Nộp bài tập', current: true },
        ]}
      />

      {assignment && (
        <Card
          sx={{
            mb: 3,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              background: 'linear-gradient(135deg, #FFA726 0%, #FB8C00 100%)',
              color: 'white',
              p: 2.5,
            }}
          >
            <Box display="flex" alignItems="center" gap={1.5}>
              <AssignmentIcon sx={{ fontSize: 32, color: 'white' }} />
              <Box flex={1}>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: 'white',
                    textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                    mb: 0.5,
                  }}
                >
                  {assignment.title}
                </Typography>
                {assignment.description && (
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                    {assignment.description}
                  </Typography>
                )}
              </Box>
            </Box>
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 2 }}>
              {assignment.dueDate && (
                <Chip
                  label={`Hạn nộp: ${new Date(assignment.dueDate).toLocaleString('vi-VN')}`}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.35)',
                    color: 'white',
                    fontWeight: 600,
                    '& .MuiChip-label': {
                      color: 'white',
                    },
                  }}
                />
              )}
              {assignment.totalPoints && (
                <Chip
                  label={`${assignment.totalPoints} điểm`}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.35)',
                    color: 'white',
                    fontWeight: 600,
                    '& .MuiChip-label': {
                      color: 'white',
                    },
                  }}
                />
              )}
              {existingSubmission && (
                <Chip
                  label="Đã nộp"
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.9)',
                    color: 'success.main',
                    fontWeight: 700,
                  }}
                />
              )}
            </Stack>
          </Box>
        </Card>
      )}

      <Card
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: 3,
        }}
      >
        <Box
          sx={{
            background: 'linear-gradient(135deg, #42A5F5 0%, #1E88E5 100%)',
            color: 'white',
            p: 2.5,
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: 'white',
              textShadow: '0 1px 2px rgba(0,0,0,0.1)',
            }}
          >
            {existingSubmission ? 'Cập nhật bài nộp' : 'Nộp bài tập'}
          </Typography>
        </Box>

        <CardContent sx={{ p: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              label="Nội dung bài làm"
              fullWidth
              multiline
              minRows={6}
              value={contentText}
              onChange={(e) => setContentText(e.target.value)}
              sx={{ mb: 3 }}
              placeholder="Nhập nội dung bài làm của bạn..."
            />

            {/* File Upload Area */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
                Tài liệu đính kèm
              </Typography>

              {/* Upload Area */}
              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  textAlign: 'center',
                  border: '2px dashed',
                  borderColor: 'divider',
                  bgcolor: 'action.hover',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'action.selected',
                  },
                }}
                onClick={() => document.getElementById('file-upload-input')?.click()}
              >
                <input
                  id="file-upload-input"
                  type="file"
                  hidden
                  multiple
                  onChange={(e) => onFiles(e.target.files)}
                  disabled={uploading}
                />
                {uploading ? (
                  <Box>
                    <CircularProgress size={40} sx={{ mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      Đang tải lên...
                    </Typography>
                  </Box>
                ) : (
                  <Box>
                    <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="body1" sx={{ mb: 0.5, fontWeight: 500 }}>
                      Chọn tệp để tải lên
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Hoặc kéo thả tệp vào đây
                    </Typography>
                  </Box>
                )}
              </Paper>

              {/* Attachments List */}
              {attachments.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Đã tải lên ({attachments.length} tệp):
                  </Typography>
                  <List dense>
                    {attachments.map((attachment, index) => (
                      <React.Fragment key={index}>
                        <ListItem
                          sx={{
                            bgcolor: 'background.paper',
                            borderRadius: 1,
                            mb: 0.5,
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                          secondaryAction={
                            <Box display="flex" gap={0.5}>
                              {attachment.url && (
                                <Tooltip title="Tải xuống">
                                  <IconButton
                                    edge="end"
                                    size="small"
                                    component="a"
                                    href={attachment.url}
                                    download
                                    sx={{ color: 'primary.main' }}
                                  >
                                    <DownloadIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                              <Tooltip title="Xóa">
                                <IconButton
                                  edge="end"
                                  size="small"
                                  onClick={() => removeAttachment(index)}
                                  color="error"
                                >
                                  <CloseIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          }
                        >
                          <ListItemIcon>
                            <AttachFileIcon color="primary" />
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {attachment.name || 'Tệp đính kèm'}
                              </Typography>
                            }
                            secondary={
                              <Typography variant="caption" color="text.secondary">
                                {attachment.type}{' '}
                                {attachment.size
                                  ? `· ${(attachment.size / 1024).toFixed(1)} KB`
                                  : ''}
                              </Typography>
                            }
                          />
                        </ListItem>
                      </React.Fragment>
                    ))}
                  </List>
                </Box>
              )}
            </Box>

            <Box display="flex" justifyContent="flex-end" gap={2} sx={{ mt: 2 }}>
              <Button
                component={RouterLink}
                to={`/classes/${classroomId}`}
                variant="outlined"
                disabled={loading}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading || uploading}
                sx={{
                  background: 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
                  },
                  fontWeight: 600,
                  minWidth: 120,
                }}
              >
                {loading ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
                    Đang nộp...
                  </>
                ) : existingSubmission ? (
                  'Cập nhật'
                ) : (
                  'Nộp bài'
                )}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default SubmitAssignmentPage;
