import { apiClient } from './client';

export interface ChatMessageItem {
  _id: string;
  classroomId?: string;
  lessonId?: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string;
  message: string;
  createdAt: string;
}

export async function listClassMessages(classroomId: string, limit = 50): Promise<ChatMessageItem[]> {
  const { data } = await apiClient.get('/api/chat/classroom', { params: { classroomId, limit } });
  return Array.isArray(data) ? data : [];
}

export async function listLessonMessages(lessonId: string, limit = 50): Promise<ChatMessageItem[]> {
  const { data } = await apiClient.get('/api/chat/lesson', { params: { lessonId, limit } });
  return Array.isArray(data) ? data : [];
}

export async function editMessage(id: string, message: string): Promise<{ success: boolean }> {
  const { data } = await apiClient.patch(`/api/chat/${id}`, { message });
  return data;
}

export async function deleteMessage(id: string): Promise<{ success: boolean }> {
  const { data } = await apiClient.delete(`/api/chat/${id}`);
  return data;
}


