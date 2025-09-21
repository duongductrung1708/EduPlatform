import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
  Alert,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  HelpOutline,
  School,
  Class,
  Assignment,
  People,
  TrendingUp,
  EmojiEvents,
  Dashboard,
  Close,
  ExpandMore,
  CheckCircle,
  PlayArrow,
  Description,
  Quiz,
  VideoLibrary,
  TouchApp,
  Download,
  AttachFile,
  Star,
  GroupAdd,
  Public,
  FilterList,
  Search,
  Bookmark,
  Delete,
  Edit,
  Add,
  ContentCopy,
  Home
} from '@mui/icons-material';

interface HelpGuideProps {
  open: boolean;
  onClose: () => void;
  userRole: 'teacher' | 'student';
}

export default function HelpGuide({ open, onClose, userRole }: HelpGuideProps) {
  const [activeStep, setActiveStep] = useState(0);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
  };

  const teacherSteps = [
    {
      label: 'Tổng quan hệ thống',
      content: (
        <Box>
          <Typography variant="h6" gutterBottom sx={{ color: '#EF5B5B', fontWeight: 600 }}>
            Chào mừng đến với EduLearn - Hệ thống quản lý lớp học
          </Typography>
          <Typography variant="body1" paragraph>
            EduLearn là nền tảng giáo dục trực tuyến giúp giáo viên quản lý lớp học, tạo bài giảng, 
            giao bài tập và theo dõi tiến độ học tập của học sinh một cách hiệu quả.
          </Typography>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Mẹo:</strong> Sử dụng thanh tìm kiếm ở header để nhanh chóng tìm kiếm lớp học hoặc nội dung.
            </Typography>
          </Alert>

          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Các tính năng chính:
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon><Dashboard color="primary" /></ListItemIcon>
                <ListItemText 
                  primary="Tổng quan" 
                  secondary="Xem thống kê và thông tin tổng quan về lớp học"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><Class color="primary" /></ListItemIcon>
                <ListItemText 
                  primary="Quản lý lớp học" 
                  secondary="Tạo, chỉnh sửa và quản lý các lớp học"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><School color="primary" /></ListItemIcon>
                <ListItemText 
                  primary="Môn học" 
                  secondary="Tạo và quản lý nội dung môn học"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><Assignment color="primary" /></ListItemIcon>
                <ListItemText 
                  primary="Bài tập" 
                  secondary="Giao bài tập và chấm điểm học sinh"
                />
              </ListItem>
            </List>
          </Box>
        </Box>
      )
    },
    {
      label: 'Quản lý lớp học',
      content: (
        <Box>
          <Typography variant="h6" gutterBottom sx={{ color: '#EF5B5B', fontWeight: 600 }}>
            Hướng dẫn quản lý lớp học
          </Typography>
          
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">Tạo lớp học mới</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                <ListItem>
                  <ListItemIcon><Add color="success" /></ListItemIcon>
                  <ListItemText 
                    primary="Bước 1: Nhấn nút 'Tạo lớp'" 
                    secondary="Tìm nút 'Tạo lớp' màu đỏ ở góc trên bên phải"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Edit color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Bước 2: Nhập thông tin lớp" 
                    secondary="Điền tên lớp và chọn môn học từ danh sách"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                  <ListItemText 
                    primary="Bước 3: Xác nhận tạo" 
                    secondary="Nhấn 'Tạo lớp' để hoàn tất"
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">Quản lý học sinh</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                <ListItem>
                  <ListItemIcon><GroupAdd color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Thêm học sinh" 
                    secondary="Nhấn 'Quản lý' → 'Thêm học sinh' → Nhập email học sinh"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><ContentCopy color="info" /></ListItemIcon>
                  <ListItemText 
                    primary="Mã mời lớp" 
                    secondary="Sao chép mã mời để học sinh có thể tham gia lớp"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Delete color="error" /></ListItemIcon>
                  <ListItemText 
                    primary="Xóa học sinh" 
                    secondary="Trong danh sách học sinh, nhấn icon xóa bên cạnh tên học sinh"
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">Các thao tác khác</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                <ListItem>
                  <ListItemIcon><Edit color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Chỉnh sửa lớp" 
                    secondary="Nhấn 'Chỉnh sửa' để thay đổi tên lớp hoặc môn học"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Delete color="error" /></ListItemIcon>
                  <ListItemText 
                    primary="Xóa lớp học" 
                    secondary="Nhấn 'Xóa' → Xác nhận xóa (hành động không thể hoàn tác)"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><PlayArrow color="success" /></ListItemIcon>
                  <ListItemText 
                    primary="Bài giảng" 
                    secondary="Nhấn 'Bài giảng' để quản lý nội dung học tập"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Assignment color="warning" /></ListItemIcon>
                  <ListItemText 
                    primary="Bài tập" 
                    secondary="Nhấn 'Bài tập' để giao và chấm bài tập"
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>
        </Box>
      )
    },
    {
      label: 'Quản lý môn học',
      content: (
        <Box>
          <Typography variant="h6" gutterBottom sx={{ color: '#EF5B5B', fontWeight: 600 }}>
            Hướng dẫn quản lý môn học
          </Typography>
          
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">Môn học công khai</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                <ListItem>
                  <ListItemIcon><Public color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Xem môn học công khai" 
                    secondary="Truy cập 'Môn học của tôi' → 'Môn học công khai'"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Search color="info" /></ListItemIcon>
                  <ListItemText 
                    primary="Tìm kiếm môn học" 
                    secondary="Sử dụng thanh tìm kiếm để tìm môn học theo tên"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><FilterList color="info" /></ListItemIcon>
                  <ListItemText 
                    primary="Lọc môn học" 
                    secondary="Sử dụng bộ lọc theo danh mục, cấp độ và sắp xếp"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Bookmark color="warning" /></ListItemIcon>
                  <ListItemText 
                    primary="Đánh dấu yêu thích" 
                    secondary="Nhấn icon trái tim để đánh dấu môn học yêu thích"
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">Tạo môn học mới</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                <ListItem>
                  <ListItemIcon><Add color="success" /></ListItemIcon>
                  <ListItemText 
                    primary="Bước 1: Nhấn 'Tạo môn học'" 
                    secondary="Tìm nút 'Tạo môn học' ở trang môn học"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Edit color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Bước 2: Điền thông tin" 
                    secondary="Nhập tên, mô tả, danh mục và cấp độ môn học"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><School color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Bước 3: Tạo nội dung" 
                    secondary="Thêm các module và bài học cho môn học"
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Alert severity="success" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Lưu ý:</strong> Môn học công khai sẽ hiển thị cho tất cả học sinh và giáo viên khác. 
              Hãy đảm bảo nội dung chất lượng và phù hợp.
            </Typography>
          </Alert>
        </Box>
      )
    },
    {
      label: 'Tạo nội dung học tập',
      content: (
        <Box>
          <Typography variant="h6" gutterBottom sx={{ color: '#EF5B5B', fontWeight: 600 }}>
            Hướng dẫn tạo nội dung học tập
          </Typography>
          
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">Cấu trúc môn học</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                <ListItem>
                  <ListItemIcon><School color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Môn học" 
                    secondary="Cấp độ cao nhất, chứa nhiều module"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Class color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Module (Tập)" 
                    secondary="Chia nhỏ môn học thành các phần, ví dụ: Tập 1, Tập 2"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><PlayArrow color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Bài học" 
                    secondary="Đơn vị nhỏ nhất, chứa nội dung cụ thể"
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">Các loại bài học</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                <ListItem>
                  <ListItemIcon><VideoLibrary color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Video" 
                    secondary="Bài học dạng video, học sinh xem và học"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Description color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Tài liệu" 
                    secondary="Bài học dạng tài liệu, học sinh có thể tải về"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Quiz color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Quiz" 
                    secondary="Bài kiểm tra trắc nghiệm"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><TouchApp color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Tương tác" 
                    secondary="Bài học có tính tương tác cao"
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">Tạo bài học</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                <ListItem>
                  <ListItemIcon><Add color="success" /></ListItemIcon>
                  <ListItemText 
                    primary="Bước 1: Chọn module" 
                    secondary="Vào môn học → Chọn module cần thêm bài học"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Edit color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Bước 2: Thêm bài học" 
                    secondary="Nhấn 'Thêm bài học' → Chọn loại bài học"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><AttachFile color="info" /></ListItemIcon>
                  <ListItemText 
                    primary="Bước 3: Đính kèm tài liệu" 
                    secondary="Upload file tài liệu hoặc nhập link video"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                  <ListItemText 
                    primary="Bước 4: Lưu bài học" 
                    secondary="Nhấn 'Lưu' để hoàn tất tạo bài học"
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Mẹo:</strong> Sử dụng icon <Download /> để cho phép học sinh tải tài liệu. 
              Đảm bảo tài liệu có định dạng phù hợp (PDF, DOC, PPT).
            </Typography>
          </Alert>
        </Box>
      )
    },
    {
      label: 'Quản lý bài tập',
      content: (
        <Box>
          <Typography variant="h6" gutterBottom sx={{ color: '#EF5B5B', fontWeight: 600 }}>
            Hướng dẫn quản lý bài tập
          </Typography>
          
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">Tạo bài tập</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                <ListItem>
                  <ListItemIcon><Add color="success" /></ListItemIcon>
                  <ListItemText 
                    primary="Bước 1: Vào lớp học" 
                    secondary="Chọn lớp học cần giao bài tập"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Assignment color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Bước 2: Nhấn 'Bài tập'" 
                    secondary="Tìm tab 'Bài tập' trong lớp học"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Edit color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Bước 3: Tạo bài tập mới" 
                    secondary="Nhấn 'Tạo bài tập' → Điền thông tin bài tập"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><AttachFile color="info" /></ListItemIcon>
                  <ListItemText 
                    primary="Bước 4: Đính kèm file" 
                    secondary="Upload file đề bài hoặc tài liệu hướng dẫn"
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">Chấm bài tập</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                <ListItem>
                  <ListItemIcon><People color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Xem danh sách nộp bài" 
                    secondary="Vào bài tập → Xem danh sách học sinh đã nộp"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Star color="warning" /></ListItemIcon>
                  <ListItemText 
                    primary="Chấm điểm" 
                    secondary="Nhấn vào bài nộp → Chấm điểm và nhận xét"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                  <ListItemText 
                    primary="Hoàn tất chấm bài" 
                    secondary="Lưu điểm và nhận xét → Học sinh sẽ nhận thông báo"
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Lưu ý:</strong> Hãy chấm bài tập kịp thời để học sinh có thể theo dõi tiến độ học tập. 
              Nhận xét chi tiết sẽ giúp học sinh cải thiện.
            </Typography>
          </Alert>
        </Box>
      )
    }
  ];

  const studentSteps = [
    {
      label: 'Tổng quan hệ thống',
      content: (
        <Box>
          <Typography variant="h6" gutterBottom sx={{ color: '#EF5B5B', fontWeight: 600 }}>
            Chào mừng đến với EduLearn - Nền tảng học tập trực tuyến
          </Typography>
          <Typography variant="body1" paragraph>
            EduLearn là nền tảng giáo dục trực tuyến giúp bạn học tập hiệu quả, 
            theo dõi tiến độ và tương tác với giáo viên và bạn bè.
          </Typography>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Mẹo:</strong> Sử dụng thanh tìm kiếm ở header để nhanh chóng tìm kiếm lớp học hoặc môn học.
            </Typography>
          </Alert>

          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Các tính năng chính:
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon><Home color="primary" /></ListItemIcon>
                <ListItemText 
                  primary="Trang chủ" 
                  secondary="Xem tổng quan và truy cập nhanh các tính năng"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><Class color="primary" /></ListItemIcon>
                <ListItemText 
                  primary="Lớp học" 
                  secondary="Xem danh sách lớp học đã tham gia"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><Assignment color="primary" /></ListItemIcon>
                <ListItemText 
                  primary="Bài tập" 
                  secondary="Xem và nộp bài tập được giao"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><TrendingUp color="primary" /></ListItemIcon>
                <ListItemText 
                  primary="Tiến độ" 
                  secondary="Theo dõi tiến độ học tập và điểm số"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><EmojiEvents color="primary" /></ListItemIcon>
                <ListItemText 
                  primary="Huy hiệu" 
                  secondary="Xem các thành tích và huy hiệu đạt được"
                />
              </ListItem>
            </List>
          </Box>
        </Box>
      )
    },
    {
      label: 'Tham gia lớp học',
      content: (
        <Box>
          <Typography variant="h6" gutterBottom sx={{ color: '#EF5B5B', fontWeight: 600 }}>
            Hướng dẫn tham gia lớp học
          </Typography>
          
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">Tham gia bằng mã mời</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                <ListItem>
                  <ListItemIcon><GroupAdd color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Bước 1: Nhận mã mời" 
                    secondary="Nhận mã mời từ giáo viên (ví dụ: ABC123)"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Home color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Bước 2: Vào trang chủ" 
                    secondary="Truy cập trang chủ → Nhấn 'Tham gia lớp mới'"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Edit color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Bước 3: Nhập mã mời" 
                    secondary="Nhập mã mời vào ô trống → Nhấn 'Tham gia'"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                  <ListItemText 
                    primary="Bước 4: Hoàn tất" 
                    secondary="Bạn đã tham gia lớp học thành công!"
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">Tham gia môn học công khai</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                <ListItem>
                  <ListItemIcon><Public color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Bước 1: Xem môn học công khai" 
                      secondary="Trang chủ → Tab 'Môn học công khai'"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Search color="info" /></ListItemIcon>
                  <ListItemText 
                    primary="Bước 2: Tìm môn học" 
                    secondary="Sử dụng tìm kiếm hoặc bộ lọc để tìm môn học phù hợp"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><PlayArrow color="success" /></ListItemIcon>
                  <ListItemText 
                    primary="Bước 3: Xem chi tiết" 
                    secondary="Nhấn 'Xem chi tiết' để xem thông tin môn học"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                  <ListItemText 
                    primary="Bước 4: Đăng ký học" 
                    secondary="Nhấn 'Học' để đăng ký tham gia môn học"
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Alert severity="success" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Lưu ý:</strong> Sau khi tham gia lớp học, bạn sẽ nhận được thông báo và có thể truy cập 
              nội dung học tập ngay lập tức.
            </Typography>
          </Alert>
        </Box>
      )
    },
    {
      label: 'Học tập và làm bài',
      content: (
        <Box>
          <Typography variant="h6" gutterBottom sx={{ color: '#EF5B5B', fontWeight: 600 }}>
            Hướng dẫn học tập và làm bài
          </Typography>
          
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">Học bài giảng</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                <ListItem>
                  <ListItemIcon><Class color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Vào lớp học" 
                    secondary="Trang chủ → Chọn lớp học cần học"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><PlayArrow color="success" /></ListItemIcon>
                  <ListItemText 
                    primary="Chọn bài học" 
                    secondary="Nhấn vào bài học muốn học"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><VideoLibrary color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Xem video" 
                    secondary="Xem video bài giảng và ghi chú nội dung quan trọng"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Download color="info" /></ListItemIcon>
                  <ListItemText 
                    primary="Tải tài liệu" 
                    secondary="Nhấn 'Tải về' để tải tài liệu đính kèm"
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">Làm bài tập</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                <ListItem>
                  <ListItemIcon><Assignment color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Xem bài tập" 
                    secondary="Lớp học → Tab 'Bài tập' → Chọn bài tập cần làm"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Description color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Đọc đề bài" 
                    secondary="Đọc kỹ đề bài và tài liệu hướng dẫn"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><AttachFile color="info" /></ListItemIcon>
                  <ListItemText 
                    primary="Nộp bài" 
                    secondary="Upload file bài làm → Nhấn 'Nộp bài'"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Star color="warning" /></ListItemIcon>
                  <ListItemText 
                    primary="Xem điểm" 
                    secondary="Sau khi giáo viên chấm, xem điểm và nhận xét"
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">Theo dõi tiến độ</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                <ListItem>
                  <ListItemIcon><TrendingUp color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Xem tiến độ" 
                    secondary="Trang chủ → 'Tiến độ học tập' để xem tổng quan"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                  <ListItemText 
                    primary="Bài đã hoàn thành" 
                    secondary="Xem danh sách bài học đã hoàn thành"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Star color="warning" /></ListItemIcon>
                  <ListItemText 
                    primary="Điểm số" 
                    secondary="Theo dõi điểm số các bài tập và bài kiểm tra"
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Mẹo:</strong> Hãy học đều đặn và nộp bài đúng hạn để đạt kết quả tốt nhất. 
              Sử dụng tính năng theo dõi tiến độ để kiểm tra quá trình học tập.
            </Typography>
          </Alert>
        </Box>
      )
    },
    {
      label: 'Tương tác và hỗ trợ',
      content: (
        <Box>
          <Typography variant="h6" gutterBottom sx={{ color: '#EF5B5B', fontWeight: 600 }}>
            Hướng dẫn tương tác và hỗ trợ
          </Typography>
          
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">Chat lớp học</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                <ListItem>
                  <ListItemIcon><Class color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Truy cập chat" 
                    secondary="Vào lớp học → Tìm phần 'Chat lớp học'"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Edit color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Gửi tin nhắn" 
                    secondary="Nhập tin nhắn → Nhấn 'Gửi' hoặc Enter"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><People color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Tương tác" 
                    secondary="Trò chuyện với giáo viên và bạn học trong lớp"
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">Thông báo</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                <ListItem>
                  <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                  <ListItemText 
                    primary="Thông báo mới" 
                    secondary="Icon chuông ở header hiển thị số thông báo mới"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Star color="warning" /></ListItemIcon>
                  <ListItemText 
                    primary="Bài tập được chấm" 
                    secondary="Nhận thông báo khi bài tập được chấm điểm"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Assignment color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Bài tập mới" 
                    secondary="Nhận thông báo khi có bài tập mới"
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">Huy hiệu và thành tích</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                <ListItem>
                  <ListItemIcon><EmojiEvents color="warning" /></ListItemIcon>
                  <ListItemText 
                    primary="Xem huy hiệu" 
                    secondary="Trang chủ → 'Huy hiệu' để xem thành tích"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Star color="warning" /></ListItemIcon>
                  <ListItemText 
                    primary="Điều kiện đạt huy hiệu" 
                    secondary="Hoàn thành bài học, nộp bài đúng hạn, đạt điểm cao"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><TrendingUp color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Theo dõi tiến độ" 
                    secondary="Xem tiến độ học tập để biết cần cải thiện gì"
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Alert severity="success" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Khuyến khích:</strong> Hãy tích cực tương tác với giáo viên và bạn học, 
              đặt câu hỏi khi cần thiết để học tập hiệu quả hơn.
            </Typography>
          </Alert>
        </Box>
      )
    }
  ];

  const steps = userRole === 'teacher' ? teacherSteps : studentSteps;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: 'linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%)',
          boxShadow: '0 8px 32px rgba(239, 91, 91, 0.2)'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2,
        color: '#EF5B5B',
        fontWeight: 'bold',
        borderBottom: '1px solid rgba(239, 91, 91, 0.1)',
        pb: 2
      }}>
        <HelpOutline sx={{ fontSize: 28 }} />
        Hướng dẫn sử dụng EduLearn
        <Box sx={{ flexGrow: 1 }} />
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel
                sx={{
                  '& .MuiStepLabel-label': {
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    color: '#333333'
                  },
                  '& .MuiStepLabel-iconContainer': {
                    '& .MuiSvgIcon-root': {
                      fontSize: '1.5rem',
                      color: activeStep === index ? '#EF5B5B' : '#b0b0b0'
                    }
                  }
                }}
              >
                {step.label}
              </StepLabel>
              <StepContent>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 3, 
                    mb: 2,
                    border: '1px solid rgba(239, 91, 91, 0.1)',
                    borderRadius: 2
                  }}
                >
                  {step.content}
                </Paper>
                <Box sx={{ mb: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    sx={{
                      mr: 1,
                      background: 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #D94A4A 0%, #EF5B5B 100%)',
                      }
                    }}
                  >
                    {index === steps.length - 1 ? 'Hoàn thành' : 'Tiếp theo'}
                  </Button>
                  <Button
                    disabled={index === 0}
                    onClick={handleBack}
                    sx={{ mr: 1 }}
                  >
                    Quay lại
                  </Button>
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </DialogContent>
      
      <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(239, 91, 91, 0.1)' }}>
        <Button onClick={handleReset} color="inherit">
          Bắt đầu lại
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button onClick={onClose} variant="outlined">
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
}
