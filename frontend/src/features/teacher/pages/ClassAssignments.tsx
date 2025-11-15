import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Grid,
  Card,
  CardContent,
  Chip,
  Breadcrumbs,
  Link as MuiLink,
  IconButton,
  Stack,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloseIcon from '@mui/icons-material/Close';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import GradeIcon from '@mui/icons-material/Grade';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import DownloadIcon from '@mui/icons-material/Download';
import { assignmentsApi, AssignmentItem, AssignmentAttachment } from '../../../api/assignments';
import { uploadsApi } from '../../../api/uploads';
import { classesApi } from '../../../api/admin';
import { coursesApi, CourseItem } from '../../../api/courses';
import { useAuth } from '../../../contexts/AuthContext';
import { AssignmentCardSkeleton } from '../../../components/LoadingSkeleton';

export default function ClassAssignments() {
  const { id } = useParams();
  const classroomId = id as string;
  const navigate = useNavigate();
  const { user } = useAuth();

  const [items, setItems] = useState<AssignmentItem[]>([]);
  const [showOverdue, setShowOverdue] = useState(false);
  const [showSubmitted, setShowSubmitted] = useState<'all' | 'submitted' | 'not_submitted'>('all');
  const [mySubmissions, setMySubmissions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<AssignmentItem | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<AssignmentAttachment[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [totalPoints, setTotalPoints] = useState<number | ''>('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [classroomInfo, setClassroomInfo] = useState<any | null>(null);
  const [courseInfo, setCourseInfo] = useState<CourseItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchAssignments = async () => {
    if (!classroomId) return;
    try {
      setLoading(true);
      setError(null);
      const list = await assignmentsApi.list(classroomId);
      setItems(list);
      // For students, fetch my-submission status per assignment
      if (user?.role === 'student') {
        const map: Record<string, boolean> = {};
        await Promise.all(
          list.map(async (a) => {
            try {
              const sub = await assignmentsApi.getMySubmission(classroomId, a._id);
              map[a._id] = !!sub;
            } catch {}
          }),
        );
        setMySubmissions(map);
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Không thể tải bài tập');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
    (async () => {
      try {
        if (classroomId) {
          const info = await classesApi.getById(classroomId);
          setClassroomInfo(info);
          const courseId = typeof info.courseId === 'object' ? info.courseId._id : info.courseId;
          if (courseId) {
            try {
              const c = await coursesApi.getById(courseId);
              setCourseInfo(c);
            } catch {}
          }
        }
      } catch {}
    })();
  }, [classroomId]);

  const onFiles = async (files: FileList | null) => {
    if (!files) return;
    setUploading(true);
    setError(null);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        try {
          const res = await uploadsApi.uploadFile(file);
          const type = (file.type || '').split('/')[0] || 'file';
          return { url: res.url, type, name: res.filename, size: res.size };
        } catch (e) {
          throw new Error(`Upload thất bại cho ${file.name}`);
        }
      });
      const uploadedFiles = await Promise.all(uploadPromises);
      setAttachments((prev) => [...prev, ...uploadedFiles]);
    } catch (e: any) {
      setError(e?.message || 'Upload thất bại');
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const openEditDialog = (assignment: AssignmentItem) => {
    setEditingAssignment(assignment);
    setTitle(assignment.title);
    setDescription(assignment.description || '');
    setAttachments(assignment.attachments || []);
    setDueDate(assignment.dueDate ? new Date(assignment.dueDate).toISOString().slice(0, 16) : '');
    setTotalPoints(assignment.totalPoints || '');
    setOpen(true);
  };

  const closeDialog = () => {
    setOpen(false);
    setEditingAssignment(null);
    setTitle('');
    setDescription('');
    setAttachments([]);
    setDueDate('');
    setTotalPoints('');
    setError(null);
  };

  const createAssignment = async () => {
    if (!classroomId || !title.trim()) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      if (editingAssignment) {
        await assignmentsApi.update(classroomId, editingAssignment._id, {
          title: title.trim(),
          description,
          attachments,
          dueDate: dueDate || undefined,
          totalPoints: totalPoints === '' ? undefined : Number(totalPoints),
        });
        setSuccess('Đã cập nhật bài tập');
      } else {
        await assignmentsApi.create(classroomId, {
          title: title.trim(),
          description,
          attachments,
          dueDate: dueDate || undefined,
          totalPoints: totalPoints === '' ? undefined : Number(totalPoints),
        });
        setSuccess('Đã tạo bài tập');
      }
      closeDialog();
      fetchAssignments();
    } catch (e: any) {
      setError(
        e?.response?.data?.message ||
          (editingAssignment ? 'Không thể cập nhật bài tập' : 'Không thể tạo bài tập'),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (assignmentId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài tập này?')) return;
    setDeletingId(assignmentId);
    setError(null);
    try {
      await assignmentsApi.delete(classroomId, assignmentId);
      setSuccess('Đã xóa bài tập');
      fetchAssignments();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Không thể xóa bài tập');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Box>
          {classroomInfo && (
            <Breadcrumbs sx={{ mb: 0.5 }}>
              <MuiLink
                component={RouterLink}
                to="/teacher/classrooms"
                underline="hover"
                color="inherit"
              >
                Lớp của tôi
              </MuiLink>
              {courseInfo && (
                <MuiLink
                  component={RouterLink}
                  to={`/courses/${courseInfo._id}`}
                  underline="hover"
                  color="inherit"
                >
                  {courseInfo.title}
                </MuiLink>
              )}
              <Typography color="text.secondary">{classroomInfo.title || 'Lớp'}</Typography>
              <Typography color="text.primary">Bài tập</Typography>
            </Breadcrumbs>
          )}
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            Bài tập
          </Typography>
          {classroomInfo && (
            <Box display="flex" alignItems="center" gap={1} sx={{ mt: 0.5 }}>
              {courseInfo && (
                <Chip
                  size="small"
                  label={`Khóa học: ${courseInfo.title} (${courseInfo.category || 'Khác'} - ${courseInfo.level || 'N/A'})`}
                />
              )}
              {classroomInfo.schedule?.startDate && (
                <Chip
                  size="small"
                  label={`Bắt đầu: ${new Date(classroomInfo.schedule.startDate).toLocaleDateString()}`}
                />
              )}
            </Box>
          )}
        </Box>
        <Button variant="contained" onClick={() => setOpen(true)}>
          Tạo bài tập
        </Button>
      </Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Box display="flex" gap={2} sx={{ mb: 2 }}>
        <Button
          variant={showOverdue ? 'contained' : 'outlined'}
          onClick={() => setShowOverdue((v) => !v)}
        >
          Chỉ hiển thị quá hạn
        </Button>
        {user?.role === 'student' && (
          <Box display="flex" gap={1}>
            <Button
              variant={showSubmitted === 'all' ? 'contained' : 'outlined'}
              onClick={() => setShowSubmitted('all')}
            >
              Tất cả
            </Button>
            <Button
              variant={showSubmitted === 'not_submitted' ? 'contained' : 'outlined'}
              onClick={() => setShowSubmitted('not_submitted')}
            >
              Chưa nộp
            </Button>
            <Button
              variant={showSubmitted === 'submitted' ? 'contained' : 'outlined'}
              onClick={() => setShowSubmitted('submitted')}
            >
              Đã nộp
            </Button>
          </Box>
        )}
      </Box>

      {loading ? (
        <AssignmentCardSkeleton count={6} />
      ) : (
        <Grid container spacing={2}>
          {items
            .filter((it) => {
              const now = Date.now();
              const isOverdue = !!it.dueDate && new Date(it.dueDate).getTime() < now;
              if (showOverdue && !isOverdue) return false;
              if (user?.role === 'student') {
                const submitted = !!mySubmissions[it._id];
                if (showSubmitted === 'submitted' && !submitted) return false;
                if (showSubmitted === 'not_submitted' && submitted) return false;
              }
              return true;
            })
            .map((it) => {
              const now = Date.now();
              const isOverdue = !!it.dueDate && new Date(it.dueDate).getTime() < now;
              const submitted = user?.role === 'student' ? !!mySubmissions[it._id] : false;

              return (
                <Grid item xs={12} md={6} key={it._id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.3s ease',
                      border: isOverdue ? '2px solid' : '1px solid',
                      borderColor: isOverdue ? 'error.main' : 'divider',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 6,
                      },
                    }}
                  >
                    {/* Header with gradient */}
                    <Box
                      sx={{
                        background: isOverdue
                          ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)'
                          : 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
                        color: 'white',
                        p: 2,
                        pb: 1.5,
                      }}
                    >
                      <Box
                        display="flex"
                        alignItems="flex-start"
                        justifyContent="space-between"
                        sx={{ mb: 1 }}
                      >
                        <Box display="flex" alignItems="center" gap={1} flex={1}>
                          <AssignmentIcon sx={{ fontSize: 28 }} />
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 700,
                              color: 'white',
                              flex: 1,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {it.title}
                          </Typography>
                        </Box>
                        {user?.role === 'teacher' && (
                          <Box display="flex" gap={0.5} ml={1}>
                            <Tooltip title="Chỉnh sửa">
                              <IconButton
                                size="small"
                                sx={{
                                  color: 'white',
                                  bgcolor: 'rgba(255,255,255,0.2)',
                                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                                }}
                                onClick={() => openEditDialog(it)}
                                disabled={deletingId === it._id}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Xóa">
                              <IconButton
                                size="small"
                                sx={{
                                  color: 'white',
                                  bgcolor: 'rgba(255,255,255,0.2)',
                                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                                }}
                                onClick={() => handleDelete(it._id)}
                                disabled={deletingId === it._id}
                              >
                                {deletingId === it._id ? (
                                  <CircularProgress size={16} sx={{ color: 'white' }} />
                                ) : (
                                  <DeleteIcon fontSize="small" />
                                )}
                              </IconButton>
                            </Tooltip>
                          </Box>
                        )}
                      </Box>
                      {isOverdue && (
                        <Chip
                          label="Quá hạn"
                          size="small"
                          sx={{
                            bgcolor: 'rgba(255,255,255,0.3)',
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '0.7rem',
                          }}
                        />
                      )}
                    </Box>

                    <CardContent
                      sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2.5 }}
                    >
                      {/* Description */}
                      {it.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mb: 2,
                            minHeight: '3em',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: 1.6,
                          }}
                        >
                          {it.description}
                        </Typography>
                      )}

                      {/* Info chips */}
                      <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
                        {it.dueDate && (
                          <Chip
                            icon={<AccessTimeIcon />}
                            label={`Hạn nộp: ${new Date(it.dueDate).toLocaleDateString('vi-VN', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}`}
                            size="small"
                            variant="outlined"
                            color={isOverdue ? 'error' : 'default'}
                            sx={{ fontSize: '0.75rem' }}
                          />
                        )}
                        {it.totalPoints && (
                          <Chip
                            icon={<GradeIcon />}
                            label={`${it.totalPoints} điểm`}
                            size="small"
                            variant="outlined"
                            color="primary"
                            sx={{ fontSize: '0.75rem' }}
                          />
                        )}
                        {user?.role === 'student' && (
                          <Chip
                            icon={submitted ? <CheckCircleIcon /> : <PendingIcon />}
                            label={submitted ? 'Đã nộp' : 'Chưa nộp'}
                            size="small"
                            color={submitted ? 'success' : 'warning'}
                            variant="outlined"
                            sx={{ fontSize: '0.75rem' }}
                          />
                        )}
                      </Stack>

                      {/* Attachments */}
                      {it.attachments && it.attachments.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ mb: 1, display: 'block', fontWeight: 600 }}
                          >
                            Tài liệu đính kèm ({it.attachments.length}):
                          </Typography>
                          <Stack spacing={0.5}>
                            {it.attachments.map((a, idx) => (
                              <Paper
                                key={idx}
                                variant="outlined"
                                sx={{
                                  p: 1,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                  transition: 'all 0.2s',
                                  '&:hover': {
                                    bgcolor: 'action.hover',
                                    borderColor: 'primary.main',
                                  },
                                }}
                              >
                                <AttachFileIcon fontSize="small" color="primary" />
                                <Typography
                                  variant="body2"
                                  component="a"
                                  href={a.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  sx={{
                                    flex: 1,
                                    textDecoration: 'none',
                                    color: 'primary.main',
                                    fontWeight: 500,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    '&:hover': {
                                      textDecoration: 'underline',
                                    },
                                  }}
                                >
                                  {a.name || a.url}
                                </Typography>
                                <IconButton
                                  size="small"
                                  component="a"
                                  href={a.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  sx={{ p: 0.5 }}
                                >
                                  <DownloadIcon fontSize="small" />
                                </IconButton>
                              </Paper>
                            ))}
                          </Stack>
                        </Box>
                      )}

                      {/* Action buttons */}
                      <Box sx={{ mt: 'auto', pt: 2 }}>
                        <Divider sx={{ mb: 2 }} />
                        {user?.role === 'student' && (
                          <Button
                            fullWidth
                            variant="contained"
                            onClick={() =>
                              navigate(`/classes/${classroomId}/assignments/${it._id}/submit`)
                            }
                            disabled={submitted}
                            sx={{
                              background: submitted
                                ? 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)'
                                : 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
                              '&:hover': {
                                background: submitted
                                  ? 'linear-gradient(135deg, #45a049 0%, #3d8b40 100%)'
                                  : 'linear-gradient(135deg, #D94A4A 0%, #EF5B5B 100%)',
                              },
                            }}
                          >
                            {submitted ? 'Đã nộp bài' : 'Nộp bài'}
                          </Button>
                        )}
                        {user?.role === 'teacher' && (
                          <Button
                            fullWidth
                            variant="contained"
                            onClick={() =>
                              navigate(
                                `/teacher/classes/${classroomId}/assignments/${it._id}/submissions`,
                              )
                            }
                            sx={{
                              background: 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
                              '&:hover': {
                                background: 'linear-gradient(135deg, #D94A4A 0%, #EF5B5B 100%)',
                              },
                            }}
                          >
                            Chấm bài
                          </Button>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
        </Grid>
      )}

      <Dialog open={open} onClose={closeDialog} fullWidth maxWidth="md">
        <DialogTitle>{editingAssignment ? 'Chỉnh sửa bài tập' : 'Tạo bài tập mới'}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Tiêu đề *"
              fullWidth
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề bài tập"
            />
            <TextField
              label="Mô tả"
              fullWidth
              multiline
              minRows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập mô tả chi tiết về bài tập..."
            />
            <Box display="flex" gap={2}>
              <TextField
                label="Hạn nộp"
                type="datetime-local"
                fullWidth
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Thang điểm"
                type="number"
                fullWidth
                value={totalPoints}
                onChange={(e) =>
                  setTotalPoints(e.target.value === '' ? '' : Number(e.target.value))
                }
                inputProps={{ min: 0, step: 0.5 }}
                placeholder="100"
              />
            </Box>

            {/* File Upload Section */}
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
                            <IconButton
                              edge="end"
                              size="small"
                              onClick={() => removeAttachment(index)}
                              color="error"
                            >
                              <CloseIcon fontSize="small" />
                            </IconButton>
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
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button onClick={closeDialog} disabled={saving}>
            Hủy
          </Button>
          <Button
            variant="contained"
            disabled={saving || !title.trim() || uploading}
            onClick={createAssignment}
            sx={{
              background: 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #D94A4A 0%, #EF5B5B 100%)',
              },
            }}
          >
            {saving ? 'Đang lưu...' : editingAssignment ? 'Cập nhật' : 'Tạo bài tập'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
