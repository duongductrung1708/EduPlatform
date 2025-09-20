import React from 'react';
import { Box, Chip, Tooltip } from '@mui/material';
import { Wifi as WifiIcon, WifiOff as WifiOffIcon } from '@mui/icons-material';
import { useAdminWebSocket } from '../hooks/useAdminWebSocket';

const RealTimeStatus: React.FC = () => {
  const { isConnected } = useAdminWebSocket();

  return (
    <Tooltip title={isConnected ? 'Kết nối real-time' : 'Mất kết nối real-time'}>
      <Chip
        icon={isConnected ? <WifiIcon /> : <WifiOffIcon />}
        label={isConnected ? 'Real-time' : 'Offline'}
        color={isConnected ? 'success' : 'error'}
        size="small"
        variant="outlined"
      />
    </Tooltip>
  );
};

export default RealTimeStatus;
