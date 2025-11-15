import React from 'react';
import { Box, Skeleton, Card, CardContent, Grid } from '@mui/material';

interface SkeletonCardProps {
  height?: number;
  showAvatar?: boolean;
  showChips?: boolean;
  showButton?: boolean;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ 
  showAvatar = false, 
  showChips = false, 
  showButton = false 
}) => (
  <Card sx={{ borderRadius: 3, border: '2px solid', borderColor: 'divider' }}>
    <CardContent sx={{ p: 3 }}>
      {showAvatar && (
        <Box display="flex" alignItems="center" gap={2} sx={{ mb: 2 }}>
          <Skeleton variant="circular" width={50} height={50} />
          <Box flex={1}>
            <Skeleton variant="text" width="60%" height={24} />
            <Skeleton variant="text" width="40%" height={16} />
          </Box>
        </Box>
      )}
      <Skeleton variant="text" width="80%" height={20} sx={{ mb: 1 }} />
      <Skeleton variant="text" width="100%" height={16} sx={{ mb: 1 }} />
      <Skeleton variant="text" width="60%" height={16} sx={{ mb: 2 }} />
      
      {showChips && (
        <Box display="flex" gap={1} sx={{ mb: 2 }}>
          <Skeleton variant="rounded" width={80} height={24} />
          <Skeleton variant="rounded" width={100} height={24} />
        </Box>
      )}
      
      {showButton && (
        <Skeleton variant="rounded" width="100%" height={36} />
      )}
    </CardContent>
  </Card>
);

interface SkeletonGridProps {
  count?: number;
  columns?: { xs?: number; sm?: number; md?: number; lg?: number };
  showAvatar?: boolean;
  showChips?: boolean;
  showButton?: boolean;
}

export const SkeletonGrid: React.FC<SkeletonGridProps> = ({ 
  count = 6, 
  columns = { xs: 1, sm: 2, md: 3, lg: 4 },
  showAvatar = false,
  showChips = false,
  showButton = false
}) => (
  <Grid container spacing={3}>
    {Array.from({ length: count }).map((_, index) => (
      <Grid key={index} item xs={columns.xs} sm={columns.sm} md={columns.md} lg={columns.lg}>
        <SkeletonCard 
          showAvatar={showAvatar}
          showChips={showChips}
          showButton={showButton}
        />
      </Grid>
    ))}
  </Grid>
);

interface SkeletonListProps {
  count?: number;
  showAvatar?: boolean;
  showSubtitle?: boolean;
}

export const SkeletonList: React.FC<SkeletonListProps> = ({ 
  count = 5, 
  showAvatar = false,
  showSubtitle = false
}) => (
  <Box>
    {Array.from({ length: count }).map((_, index) => (
      <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Box display="flex" alignItems="center" gap={2}>
          {showAvatar && <Skeleton variant="circular" width={40} height={40} />}
          <Box flex={1}>
            <Skeleton variant="text" width="70%" height={20} />
            {showSubtitle && <Skeleton variant="text" width="50%" height={16} sx={{ mt: 0.5 }} />}
          </Box>
          <Skeleton variant="rounded" width={80} height={32} />
        </Box>
      </Box>
    ))}
  </Box>
);

interface SkeletonStatsProps {
  count?: number;
}

