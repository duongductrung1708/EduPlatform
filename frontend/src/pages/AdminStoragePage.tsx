import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Avatar,
  IconButton,
  Tooltip,
  Button,
  Chip,
  Divider,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import StorageIcon from '@mui/icons-material/Storage';
import FolderIcon from '@mui/icons-material/Folder';
import DescriptionIcon from '@mui/icons-material/Description';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import AdminLayout from '../components/AdminLayout';
import { useTheme } from '../contexts/ThemeContext';
import { DarkShimmerBox, ShimmerBox } from '../components/LoadingSkeleton';

interface StorageStats {
  total: number;
  used: number;
  files: number;
  folders: number;
}

interface StorageFile {
  id: string;
  name: string;
  type: 'document' | 'image' | 'video' | 'pdf' | 'other';
  size: string;
  owner: string;
  updatedAt: string;
}

const AdminStoragePage: React.FC = () => {
  const { darkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StorageStats>({
    total: 120,
    used: 68,
    files: 482,
    folders: 32,
  });
  const [files, setFiles] = useState<StorageFile[]>([]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setFiles([
        {
          id: '1',
          name: 'Bài giảng Toán nâng cao.pdf',
          type: 'pdf',
          size: '24 MB',
          owner: 'Nguyễn Văn A',
          updatedAt: '12/11/2025',
        },
        {
          id: '2',
          name: 'Video hướng dẫn lập trình.mp4',
          type: 'video',
          size: '145 MB',
          owner: 'Trần Thị B',
          updatedAt: '10/11/2025',
        },
        {
          id: '3',
          name: 'Ảnh minh họa bài học.png',
          type: 'image',
          size: '3.6 MB',
          owner: 'Lê Minh C',
          updatedAt: '09/11/2025',
        },
        {
          id: '4',
          name: 'Bảng điểm lớp 9A.xlsx',
          type: 'document',
          size: '1.4 MB',
          owner: 'Admin',
          updatedAt: '08/11/2025',
        },
        {
          id: '5',
          name: 'Tài liệu ôn thi.docx',
          type: 'document',
          size: '2.2 MB',
          owner: 'Nguyễn Văn A',
          updatedAt: '05/11/2025',
        },
      ]);
      setLoading(false);
    }, 800);

    return () => clearTimeout(timeout);
  }, []);

  const primaryTextColor = darkMode ? '#f8fafc' : '#102a43';
  const secondaryTextColor = darkMode ? 'rgba(248, 250, 252, 0.7)' : 'rgba(16, 42, 67, 0.64)';
  const cardBackground = darkMode
    ? 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)'
    : 'linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%)';
  const surfaceBorder = darkMode ? 'rgba(148, 163, 184, 0.24)' : 'rgba(239, 91, 91, 0.12)';

  const renderFileIcon = (type: StorageFile['type']) => {
    switch (type) {
      case 'document':
        return <DescriptionIcon />;
      case 'image':
        return <ImageIcon />;
      case 'video':
        return <VideoLibraryIcon />;
      case 'pdf':
        return <PictureAsPdfIcon />;
      default:
        return <FolderIcon />;
    }
  };

  const usedPercentage = Math.round((stats.used / stats.total) * 100);

  return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
            mb: 4,
          }}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                mb: 1,
                background: darkMode
                  ? 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)'
                  : 'linear-gradient(135deg, #EF5B5B 0%, #D94A4A 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Quản lý lưu trữ
            </Typography>
            <Typography variant="body1" sx={{ color: secondaryTextColor }}>
              Theo dõi dung lượng đã sử dụng, tệp gần đây và tối ưu hóa kho dữ liệu
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<CloudUploadIcon />}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              py: 1.5,
              background: 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #D94A4A 0%, #EF5B5B 100%)',
              },
            }}
          >
            Tải lên tệp
          </Button>
        </Box>

        {loading ? (
          <Box>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {[...Array(4)].map((_, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  {darkMode ? (
                    <DarkShimmerBox height="160px" width="100%" borderRadius="16px" />
                  ) : (
                    <ShimmerBox height="160px" width="100%" borderRadius="16px" />
                  )}
                </Grid>
              ))}
            </Grid>
            {darkMode ? (
              <DarkShimmerBox height="420px" width="100%" borderRadius="24px" />
            ) : (
              <ShimmerBox height="420px" width="100%" borderRadius="24px" />
            )}
          </Box>
        ) : (
          <>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card
                  sx={{
                    height: '100%',
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #2196F3 0%, #21CBF3 100%)',
                    color: 'white',
                    boxShadow: '0 8px 24px rgba(33, 150, 243, 0.3)',
                    border: 'none',
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Avatar
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.2)',
                        width: 56,
                        height: 56,
                        mb: 2,
                      }}
                    >
                      <StorageIcon sx={{ color: 'white' }} />
                    </Avatar>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      Tổng dung lượng
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {stats.total} GB
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card
                  sx={{
                    height: '100%',
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #FF9800 0%, #FFB74D 100%)',
                    color: 'white',
                    boxShadow: '0 8px 24px rgba(255, 152, 0, 0.3)',
                    border: 'none',
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Avatar
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.2)',
                        width: 56,
                        height: 56,
                        mb: 2,
                      }}
                    >
                      <FolderIcon sx={{ color: 'white' }} />
                    </Avatar>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      Đã sử dụng
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {stats.used} GB
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={usedPercentage}
                      sx={{
                        mt: 2,
                        height: 8,
                        borderRadius: 999,
                        backgroundColor: 'rgba(255,255,255,0.3)',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: 'white',
                        },
                      }}
                    />
                    <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                      {usedPercentage}% dung lượng
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card
                  sx={{
                    height: '100%',
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #4CAF50 0%, #81C784 100%)',
                    color: 'white',
                    boxShadow: '0 8px 24px rgba(76, 175, 80, 0.3)',
                    border: 'none',
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Avatar
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.2)',
                        width: 56,
                        height: 56,
                        mb: 2,
                      }}
                    >
                      <DescriptionIcon sx={{ color: 'white' }} />
                    </Avatar>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      Tổng số tệp
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {stats.files}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card
                  sx={{
                    height: '100%',
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #9C27B0 0%, #BA68C8 100%)',
                    color: 'white',
                    boxShadow: '0 8px 24px rgba(156, 39, 176, 0.3)',
                    border: 'none',
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Avatar
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.2)',
                        width: 56,
                        height: 56,
                        mb: 2,
                      }}
                    >
                      <FolderIcon sx={{ color: 'white' }} />
                    </Avatar>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      Số thư mục
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {stats.folders}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Paper
              elevation={0}
              sx={{
                borderRadius: 3,
                background: cardBackground,
                border: `1px solid ${surfaceBorder}`,
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  p: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 2,
                }}
              >
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: primaryTextColor }}>
                    Tệp gần đây
                  </Typography>
                  <Typography variant="body2" sx={{ color: secondaryTextColor }}>
                    Quản lý và theo dõi những tệp vừa được tải lên hệ thống
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    color="inherit"
                    startIcon={<DeleteOutlineIcon />}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      borderColor: surfaceBorder,
                      color: primaryTextColor,
                      '&:hover': {
                        borderColor: '#EF5B5B',
                        backgroundColor: darkMode
                          ? 'rgba(239, 91, 91, 0.1)'
                          : 'rgba(239, 91, 91, 0.08)',
                      },
                    }}
                  >
                    Dọn dẹp
                  </Button>
                </Box>
              </Box>
              <Divider sx={{ borderColor: surfaceBorder }} />
              <Table>
                <TableHead>
                  <TableRow
                    sx={{
                      backgroundColor: darkMode
                        ? 'rgba(148, 163, 184, 0.1)'
                        : 'rgba(239, 91, 91, 0.05)',
                    }}
                  >
                    <TableCell sx={{ fontWeight: 600, color: primaryTextColor }}>Tên tệp</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: primaryTextColor }}>Loại</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: primaryTextColor }}>Dung lượng</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: primaryTextColor }}>Người tải lên</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: primaryTextColor }}>
                      Cập nhật gần nhất
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: primaryTextColor }}>
                      Thao tác
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {files.map((file) => (
                    <TableRow
                      key={file.id}
                      sx={{
                        '&:hover': {
                          backgroundColor: darkMode
                            ? 'rgba(239, 91, 91, 0.1)'
                            : 'rgba(239, 91, 91, 0.05)',
                        },
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar
                            sx={{
                              bgcolor: '#EF5B5B',
                              color: 'white',
                              width: 42,
                              height: 42,
                            }}
                          >
                            {renderFileIcon(file.type)}
                          </Avatar>
                          <Box>
                            <Typography
                              variant="subtitle2"
                              sx={{ fontWeight: 600, color: primaryTextColor }}
                            >
                              {file.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: secondaryTextColor }}>
                              ID: {file.id.padStart(4, '0')}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={
                            file.type === 'document'
                              ? 'Tài liệu'
                              : file.type === 'image'
                              ? 'Hình ảnh'
                              : file.type === 'video'
                              ? 'Video'
                              : file.type === 'pdf'
                              ? 'PDF'
                              : 'Khác'
                          }
                          color="default"
                          size="small"
                          sx={{
                            color: darkMode ? '#f8fafc' : '#102a43',
                            backgroundColor: darkMode ? 'rgba(148,163,184,0.18)' : 'rgba(239,91,91,0.12)',
                            borderRadius: 999,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: primaryTextColor }}>
                          {file.size}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: primaryTextColor }}>
                          {file.owner}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: primaryTextColor }}>
                          {file.updatedAt}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Tải xuống">
                          <IconButton
                            size="small"
                            sx={{
                              color: secondaryTextColor,
                              '&:hover': {
                                color: '#EF5B5B',
                              },
                            }}
                          >
                            <CloudUploadIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Xóa tệp">
                          <IconButton
                            size="small"
                            sx={{
                              color: secondaryTextColor,
                              '&:hover': {
                                color: '#EF5B5B',
                              },
                            }}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </>
        )}
      </Box>
    </AdminLayout>
  );
};

export default AdminStoragePage;


