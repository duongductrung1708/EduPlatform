import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Avatar,
} from '@mui/material';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../contexts/AuthContext';

interface Message {
  classroomId: string;
  message: string;
  user: { id: string; name: string };
  timestamp: string;
}

interface ChatBoxProps {
  classroomId: string;
}

export const ChatBox: React.FC<ChatBoxProps> = ({ classroomId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const { user } = useAuth();
  const { joinClassroom, sendMessage, onClassMessage, onJoinedClassroom } = useSocket();

  useEffect(() => {
    if (classroomId && user) {
      joinClassroom(classroomId);
    }
  }, [classroomId, user, joinClassroom]);

  useEffect(() => {
    const handleJoinedClassroom = (data: { classroomId: string }) => {
      console.log('Joined classroom:', data.classroomId);
    };

    const handleClassMessage = (data: Message) => {
      setMessages(prev => [...prev, data]);
    };

    onJoinedClassroom(handleJoinedClassroom);
    onClassMessage(handleClassMessage);

    return () => {
      // Cleanup listeners
    };
  }, [onJoinedClassroom, onClassMessage]);

  const handleSendMessage = () => {
    if (newMessage.trim() && user) {
      sendMessage(classroomId, newMessage.trim(), { id: user.id, name: user.name });
      setNewMessage('');
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Paper sx={{ p: 2, height: 400, display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" gutterBottom>
        Chat lớp học
      </Typography>
      
      <Box sx={{ flex: 1, overflow: 'auto', mb: 2 }}>
        <List>
          {messages.map((msg, index) => (
            <ListItem key={index} alignItems="flex-start">
              <Avatar sx={{ mr: 1, bgcolor: 'primary.main' }}>
                {msg.user.name.charAt(0).toUpperCase()}
              </Avatar>
              <ListItemText
                primary={msg.user.name}
                secondary={
                  <Box>
                    <Typography variant="body2">{msg.message}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      </Box>

      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          placeholder="Nhập tin nhắn..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          size="small"
        />
        <Button
          variant="contained"
          onClick={handleSendMessage}
          disabled={!newMessage.trim()}
        >
          Gửi
        </Button>
      </Box>
    </Paper>
  );
};
