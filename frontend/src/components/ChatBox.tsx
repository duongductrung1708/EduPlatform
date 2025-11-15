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
import { resolveFileUrl } from '../utils/url';
import { usersApi } from '../api/users';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/EditOutlined';

interface Message {
  id?: string;
  classroomId: string;
  message: string;
  user: { id: string; name: string; avatarUrl?: string };
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
  const [userInfoCache, setUserInfoCache] = useState<Record<string, { name: string; avatarUrl?: string }>>({});
  
  useEffect(() => {
    (async () => {
          try {
            if (classroomId) {
              const res = await getClassMembers(classroomId);
              // Add current user to members if not already present
              const membersList = res as any;
          if (user && !membersList.find((m: any) => String((m as any)._id || (m as any).id || '') === String((user as any).id || (user as any)._id || ''))) {
            // Try to get current user info with avatar
            try {
              const currentUserInfo = await usersApi.getMe();
              const currentUserMember = {
                _id: (user as any).id || (user as any)._id,
                name: currentUserInfo.name || user.name,
                email: currentUserInfo.email || user.email,
                avatarUrl: currentUserInfo.avatar || (currentUserInfo as any).avatarUrl,
              };
              membersList.push(currentUserMember);
            } catch {
              // Fallback if API fails
              const currentUserMember = {
                _id: (user as any).id || (user as any)._id,
                name: user.name,
                email: user.email,
                avatarUrl: undefined,
              };
              membersList.push(currentUserMember);
            }
          }
          setMembers(membersList);
        }
        } catch (err) {
          setMembers([]);
        }
    })();
  }, [classroomId, user]);
  const currentUserId = String((user as any)?.id || (user as any)?._id || '');

  // Load chat history
  useEffect(() => {
    (async () => {
      try {
        let loadedMessages: Message[] = [];
        if (lessonId) {
          const hist = await listLessonMessages(lessonId, 50);
          loadedMessages = hist.reverse().map(m => ({ 
            id: (m as any)._id, 
            classroomId: '', 
            message: m.message, 
            user: { 
              id: m.authorId, 
              name: m.authorName,
              avatarUrl: (m as any).authorAvatarUrl,
            }, 
            timestamp: m.createdAt 
          }));
        } else if (classroomId) {
          const hist = await listClassMessages(classroomId, 50);
          loadedMessages = hist.reverse().map(m => ({ 
            id: (m as any)._id, 
            classroomId: classroomId, 
            message: m.message, 
            user: { 
              id: m.authorId, 
              name: m.authorName,
              avatarUrl: (m as any).authorAvatarUrl,
            }, 
            timestamp: m.createdAt 
          }));
        }
        setMessages(loadedMessages);
        
        // Add message authors to members if not already present
        // Also merge avatarUrl from API members if available
        if (loadedMessages.length > 0) {
          setMembers(prev => {
            const existingIds = new Set(prev.map(m => String((m as any)._id || (m as any).id || '')));
            const newMembers = [...prev];
            const usersNeedingAvatar: string[] = [];
            
            loadedMessages.forEach(msg => {
              const msgUserId = String(msg.user.id || '');
              if (msgUserId) {
                // Check if user already exists in members
                const existingMember = newMembers.find(m => {
                  const memberId = String((m as any)._id || (m as any).id || '');
                  return memberId === msgUserId;
                });
                
                if (existingMember) {
                  // Update name if message has a better name
                  if (msg.user.name && (!existingMember.name || existingMember.name === 'User')) {
                    (existingMember as any).name = msg.user.name;
                  }
                } else {
                  // Add new member from message
                  newMembers.push({
                    _id: msgUserId,
                    name: msg.user.name || 'User',
                    email: '',
                    avatarUrl: undefined, // Will be filled by fetch
                  } as any);
                  // Track users that need avatar fetch
                  usersNeedingAvatar.push(msgUserId);
                }
              }
            });
            
            // Note: Cannot fetch user info from admin API as teacher doesn't have permission
            // Backend should return avatarUrl in message response or members list
            
            return newMembers;
          });
        }
      } catch {}
    })();
  }, [classroomId, lessonId]);

