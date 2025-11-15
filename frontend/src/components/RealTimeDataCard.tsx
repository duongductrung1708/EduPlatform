import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  Tooltip,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
} from '@mui/icons-material';
import { useAdminWebSocket } from '../hooks/useAdminWebSocket';

interface RealTimeDataCardProps {
  title: string;
  value: number;
  previousValue?: number;
  icon: React.ReactNode;
  color?: string;
  unit?: string;
  loading?: boolean;
}

const RealTimeDataCard: React.FC<RealTimeDataCardProps> = ({
  title,
  value,
  previousValue,
  icon,
  color = '#EF5B5B',
  unit = '',
  loading = false,
}) => {
  const { isConnected, requestAnalytics } = useAdminWebSocket();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    requestAnalytics();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const getTrendIcon = () => {
    if (!previousValue) return null;
    if (value > previousValue) return <TrendingUpIcon color="success" />;
    if (value < previousValue) return <TrendingDownIcon color="error" />;
    return null;
  };

  const getTrendPercentage = () => {
    if (!previousValue || previousValue === 0) return 0;
    return Math.round(((value - previousValue) / previousValue) * 100);
  };

  const trendPercentage = getTrendPercentage();

  return (
    <Card sx={{ 
      borderRadius: 3, 
      background: `linear-gradient(45deg, ${color} 30%, ${color}CC 90%)`, 
      color: 'white',
      position: 'relative',
      overflow: 'visible'
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {icon}
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {title}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Real-time Status */}
            <Tooltip title={isConnected ? 'Real-time data' : 'Offline data'}>
              <Chip
                icon={isConnected ? <WifiIcon /> : <WifiOffIcon />}
                label=""
                color={isConnected ? 'success' : 'error'}
                size="small"
                sx={{ 
                  minWidth: 'auto',
                  '& .MuiChip-icon': { fontSize: 16 }
                }}
              />
            </Tooltip>

            {/* Refresh Button */}
            <Tooltip title="Làm mới dữ liệu">
              <IconButton 
                onClick={handleRefresh} 
                size="small"
                sx={{ 
                  color: 'white',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
                }}
                disabled={isRefreshing}
              >
                <RefreshIcon sx={{ 
                  fontSize: 18,
                  animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' },
                  }
                }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1 }}>
          <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
            {loading ? '...' : value.toLocaleString()}
          </Typography>
          {unit && (
            <Typography variant="h6" sx={{ opacity: 0.8 }}>
              {unit}
            </Typography>
          )}
        </Box>

        {/* Trend Indicator */}
        {previousValue && trendPercentage !== 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {getTrendIcon()}
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {trendPercentage > 0 ? '+' : ''}{trendPercentage}% so với trước
            </Typography>
          </Box>
        )}

        {/* Loading Indicator */}
        {loading && (
          <LinearProgress 
            sx={{ 
              mt: 1, 
              backgroundColor: 'rgba(255,255,255,0.3)',
              '& .MuiLinearProgress-bar': {
                backgroundColor: 'white'
              }
            }} 
          />
        )}
      </CardContent>
    </Card>
  );
};

export default RealTimeDataCard;
