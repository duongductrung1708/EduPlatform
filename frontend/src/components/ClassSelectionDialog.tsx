import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  Stepper,
  Step,
  StepLabel,
  CircularProgress
} from '@mui/material';
import { School, Grade, ArrowBack } from '@mui/icons-material';
import { useTheme } from '../contexts/ThemeContext';
import { coursesApi } from '../api/courses';

interface GradeLevel {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

interface Course {
  _id: string;
  title: string;
  description?: string;
  category?: string;
  level?: string;
  coverImage?: string;
}

interface ClassSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectClass: (gradeLevel: GradeLevel, subject?: any) => void;
  userId: string;
}

export default function ClassSelectionDialog({ 
  open, 
  onClose, 
  onSelectClass, 
  userId 
}: ClassSelectionDialogProps) {
  const { darkMode } = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedGradeId, setSelectedGradeId] = useState<string | null>(null);

  // Danh sách 7 môn học chính (khớp với database)
  const subjects = [
    {
      id: 'toan',
      name: 'Toán',
      description: 'Phát triển tư duy logic và tính toán',
      icon: '🔢',
      color: '#FF6B6B'
    },
    {
      id: 'tieng-viet',
      name: 'Tiếng Việt',
      description: 'Rèn luyện kỹ năng đọc, viết và giao tiếp',
      icon: '📝',
      color: '#4ECDC4'
    },
    {
      id: 'tieng-anh',
      name: 'Tiếng Anh',
      description: 'Học ngôn ngữ quốc tế',
      icon: '🌍',
      color: '#45B7D1'
    },
    {
      id: 'khoa-hoc',
      name: 'Khoa học',
      description: 'Khám phá thế giới tự nhiên',
      icon: '🔬',
      color: '#96CEB4'
    },
    {
      id: 'tin-hoc',
      name: 'Tin học',
      description: 'Lập trình và công nghệ thông tin',
      icon: '💻',
      color: '#FFEAA7'
    },
    {
      id: 'my-thuat',
      name: 'Mỹ thuật',
      description: 'Sáng tạo và nghệ thuật',
      icon: '🎨',
      color: '#DDA0DD'
    },
    {
      id: 'am-nhac',
      name: 'Âm nhạc',
      description: 'Nhịp điệu và giai điệu',
      icon: '🎵',
      color: '#98FB98'
    }
  ];

  // Danh sách các cấp lớp từ Lớp 1 đến Lớp 5
  const gradeLevels: GradeLevel[] = [
    {
      id: 'grade-1',
      name: 'Lớp 1',
      description: 'Khám phá thế giới xung quanh',
      icon: '🌟',
      color: '#FF6B6B'
    },
    {
      id: 'grade-2', 
      name: 'Lớp 2',
      description: 'Học tập và vui chơi',
      icon: '🎨',
      color: '#4ECDC4'
    },
    {
      id: 'grade-3',
      name: 'Lớp 3', 
      description: 'Phát triển tư duy',
      icon: '🚀',
      color: '#45B7D1'
    },
    {
      id: 'grade-4',
      name: 'Lớp 4',
      description: 'Mở rộng kiến thức',
      icon: '📚',
      color: '#96CEB4'
    },
    {
      id: 'grade-5',
      name: 'Lớp 5',
      description: 'Chuẩn bị lên cấp 2',
      icon: '🎓',
      color: '#FFEAA7'
    }
  ];


  const handleSelectSubject = () => {
    if (selectedSubjectId) {
      setActiveStep(1);
    }
  };

  const handleSelectGrade = () => {
    if (selectedSubjectId && selectedGradeId) {
      const selectedSubject = subjects.find(s => s.id === selectedSubjectId);
      const selectedGrade = gradeLevels.find(g => g.id === selectedGradeId);
      if (selectedSubject && selectedGrade) {
        onSelectClass(selectedGrade, selectedSubject);
        onClose();
      }
    }
  };

  const handleBack = () => {
    if (activeStep === 1) {
      setActiveStep(0);
      setSelectedGradeId(null);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const handleClose = () => {
    setActiveStep(0);
    setSelectedSubjectId(null);
    setSelectedGradeId(null);
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: darkMode 
            ? 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)'
            : 'linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%)',
          border: darkMode 
            ? '1px solid rgba(255, 123, 123, 0.2)'
            : '1px solid rgba(239, 91, 91, 0.1)'
        }
      }}
    >
      <DialogTitle sx={{ 
        textAlign: 'center',
        background: darkMode 
          ? 'linear-gradient(135deg, #FF7B7B 0%, #EF5B5B 100%)'
          : 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
        color: '#FFFFFF',
        borderRadius: '12px 12px 0 0',
        py: 3
      }}>
        <Typography variant="h5" fontWeight={600} sx={{ color: '#FFFFFF' }}>
          {activeStep === 0 ? '📚 Chọn môn học' : '🎓 Chọn cấp lớp'}
        </Typography>
        <Typography variant="body2" sx={{ mt: 1, opacity: 0.9, color: '#FFFFFF' }}>
          {activeStep === 0 ? 'Chọn môn học bạn muốn học' : 'Chọn cấp lớp phù hợp'}
        </Typography>
        
        {/* Stepper */}
        <Box sx={{ mt: 2 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            <Step>
              <StepLabel sx={{ color: '#FFFFFF' }}>Chọn môn học</StepLabel>
            </Step>
            <Step>
              <StepLabel sx={{ color: '#FFFFFF' }}>Chọn cấp lớp</StepLabel>
            </Step>
          </Stepper>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {activeStep === 0 ? (
          // Step 1: Select Subject
          <Grid container spacing={2} sx={{ mb: 1, mt: 1 }}>
            {subjects.map((subject) => (
              <Grid item xs={12} sm={6} md={4} key={subject.id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    border: selectedSubjectId === subject.id 
                      ? '2px solid #EF5B5B' 
                      : '1px solid transparent',
                    background: selectedSubjectId === subject.id
                      ? darkMode 
                        ? 'rgba(255, 123, 123, 0.1)'
                        : 'rgba(239, 91, 91, 0.05)'
                      : darkMode 
                        ? 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)'
                        : 'linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%)',
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
                      border: '1px solid #EF5B5B',
                      background: darkMode 
                        ? 'rgba(255, 123, 123, 0.1)'
                        : 'rgba(239, 91, 91, 0.05)'
                    }
                  }}
                  onClick={() => setSelectedSubjectId(subject.id)}
                >
                  <CardContent sx={{ p: 3, textAlign: 'center' }}>
                    <Avatar
                      sx={{
                        width: 64,
                        height: 64,
                        mx: 'auto',
                        mb: 2,
                        background: `linear-gradient(135deg, ${subject.color} 0%, ${subject.color}CC 100%)`,
                        fontSize: '2rem'
                      }}
                    >
                      {subject.icon}
                    </Avatar>
                    
                    <Typography 
                      variant="h6" 
                      fontWeight={700} 
                      sx={{ 
                        mb: 1,
                        color: darkMode ? '#e0e0e0' : '#333333'
                      }}
                    >
                      {subject.name}
                    </Typography>
                    
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: darkMode ? '#b0b0b0' : '#777777',
                        lineHeight: 1.5,
                        fontSize: '0.875rem'
                      }}
                    >
                      {subject.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          // Step 2: Select Grade Level
          <Grid container spacing={2} sx={{ mb: 1, mt: 1 }}>
            {gradeLevels.map((grade) => (
              <Grid item xs={12} sm={6} key={grade.id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    border: selectedGradeId === grade.id 
                      ? '2px solid #EF5B5B' 
                      : '1px solid transparent',
                    background: selectedGradeId === grade.id
                      ? darkMode 
                        ? 'rgba(255, 123, 123, 0.1)'
                        : 'rgba(239, 91, 91, 0.05)'
                      : darkMode 
                        ? 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)'
                        : 'linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%)',
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
                      border: '1px solid #EF5B5B',
                      background: darkMode 
                        ? 'rgba(255, 123, 123, 0.1)'
                        : 'rgba(239, 91, 91, 0.05)'
                    }
                  }}
                  onClick={() => setSelectedGradeId(grade.id)}
                >
                  <CardContent sx={{ p: 3, textAlign: 'center' }}>
                    <Avatar
                      sx={{
                        width: 64,
                        height: 64,
                        mx: 'auto',
                        mb: 2,
                        background: `linear-gradient(135deg, ${grade.color} 0%, ${grade.color}CC 100%)`,
                        fontSize: '2rem'
                      }}
                    >
                      {grade.icon}
                    </Avatar>
                    
                    <Typography 
                      variant="h5" 
                      fontWeight={700} 
                      sx={{ 
                        mb: 1,
                        color: darkMode ? '#e0e0e0' : '#333333'
                      }}
                    >
                      {grade.name}
                    </Typography>
                    
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: darkMode ? '#b0b0b0' : '#777777',
                        lineHeight: 1.5
                      }}
                    >
                      {grade.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 2 }}>
        {activeStep === 1 && (
          <Button
            onClick={handleBack}
            variant="outlined"
            startIcon={<ArrowBack />}
            sx={{
              borderColor: '#EF5B5B',
              color: '#EF5B5B',
              '&:hover': {
                borderColor: '#D94A4A',
                backgroundColor: 'rgba(239, 91, 91, 0.1)'
              }
            }}
          >
            Quay lại
          </Button>
        )}
        
        <Button
          onClick={handleSkip}
          variant="outlined"
          sx={{
            borderColor: '#EF5B5B',
            color: '#EF5B5B',
            '&:hover': {
              borderColor: '#D94A4A',
              backgroundColor: 'rgba(239, 91, 91, 0.1)'
            }
          }}
        >
          Bỏ qua
        </Button>
        
        {activeStep === 0 ? (
          <Button
            onClick={handleSelectSubject}
            variant="contained"
            disabled={!selectedSubjectId}
            sx={{
              background: 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #D94A4A 0%, #EF5B5B 100%)'
              },
              '&:disabled': {
                background: '#ccc',
                color: '#666'
              }
            }}
          >
            Tiếp tục
          </Button>
        ) : (
          <Button
            onClick={handleSelectGrade}
            variant="contained"
            disabled={!selectedGradeId}
            sx={{
              background: 'linear-gradient(135deg, #EF5B5B 0%, #FF7B7B 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #D94A4A 0%, #EF5B5B 100%)'
              },
              '&:disabled': {
                background: '#ccc',
                color: '#666'
              }
            }}
          >
            Hoàn thành
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
