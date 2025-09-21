import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Divider,
  Slide,
  Fade,
  Zoom,
  Collapse,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  SmartToy,
  Close,
  Send,
  QuestionAnswer,
  School,
  Class,
  Assignment,
  People,
  TrendingUp,
  EmojiEvents,
  Dashboard,
  HelpOutline,
  PlayArrow,
  Download,
  GroupAdd,
  Public,
  Search,
  Bookmark,
  Edit,
  Add,
  Delete,
  CheckCircle,
  Warning,
  Info,
  KeyboardArrowDown,
  KeyboardArrowUp
} from '@mui/icons-material';
import { TransitionProps } from '@mui/material/transitions';

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
  type?: 'question' | 'answer' | 'suggestion';
}

interface QuickQuestion {
  id: string;
  question: string;
  answer: string;
  category: string;
  icon: React.ReactNode;
}

const quickQuestions: QuickQuestion[] = [
  // General Questions
  {
    id: '1',
    question: 'Làm thế nào để sử dụng hệ thống?',
    answer: 'Chào bạn! Để sử dụng hệ thống EduLearn hiệu quả:\n\n1. **Đăng nhập** vào tài khoản của bạn\n2. **Khám phá** các tính năng từ sidebar\n3. **Sử dụng hướng dẫn** trong sidebar để hiểu rõ hơn\n4. **Liên hệ** giáo viên nếu cần hỗ trợ\n\nBạn có thể nhấn vào "Hướng dẫn sử dụng" trong sidebar để xem hướng dẫn chi tiết!',
    category: 'Tổng quan',
    icon: <HelpOutline />
  },
  {
    id: '2',
    question: 'Tôi gặp lỗi khi sử dụng, phải làm sao?',
    answer: 'Nếu bạn gặp lỗi khi sử dụng hệ thống:\n\n1. **Làm mới trang** (F5 hoặc Ctrl+R)\n2. **Kiểm tra kết nối internet**\n3. **Đăng xuất và đăng nhập lại**\n4. **Xóa cache trình duyệt**\n5. **Liên hệ giáo viên** để được hỗ trợ\n\nNếu vấn đề vẫn tiếp tục, hãy chụp màn hình lỗi và gửi cho giáo viên!',
    category: 'Hỗ trợ',
    icon: <Warning />
  },
  {
    id: '3',
    question: 'Làm sao để thay đổi mật khẩu?',
    answer: 'Để thay đổi mật khẩu:\n\n1. **Nhấn vào avatar** ở góc trên bên phải\n2. **Chọn "Hồ sơ"**\n3. **Tìm mục "Đổi mật khẩu"**\n4. **Nhập mật khẩu cũ và mật khẩu mới**\n5. **Xác nhận thay đổi**\n\nMật khẩu mới phải có ít nhất 6 ký tự và nên bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt!',
    category: 'Tài khoản',
    icon: <CheckCircle />
  },

  // Student Specific Questions
  {
    id: '4',
    question: 'Làm thế nào để tham gia lớp học?',
    answer: 'Để tham gia lớp học:\n\n**Cách 1: Sử dụng mã mời**\n1. Nhận mã mời từ giáo viên\n2. Vào trang chủ → "Tham gia lớp mới"\n3. Nhập mã mời → "Tham gia"\n\n**Cách 2: Môn học công khai**\n1. Vào "Môn học công khai"\n2. Tìm môn học phù hợp\n3. Nhấn "Xem chi tiết" → "Học"\n\nSau khi tham gia, bạn sẽ thấy lớp học trong danh sách!',
    category: 'Học sinh',
    icon: <GroupAdd />
  },
  {
    id: '5',
    question: 'Làm sao để nộp bài tập?',
    answer: 'Để nộp bài tập:\n\n1. **Vào lớp học** cần nộp bài\n2. **Chọn tab "Bài tập"**\n3. **Tìm bài tập** cần làm\n4. **Nhấn vào bài tập** để xem chi tiết\n5. **Đọc đề bài** và tài liệu hướng dẫn\n6. **Làm bài** và chuẩn bị file\n7. **Nhấn "Nộp bài"** → Upload file\n8. **Xác nhận nộp bài**\n\nLưu ý: Nộp bài đúng hạn để được chấm điểm đầy đủ!',
    category: 'Học sinh',
    icon: <Assignment />
  },
  {
    id: '6',
    question: 'Làm thế nào để xem tiến độ học tập?',
    answer: 'Để xem tiến độ học tập:\n\n1. **Vào "Tiến độ"** từ sidebar\n2. **Xem tổng quan** tiến độ các môn học\n3. **Kiểm tra bài đã hoàn thành**\n4. **Xem điểm số** các bài tập\n5. **Theo dõi huy hiệu** đạt được\n\nBạn cũng có thể xem tiến độ chi tiết từng lớp học bằng cách vào lớp học cụ thể!',
    category: 'Học sinh',
    icon: <TrendingUp />
  },
  {
    id: '7',
    question: 'Làm sao để tải tài liệu học tập?',
    answer: 'Để tải tài liệu học tập:\n\n1. **Vào lớp học** chứa tài liệu\n2. **Chọn bài học** có tài liệu\n3. **Tìm phần "Tài liệu đính kèm"**\n4. **Nhấn nút "Tải về"** (icon download)\n5. **Chọn vị trí lưu** file\n\nTài liệu thường có định dạng PDF, DOC, PPT. Đảm bảo thiết bị có đủ dung lượng để tải!',
    category: 'Học sinh',
    icon: <Download />
  },

  // Teacher Specific Questions
  {
    id: '8',
    question: 'Làm thế nào để tạo lớp học mới?',
    answer: 'Để tạo lớp học mới:\n\n1. **Vào "Lớp của tôi"** từ sidebar\n2. **Nhấn nút "Tạo lớp"** (màu đỏ)\n3. **Nhập tên lớp** (ví dụ: "Lớp 10A1")\n4. **Chọn môn học** từ danh sách\n5. **Nhấn "Tạo lớp"** để hoàn tất\n\nSau khi tạo, bạn sẽ nhận được mã mời để chia sẻ với học sinh!',
    category: 'Giáo viên',
    icon: <Add />
  },
  {
    id: '9',
    question: 'Làm sao để thêm học sinh vào lớp?',
    answer: 'Để thêm học sinh vào lớp:\n\n1. **Vào lớp học** cần thêm học sinh\n2. **Nhấn "Quản lý"**\n3. **Chọn "Thêm học sinh"**\n4. **Nhập email** của học sinh\n5. **Tìm kiếm** học sinh\n6. **Nhấn "Thêm học sinh"**\n\n**Hoặc** chia sẻ mã mời cho học sinh để họ tự tham gia!',
    category: 'Giáo viên',
    icon: <People />
  },
  {
    id: '10',
    question: 'Làm thế nào để tạo bài tập?',
    answer: 'Để tạo bài tập:\n\n1. **Vào lớp học** cần tạo bài tập\n2. **Chọn tab "Bài tập"**\n3. **Nhấn "Tạo bài tập"**\n4. **Nhập thông tin bài tập**:\n   - Tên bài tập\n   - Mô tả chi tiết\n   - Hạn nộp bài\n   - Điểm tối đa\n5. **Đính kèm file** đề bài (nếu có)\n6. **Nhấn "Tạo bài tập"**\n\nHọc sinh sẽ nhận thông báo khi có bài tập mới!',
    category: 'Giáo viên',
    icon: <Assignment />
  },
  {
    id: '11',
    question: 'Làm sao để chấm bài tập?',
    answer: 'Để chấm bài tập:\n\n1. **Vào lớp học** có bài tập cần chấm\n2. **Chọn tab "Bài tập"**\n3. **Nhấn vào bài tập** cần chấm\n4. **Xem danh sách** bài nộp của học sinh\n5. **Nhấn vào bài nộp** để xem\n6. **Chấm điểm** và viết nhận xét\n7. **Lưu kết quả**\n\nHọc sinh sẽ nhận thông báo khi bài được chấm!',
    category: 'Giáo viên',
    icon: <CheckCircle />
  },
  {
    id: '12',
    question: 'Làm thế nào để tạo nội dung học tập?',
    answer: 'Để tạo nội dung học tập:\n\n1. **Vào "Môn học của tôi"**\n2. **Chọn môn học** cần tạo nội dung\n3. **Nhấn "Quản lý"** → "Bài giảng"\n4. **Tạo Module** (Tập 1, Tập 2...)\n5. **Thêm bài học** vào module:\n   - Video bài giảng\n   - Tài liệu PDF\n   - Quiz trắc nghiệm\n   - Bài tập tương tác\n6. **Sắp xếp thứ tự** bài học\n7. **Lưu nội dung**\n\nNội dung sẽ hiển thị cho học sinh theo thứ tự!',
    category: 'Giáo viên',
    icon: <School />
  }
];