export const SkeletonStats: React.FC<SkeletonStatsProps> = ({ count = 3 }) => (
  <Grid container spacing={3}>
    {Array.from({ length: count }).map((_, index) => (
      <Grid key={index} item xs={12} sm={4}>
        <Card 
          sx={{ 
            borderRadius: 4,
            background: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <CardContent sx={{ p: 3, textAlign: 'center' }}>
            <Skeleton variant="circular" width={60} height={60} sx={{ mx: 'auto', mb: 2 }} />
            <Skeleton variant="text" width="40%" height={40} sx={{ mx: 'auto', mb: 1 }} />
            <Skeleton variant="text" width="60%" height={24} sx={{ mx: 'auto' }} />
          </CardContent>
        </Card>
      </Grid>
    ))}
  </Grid>
);

// Facebook-style shimmer effect with better animation
const shimmerKeyframes = {
  '0%': {
    backgroundPosition: '-1000px 0',
  },
  '100%': {
    backgroundPosition: '1000px 0',
  },
};

export const ShimmerBox: React.FC<{ 
  width?: string; 
  height?: string; 
  borderRadius?: string;
  sx?: React.CSSProperties | Record<string, unknown>;
}> = ({ 
  width = '100%', 
  height = '20px', 
  borderRadius = '4px',
  sx
}) => (
  <Box
    sx={{
      width,
      height,
      borderRadius,
      background: 'linear-gradient(90deg, #f0f0f0 0px, #f8f8f8 40px, #f0f0f0 80px)',
      backgroundSize: '1000px 100%',
      animation: 'shimmer 2s infinite linear',
      '@keyframes shimmer': shimmerKeyframes,
      ...sx,
    }}
  />
);

// Dark mode shimmer
export const DarkShimmerBox: React.FC<{ width?: string; height?: string; borderRadius?: string }> = ({ 
  width = '100%', 
  height = '20px', 
  borderRadius = '4px' 
}) => (
  <Box
    sx={{
      width,
      height,
      borderRadius,
      background: 'linear-gradient(90deg, #2a2a2a 0px, #3a3a3a 40px, #2a2a2a 80px)',
      backgroundSize: '1000px 100%',
      animation: 'shimmer 2s infinite linear',
      '@keyframes shimmer': shimmerKeyframes,
    }}
  />
);

// Assignment Card Skeleton (Facebook style)
interface AssignmentCardSkeletonProps {
  count?: number;
}

export const AssignmentCardSkeleton: React.FC<AssignmentCardSkeletonProps> = ({ count = 6 }) => (
  <Grid container spacing={2}>
    {Array.from({ length: count }).map((_, index) => (
      <Grid item xs={12} md={6} key={index}>
        <Card
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
          }}
        >
          {/* Header skeleton */}
          <Box
            sx={{
              background: 'linear-gradient(90deg, #f0f0f0 0px, #f8f8f8 40px, #f0f0f0 80px)',
              backgroundSize: '1000px 100%',
              animation: 'shimmer 2s infinite linear',
              '@keyframes shimmer': shimmerKeyframes,
              p: 2,
              pb: 1.5,
            }}
          >
            <Box display="flex" alignItems="center" gap={1} sx={{ mb: 1 }}>
              <ShimmerBox width="28px" height="28px" borderRadius="50%" />
              <ShimmerBox width="60%" height="24px" borderRadius="4px" />
              <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5 }}>
                <ShimmerBox width="32px" height="32px" borderRadius="4px" />
                <ShimmerBox width="32px" height="32px" borderRadius="4px" />
              </Box>
            </Box>
          </Box>

          <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2.5 }}>
            {/* Description skeleton */}
            <Box sx={{ mb: 2 }}>
              <ShimmerBox width="100%" height="16px" borderRadius="4px" sx={{ mb: 1 }} />
              <ShimmerBox width="90%" height="16px" borderRadius="4px" sx={{ mb: 1 }} />
              <ShimmerBox width="70%" height="16px" borderRadius="4px" />
            </Box>

            {/* Chips skeleton */}
            <Box display="flex" gap={1} flexWrap="wrap" sx={{ mb: 2 }}>
              <ShimmerBox width="140px" height="24px" borderRadius="16px" />
              <ShimmerBox width="80px" height="24px" borderRadius="16px" />
              <ShimmerBox width="100px" height="24px" borderRadius="16px" />
            </Box>

            {/* Attachments skeleton */}
            <Box sx={{ mb: 2 }}>
              <ShimmerBox width="120px" height="14px" borderRadius="4px" sx={{ mb: 1 }} />
              <Box sx={{ mb: 0.5 }}>
                <ShimmerBox width="100%" height="48px" borderRadius="4px" />
              </Box>
            </Box>

            {/* Button skeleton */}
            <Box sx={{ mt: 'auto', pt: 2 }}>
              <ShimmerBox width="100%" height="36px" borderRadius="4px" />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    ))}
  </Grid>
);