  // Note: Cannot fetch user info from admin API as teacher doesn't have permission
  // Backend should return avatarUrl in message response or ensure all message authors are in members list

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
    // Best-effort: convert any '@Full Name' (from members) to @uid:<id> if exact match is present
    const candidates = (members || []).map((m: any) => ({
      name: (m.name || '').trim(),
      email: (m.email || '').trim(),
      id: String((m as any)._id || (m as any).id || ''),
    })).filter(c => c.id);
    // Sort by longer names first to avoid partial replacements
    candidates.sort((a, b) => b.name.length - a.name.length);
    for (const c of candidates) {
      if (c.name) {
        const namePattern = new RegExp(`@${escapeRegex(c.name)}(?=\s|$)`, 'g');
        out = out.replace(namePattern, `@uid:${c.id}`);
      }
      if (c.email) {
        const emailPattern = new RegExp(`@${escapeRegex(c.email)}(?=\s|$)`, 'g');
        out = out.replace(emailPattern, `@uid:${c.id}`);
      }
    }
    return out;
  };

  const handleSendMessage = () => {
    if (newMessage.trim() && user) {
      const payload = transformOutgoingMentions(newMessage.trim());
      const userId = String((user as any).id || (user as any)._id || '');
      if (lessonId) {
        sendLessonMessage(lessonId, payload, { id: userId, name: user.name });
      } else if (classroomId) {
        sendMessage(classroomId, payload, { id: userId, name: user.name });
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
  const [deleteAnchorEl, setDeleteAnchorEl] = useState<HTMLElement | null>(null);

  const requestDelete = (id?: string, event?: React.MouseEvent<HTMLElement>) => {
    if (!id) return;
    setDeleteTargetId(id);
    setDeleteAnchorEl(event?.currentTarget || null);
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
      setDeleteAnchorEl(null);
    } catch {
      // ignore
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setConfirmOpen(false);
    setDeleteTargetId(null);
    setDeleteAnchorEl(null);
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
          {messages.map((msg, index) => {
            // Find user avatar from members list - try multiple ID formats
            const msgUserId = String(msg.user.id || '');
            const userMember = members.find((m) => {
              const memberId = String((m as any)._id || (m as any).id || '');
              return memberId === msgUserId || memberId.replace(/^ObjectId\(|\)$/g, '') === msgUserId;
            });
            
            // Priority: message avatarUrl > members list > cache
            let rawAvatarUrl = msg.user.avatarUrl || (userMember as any)?.avatarUrl || (userMember as any)?.avatar;
            let displayName = msg.user.name || (userMember?.name || userMember?.email || 'User');
            
            // If not found in members or message, use cache
            if (!rawAvatarUrl && userInfoCache[msgUserId]) {
              displayName = userInfoCache[msgUserId].name || displayName;
              rawAvatarUrl = userInfoCache[msgUserId].avatarUrl || rawAvatarUrl;
            }
            
            const avatarUrl = rawAvatarUrl ? resolveFileUrl(rawAvatarUrl) : undefined;
            
            return (
              <ListItem key={index} alignItems="flex-start"
                secondaryAction={canDelete(msg.user.id) ? (
                  <IconButton edge="end" aria-label="delete" onClick={(e) => requestDelete(msg.id, e)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                ) : undefined}
              >
                <Avatar 
                  src={avatarUrl || undefined}
                  sx={{ mr: 1, bgcolor: 'primary.main' }}
                >
                  {displayName.charAt(0).toUpperCase()}
                </Avatar>
                <ListItemText
                  primary={displayName}
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
            );
          })}
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
                        <Avatar 
                          src={
                            (u as any).avatarUrl 
                              ? resolveFileUrl((u as any).avatarUrl) || undefined
                              : undefined
                          }
                        >
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

      <Popper
        open={confirmOpen}
        anchorEl={deleteAnchorEl}
        placement="bottom-end"
        sx={{ zIndex: 1300 }}
      >
        <ClickAwayListener onClickAway={handleCancelDelete}>
          <Paper sx={{ p: 2, minWidth: 200, boxShadow: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Xóa tin nhắn?
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
              Bạn có chắc muốn xóa tin nhắn này? Hành động không thể hoàn tác.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button 
                size="small" 
                onClick={handleCancelDelete} 
                disabled={deleting}
              >
                Hủy
              </Button>
              <Button 
                size="small" 
                color="error" 
                variant="contained" 
                onClick={handleConfirmDelete} 
                disabled={deleting}
              >
                {deleting ? 'Đang xóa...' : 'Xóa'}
              </Button>
            </Box>
          </Paper>
        </ClickAwayListener>
      </Popper>
    </Paper>
  );
};
