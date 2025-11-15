import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Box } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';

interface BackButtonProps {
  to?: string;
  onClick?: () => void;
  label?: string;
  variant?: 'text' | 'outlined' | 'contained';
  size?: 'small' | 'medium' | 'large';
  sx?: React.CSSProperties | Record<string, unknown>;
}

const BackButton: React.FC<BackButtonProps> = ({
  to,
  onClick,
  label = 'Quay lại',
  variant = 'outlined',
  size = 'medium',
  sx = {}
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (to) {
      navigate(to);
    } else {
      navigate(-1); // Go back to previous page
    }
  };

  return (
    <Box sx={{ mb: 2, ...sx }}>
      <Button
        variant={variant}
        size={size}
        startIcon={<ArrowBack />}
        onClick={handleClick}
        sx={{
          borderRadius: 2,
          textTransform: 'none',
          fontWeight: 500,
          ...sx
        }}
      >
        {label}
      </Button>
    </Box>
  );
};

export default BackButton;
