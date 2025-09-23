import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Avatar,
  Popper,
  ClickAwayListener,
  ListItemAvatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../contexts/AuthContext';
import { UserLite } from '../api/users';
import { getClassMembers } from '../api/classrooms';
import { listClassMessages, listLessonMessages, deleteMessage } from '../api/chat';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/EditOutlined';

interface Message {
  id?: string;
  classroomId: string;
  message: string;
  user: { id: string; name: string };
  timestamp: string;
}

interface ChatBoxProps {
  classroomId?: string;
  lessonId?: string;
}

function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const ChatBox: React.FC<ChatBoxProps> = ({ classroomId, lessonId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [suggestions, setSuggestions] = useState<UserLite[]>([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const searchTimerRef = useRef<number | null>(null);
  const { user } = useAuth();
  const { joinClassroom, joinLesson, sendMessage, sendLessonMessage, onClassMessage, onLessonMessage, onJoinedClassroom, offClassMessage, offLessonMessage, offJoinedClassroom, on, off } = useSocket();

  // Track mentions selected in composer: map displayName -> userId
  const [mentionMap, setMentionMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      if (classroomId) joinClassroom(classroomId);
      if (lessonId) joinLesson(lessonId);
    }
  }, [classroomId, lessonId, user, joinClassroom, joinLesson]);

  const [members, setMembers] = useState<Array<UserLite & { avatarUrl?: string }>>([]);
  useEffect(() => {
    (async () => {
      try {
        if (classroomId) {
          const res = await getClassMembers(classroomId);
          setMembers(res as any);
        }
      } catch {
        setMembers([]);
      }
    })();
  }, [classroomId]);
  const currentUserId = String((user as any)?.id || (user as any)?._id || '');

  // Load chat history
  useEffect(() => {
    (async () => {
      try {
        if (lessonId) {
          const hist = await listLessonMessages(lessonId, 50);
          setMessages(hist.reverse().map(m => ({ id: (m as any)._id, classroomId: '', message: m.message, user: { id: m.authorId, name: m.authorName }, timestamp: m.createdAt })));
        } else if (classroomId) {
          const hist = await listClassMessages(classroomId, 50);
          setMessages(hist.reverse().map(m => ({ id: (m as any)._id, classroomId: classroomId, message: m.message, user: { id: m.authorId, name: m.authorName }, timestamp: m.createdAt })));
        }
      } catch {}
    })();
  }, [classroomId, lessonId]);

  useEffect(() => {
    const handleJoinedClassroom = (data: { classroomId: string }) => {};

    const handleClassMessage = (data: Message) => {
      setMessages(prev => [...prev, data]);
    };
    const handleLessonMessage = (data: any) => {
      setMessages(prev => [...prev, data]);
    };

    const handleClassMessageDeleted = (data: { id: string }) => {
      setMessages(prev => prev.filter(m => String(m.id || '') !== String(data.id)));
    };
    const handleLessonMessageDeleted = (data: { id: string }) => {
      setMessages(prev => prev.filter(m => String(m.id || '') !== String(data.id)));
    };

    onJoinedClassroom(handleJoinedClassroom);
    onClassMessage(handleClassMessage);
    onLessonMessage(handleLessonMessage);
    on('classMessageDeleted', handleClassMessageDeleted);
    on('lessonMessageDeleted', handleLessonMessageDeleted);

    return () => {
      offJoinedClassroom(handleJoinedClassroom);
      offClassMessage(handleClassMessage);
      offLessonMessage(handleLessonMessage);
      off('classMessageDeleted', handleClassMessageDeleted);
      off('lessonMessageDeleted', handleLessonMessageDeleted);
    };
  }, [onJoinedClassroom, onClassMessage, onLessonMessage, offLessonMessage, on, off]);

  const transformOutgoingMentions = (text: string) => {
    let out = text;
    for (const [name, id] of Object.entries(mentionMap)) {
      if (!name || !id) continue;
      // Replace '@Display Name' when followed by whitespace or end of string
      const pattern = new RegExp(`@${escapeRegex(name)}(?=\s|$)`, 'g');
      out = out.replace(pattern, `@uid:${id}`);
    }
    return out;
  };

  const handleSendMessage = () => {
    if (newMessage.trim() && user) {
      const payload = transformOutgoingMentions(newMessage.trim());
      if (lessonId) {
        sendLessonMessage(lessonId, payload, { id: user.id, name: user.name });
      } else if (classroomId) {
        sendMessage(classroomId, payload, { id: user.id, name: user.name });
      }
      setNewMessage('');
      setShowSuggest(false);
      setSuggestions([]);
      setMentionMap({});
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (showSuggest && suggestions.length > 0) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedIndex((i) => (i + 1) % suggestions.length);
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        applyMention(suggestions[selectedIndex]);
        return;
      }
      if (event.key === 'Escape') {
        setShowSuggest(false);
        return;
      }
    }
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewMessage(val);
    const atIndex = val.lastIndexOf('@');
    if (atIndex >= 0) {
      const query = val.slice(atIndex + 1).trim();
      if (query.length >= 1 || val.endsWith('@')) {
        if (searchTimerRef.current) window.clearTimeout(searchTimerRef.current);
        searchTimerRef.current = window.setTimeout(() => {
          const q = query.toLowerCase();
          const pool = (members || []).filter((m: any) => String(m?._id || m?.id || '') !== currentUserId);
          const res = q
            ? pool.filter((m: any) => (m.name || '').toLowerCase().includes(q) || (m.email || '').toLowerCase().includes(q)).slice(0, 8)
            : pool.slice(0, 8);
          setSuggestions(res as any);
          setShowSuggest(res.length > 0);
          setSelectedIndex(0);
        }, 150);
        return;
      }
    }
    setShowSuggest(false);
  };

  const applyMention = (u: UserLite) => {
    const atIndex = newMessage.lastIndexOf('@');
    const display = u.name || u.email || 'User';
    if (atIndex >= 0) {
      const before = newMessage.slice(0, atIndex);
      const after = newMessage.slice(atIndex);
      // Replace from '@' to the end of token with @Name (human readable)
      const tokenEndMatch = after.match(/^@\S*/);
      const end = tokenEndMatch ? atIndex + tokenEndMatch[0].length : newMessage.length;
      const next = `${before}@${display} ` + newMessage.slice(end);
      setNewMessage(next);
      setShowSuggest(false);
      setMentionMap((prev) => ({ ...prev, [display]: u._id }));
    }
  };

  const canDelete = (authorId: string) => {
    if (!user) return false;
    if (String(user.id) === String(authorId)) return true;
    return user.role === 'teacher' || user.role === 'admin';
  };

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const requestDelete = (id?: string) => {
    if (!id) return;
    setDeleteTargetId(id);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    try {
      await deleteMessage(deleteTargetId);
      setMessages(prev => prev.filter(m => String(m.id || '') !== String(deleteTargetId)));
      setConfirmOpen(false);
      setDeleteTargetId(null);
    } catch {
      // ignore
    } finally {
      setDeleting(false);
    }
  };

  const renderMessage = (text: string) => {
    // Convert @uid:<id> to @Name using members list
    let normalized = text;
    const uidRegex = /@uid:([a-fA-F0-9]{24})/g;
    normalized = normalized.replace(uidRegex, (_m, id) => {
      const found = members.find((m) => String((m as any)._id || '') === String(id));
      const name = (found?.name || found?.email || id) as string;
      return `@${name}`;
    });

    // Highlight full @Name (including spaces)
    const names = (members || [])
      .map((m: any) => (m?.name || '').trim())
      .filter((n: string) => n.length > 0)
      .sort((a: string, b: string) => b.length - a.length);

    if (names.length === 0) {
      const parts = normalized.split(/(@\S+)/g);
      return (
        <>
          {parts.map((p, idx) => (
            p.startsWith('@') ? (
              <Typography key={idx} component="span" sx={{ color: 'primary.main', fontWeight: 600 }}>{p}</Typography>
            ) : (
              <Typography key={idx} component="span">{p}</Typography>
            )
          ))}
        </>
      );
    }

    const escaped = names.map((n) => escapeRegex(n));
    const pattern = new RegExp(`@(${escaped.join('|')})`, 'g');
    const highlighted = [] as React.ReactNode[];

    let lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(normalized)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      if (start > lastIndex) {
        highlighted.push(<Typography key={`t-${lastIndex}`} component="span">{normalized.slice(lastIndex, start)}</Typography>);
      }
      highlighted.push(
        <Typography key={`m-${start}`} component="span" sx={{ color: 'primary.main', fontWeight: 700 }}>{match[0]}</Typography>
      );
      lastIndex = end;
    }
    if (lastIndex < normalized.length) {
      highlighted.push(<Typography key={`t-end`} component="span">{normalized.slice(lastIndex)}</Typography>);
    }

    return <>{highlighted}</>;
  };

  return (
    <Paper sx={{ p: 2, height: 400, display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" gutterBottom>
        Chat lớp học
      </Typography>
      
      <Box sx={{ flex: 1, overflow: 'auto', mb: 2 }}>
        <List>
          {messages.map((msg, index) => (
            <ListItem key={index} alignItems="flex-start"
              secondaryAction={canDelete(msg.user.id) ? (
                <IconButton edge="end" aria-label="delete" onClick={() => requestDelete(msg.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              ) : undefined}
            >
              <Avatar sx={{ mr: 1, bgcolor: 'primary.main' }}>
                {msg.user.name.charAt(0).toUpperCase()}
              </Avatar>
              <ListItemText
                primary={msg.user.name}
                secondary={
                  <Box>
                    <Typography variant="body2" component="div">{renderMessage(msg.message)}</Typography>
                    <Typography variant="caption" color="text.secondary" component="div">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </Typography>
                  </Box>
                }
                secondaryTypographyProps={{ component: 'div' }}
              />
            </ListItem>
          ))}
        </List>
      </Box>

      <Box sx={{ display: 'flex', gap: 1, position: 'relative' }}>
        <TextField
          fullWidth
          placeholder="Nhập tin nhắn..."
          value={newMessage}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          size="small"
          inputRef={(el) => setAnchorEl(el)}
        />
        <Popper open={showSuggest && suggestions.length > 0} anchorEl={anchorEl} placement="top-start" sx={{ zIndex: 1300 }}>
          <ClickAwayListener onClickAway={() => setShowSuggest(false)}>
            <Paper sx={{ maxHeight: 240, overflowY: 'auto', minWidth: 280 }}>
              <List dense>
                {suggestions.map((u, i) => (
                  <ListItem key={u._id} disablePadding>
                    <ListItemButton selected={i === selectedIndex} onClick={() => applyMention(u)}>
                      <ListItemAvatar>
                        <Avatar src={(u as any).avatarUrl || undefined}>
                          {(u.name || u.email || 'U').charAt(0).toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          (() => {
                            const q = (newMessage.slice(newMessage.lastIndexOf('@') + 1).trim() || '').toLowerCase();
                            const source = (u.name || u.email || '').toString();
                            if (!q) return source;
                            const idx = source.toLowerCase().indexOf(q);
                            if (idx < 0) return source;
                            const before = source.slice(0, idx);
                            const match = source.slice(idx, idx + q.length);
                            const after = source.slice(idx + q.length);
                            return (
                              <>
                                {before}
                                <Typography component="span" sx={{ color: 'primary.main', fontWeight: 700 }}>{match}</Typography>
                                {after}
                              </>
                            );
                          })()
                        }
                        secondary={u.email}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Paper>
          </ClickAwayListener>
        </Popper>
        <Button
          variant="contained"
          onClick={handleSendMessage}
          disabled={!newMessage.trim()}
        >
          Gửi
        </Button>
      </Box>

      <Dialog open={confirmOpen} onClose={() => (deleting ? null : setConfirmOpen(false))}>
        <DialogTitle>Xóa tin nhắn?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">Bạn có chắc muốn xóa tin nhắn này? Hành động không thể hoàn tác.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} disabled={deleting}>Hủy</Button>
          <Button color="error" variant="contained" onClick={handleConfirmDelete} disabled={deleting}>
            {deleting ? 'Đang xóa...' : 'Xóa'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};