export default function VirtualAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');
  const [faqExpanded, setFaqExpanded] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const categories = ['Tất cả', ...Array.from(new Set(quickQuestions.map(q => q.category)))];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleOpen = () => {
    setOpen(true);
    if (messages.length === 0) {
      addBotMessage('Xin chào! Tôi là trợ lý ảo của EduLearn. Tôi có thể giúp bạn giải đáp các thắc mắc về hệ thống. Hãy chọn một câu hỏi bên dưới hoặc gõ câu hỏi của bạn!');
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  const addMessage = (text: string, isBot: boolean, type: 'question' | 'answer' | 'suggestion' = 'answer') => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      isBot,
      timestamp: new Date(),
      type
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const addBotMessage = (text: string) => {
    addMessage(text, true, 'answer');
  };

  const handleQuestionClick = (question: QuickQuestion) => {
    addMessage(question.question, false, 'question');
    
    // Simulate typing delay
    setTimeout(() => {
      addBotMessage(question.answer);
    }, 500);
  };

  const handleSendMessage = () => {
    if (userInput.trim()) {
      addMessage(userInput, false, 'question');
      setUserInput('');
      
      // Simulate bot response
      setTimeout(() => {
        addBotMessage('Cảm ơn bạn đã hỏi! Tôi đang học hỏi thêm để có thể trả lời tốt hơn. Hiện tại, bạn có thể chọn một trong những câu hỏi có sẵn bên dưới để được hỗ trợ chi tiết hơn.');
      }, 1000);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const filteredQuestions = selectedCategory === 'Tất cả' 
    ? quickQuestions 
    : quickQuestions.filter(q => q.category === selectedCategory);

  return (
    <>
      {/* Floating Action Button */}
      <Zoom in={!open} timeout={300}>
        <Fab
          color="primary"
          aria-label="virtual assistant"
          onClick={handleOpen}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000,
            background: 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
            boxShadow: '0 8px 32px rgba(239, 91, 91, 0.3)',
            '&:hover': {
              background: 'linear-gradient(135deg, #D94A4A 0%, #EF5B5B 100%)',
              transform: 'scale(1.1)',
              boxShadow: '0 12px 40px rgba(239, 91, 91, 0.4)',
            },
            transition: 'all 0.3s ease',
            width: 64,
            height: 64
          }}
        >
          <SmartToy sx={{ fontSize: 28, color: 'white' }} />
        </Fab>
      </Zoom>

      {/* Chat Dialog */}
      <Dialog
        open={open}
        onClose={handleClose}
        TransitionComponent={Transition}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            position: 'fixed',
            bottom: 24,
            right: 24,
            top: 'auto',
            left: 'auto',
            margin: 0,
            maxHeight: '80vh',
            borderRadius: 3,
            background: 'linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%)',
            boxShadow: '0 16px 64px rgba(239, 91, 91, 0.2)',
            border: '1px solid rgba(239, 91, 91, 0.1)'
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
          <Avatar sx={{ 
            bgcolor: '#EF5B5B',
            width: 40,
            height: 40
          }}>
            <SmartToy />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Trợ lý ảo EduLearn
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Sẵn sàng hỗ trợ bạn 24/7
            </Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton onClick={handleClose} size="small">
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0, height: 500, display: 'flex', flexDirection: 'column' }}>
          {/* Messages Area */}
          <Box sx={{ 
            flex: 1, 
            overflow: 'auto', 
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 1
          }}>
            {messages.map((message) => (
              <Fade in key={message.id} timeout={300}>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: message.isBot ? 'flex-start' : 'flex-end',
                  mb: 1
                }}>
                  <Paper
                    elevation={1}
                    sx={{
                      p: 2,
                      maxWidth: '80%',
                      borderRadius: 3,
                      background: message.isBot 
                        ? 'linear-gradient(135deg, #F8F9FA 0%, #E9ECEF 100%)'
                        : 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
                      color: message.isBot ? '#333333' : 'white',
                      border: message.isBot 
                        ? '1px solid rgba(239, 91, 91, 0.1)'
                        : 'none'
                    }}
                  >
                    <Typography variant="body2" sx={{ 
                      whiteSpace: 'pre-line',
                      lineHeight: 1.6,
                      color: message.isBot ? '#333333' : 'white'
                    }}>
                      {message.text}
                    </Typography>
                    <Typography variant="caption" sx={{ 
                      display: 'block', 
                      mt: 1, 
                      opacity: 0.7,
                      fontSize: '0.7rem',
                      color: message.isBot ? '#666666' : 'rgba(255, 255, 255, 0.8)'
                    }}>
                      {message.timestamp.toLocaleTimeString()}
                    </Typography>
                  </Paper>
                </Box>
              </Fade>
            ))}
            <div ref={messagesEndRef} />
          </Box>

          {/* Quick Questions */}
          <Box sx={{ borderTop: '1px solid rgba(239, 91, 91, 0.1)' }}>
            {/* FAQ Header with Toggle */}
            <Box 
              sx={{ 
                p: 2, 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'rgba(239, 91, 91, 0.02)',
                '&:hover': {
                  backgroundColor: 'rgba(239, 91, 91, 0.05)',
                },
                transition: 'all 0.3s ease'
              }}
              onClick={() => setFaqExpanded(!faqExpanded)}
            >
              <Typography variant="subtitle2" sx={{ 
                color: '#EF5B5B', 
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <QuestionAnswer fontSize="small" />
                Câu hỏi thường gặp
              </Typography>
              <IconButton size="small" sx={{ color: '#EF5B5B' }}>
                {faqExpanded ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
              </IconButton>
            </Box>

            {/* Collapsible FAQ Content */}
            <Collapse in={faqExpanded}>
              <Box sx={{ p: 2, pt: 0 }}>
                {/* Category Filter */}
                <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {categories.map((category) => (
                    <Chip
                      key={category}
                      label={category}
                      size="small"
                      onClick={() => setSelectedCategory(category)}
                      sx={{
                        backgroundColor: selectedCategory === category 
                          ? '#EF5B5B' 
                          : 'rgba(239, 91, 91, 0.1)',
                        color: selectedCategory === category 
                          ? 'white' 
                          : '#EF5B5B',
                        '&:hover': {
                          backgroundColor: selectedCategory === category 
                            ? '#D94A4A' 
                            : 'rgba(239, 91, 91, 0.2)',
                        },
                        transition: 'all 0.3s ease'
                      }}
                    />
                  ))}
                </Box>

                {/* Questions List */}
                <List sx={{ maxHeight: 200, overflow: 'auto' }}>
                  {filteredQuestions.map((question) => (
                    <ListItem key={question.id} disablePadding>
                      <ListItemButton
                        onClick={() => handleQuestionClick(question)}
                        sx={{
                          borderRadius: 2,
                          mb: 1,
                          border: '1px solid rgba(239, 91, 91, 0.1)',
                          '&:hover': {
                            backgroundColor: 'rgba(239, 91, 91, 0.05)',
                            border: '1px solid rgba(239, 91, 91, 0.2)',
                          },
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <ListItemIcon sx={{ color: '#EF5B5B', minWidth: 40 }}>
                          {question.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={question.question}
                          secondary={question.category}
                          primaryTypographyProps={{
                            variant: 'body2',
                            fontWeight: 500,
                            color: '#333333'
                          }}
                          secondaryTypographyProps={{
                            variant: 'caption',
                            color: '#EF5B5B'
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Collapse>
          </Box>

          {/* Input Area */}
          <Box sx={{ p: 2, borderTop: '1px solid rgba(239, 91, 91, 0.1)' }}>
            <TextField
              fullWidth
              placeholder="Nhập câu hỏi của bạn..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={handleKeyPress}
              size="small"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleSendMessage}
                      disabled={!userInput.trim()}
                      sx={{
                        color: '#EF5B5B',
                        '&:hover': {
                          backgroundColor: 'rgba(239, 91, 91, 0.1)',
                        }
                      }}
                    >
                      <Send />
                    </IconButton>
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: 3,
                  backgroundColor: 'rgba(239, 91, 91, 0.05)',
                  '& fieldset': {
                    border: '1px solid rgba(239, 91, 91, 0.2)',
                  },
                  '&:hover fieldset': {
                    border: '1px solid rgba(239, 91, 91, 0.3)',
                  },
                  '&.Mui-focused fieldset': {
                    border: '1px solid #EF5B5B',
                  }
                }
              }}
            />
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}
