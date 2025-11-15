import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Breadcrumbs as MuiBreadcrumbs, 
  Link, 
  Typography, 
  Box,
} from '@mui/material';
import { 
  Home as HomeIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Class as ClassIcon,
  Description as DescriptionIcon,
  Group as GroupIcon,
  Add as AddIcon
} from '@mui/icons-material';

interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: React.ReactNode;
  current?: boolean;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  sx?: React.CSSProperties | Record<string, unknown>;
  showHome?: boolean;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ 
  items = [], 
  sx = {},
  showHome = true 
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Auto-generate breadcrumbs based on current path if no items provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    if (showHome) {
      breadcrumbs.push({
        label: 'Trang chủ',
        path: '/dashboard',
        icon: <HomeIcon fontSize="small" />
      });
    }

    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;

      // Map segments to user-friendly labels
      let label = segment;
      let icon: React.ReactNode | undefined;

      switch (segment) {
        case 'teacher':
          label = 'Giáo viên';
          icon = <PersonIcon fontSize="small" />;
          break;
        case 'student':
          label = 'Học sinh';
          icon = <PersonIcon fontSize="small" />;
          break;
        case 'admin':
          label = 'Quản trị';
          icon = <PersonIcon fontSize="small" />;
          break;
        case 'courses':
          label = 'Môn học';
          icon = <SchoolIcon fontSize="small" />;
          break;
        case 'classrooms':
          label = 'Lớp học';
          icon = <ClassIcon fontSize="small" />;
          break;
        case 'lessons':
          label = 'Bài học';
          icon = <DescriptionIcon fontSize="small" />;
          break;
        case 'students':
          label = 'Học sinh';
          icon = <GroupIcon fontSize="small" />;
          break;
        case 'create':
          label = 'Tạo mới';
          icon = <AddIcon fontSize="small" />;
          break;
        case 'manage':
          label = 'Quản lý';
          icon = <DescriptionIcon fontSize="small" />;
          break;
        default:
          // For IDs or other segments, try to make them more readable
          if (segment.length > 10) {
            label = 'Chi tiết';
          } else {
            label = segment.charAt(0).toUpperCase() + segment.slice(1);
          }
      }

      breadcrumbs.push({
        label,
        path: isLast ? undefined : currentPath,
        icon,
        current: isLast
      });
    });

    return breadcrumbs;
  };

  const breadcrumbItems = items.length > 0 ? items : generateBreadcrumbs();

  const handleClick = (path: string) => {
    navigate(path);
  };

  return (
    <Box sx={{ mb: 2, ...sx }}>
      <MuiBreadcrumbs 
        separator="›" 
        sx={{
          '& .MuiBreadcrumbs-separator': {
            color: 'text.secondary',
            fontSize: '1.2rem',
            fontWeight: 500
          }
        }}
      >
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;
          
          if (isLast || item.current) {
            return (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {item.icon}
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 600,
                    color: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5
                  }}
                >
                  {item.label}
                </Typography>
              </Box>
            );
          }

          return (
            <Link
              key={index}
              component="button"
              variant="body2"
              onClick={() => item.path && handleClick(item.path)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                textDecoration: 'none',
                color: 'text.secondary',
                fontWeight: 500,
                '&:hover': {
                  color: 'primary.main',
                  textDecoration: 'underline'
                },
                cursor: 'pointer',
                border: 'none',
                background: 'none',
                padding: 0
              }}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </MuiBreadcrumbs>
    </Box>
  );
};

export default Breadcrumb;
