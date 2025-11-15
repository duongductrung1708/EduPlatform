import React from 'react';
import logoUrl from '../assets/logo.png';

interface LogoProps {
  height?: number;
  onClick?: () => void;
  alt?: string;
}

export default function Logo({ height = 28, onClick, alt = 'EduLearn' }: LogoProps) {
  return (
    <img
      src={logoUrl}
      alt={alt}
      style={{ height, display: 'block', cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
    />
  );
}
