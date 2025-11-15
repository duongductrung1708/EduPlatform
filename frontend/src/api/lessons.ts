import { apiClient } from './client';

export interface LessonAttachment {
  url: string;
  type: string;
  name?: string;
  size?: number;
}

export interface LessonItem {
  _id: string;
  title: string;
  contentHtml?: string;
  attachments?: LessonAttachment[];
  order?: number;
  topic?: string;
  week?: number;
  tags?: string[];
  createdAt?: string;
}

export const lessonsApi = {
  async list(classroomId: string): Promise<LessonItem[]> {
    const res = await apiClient.get(`/api/classes/${classroomId}/lessons`);
    return res.data?.lessons || res.data || [];
  },
  async create(classroomId: string, payload: { title: string; contentHtml?: string; attachments?: LessonAttachment[]; order?: number; topic?: string; week?: number; tags?: string[]; }): Promise<LessonItem> {
    const res = await apiClient.post(`/api/classes/${classroomId}/lessons`, payload);
    return res.data;
  },
  async update(classroomId: string, lessonId: string, payload: Partial<{ title: string; contentHtml: string; attachments: LessonAttachment[]; order: number; topic: string; week: number; tags: string[]; }>): Promise<LessonItem> {
    const res = await apiClient.patch(`/api/classes/${classroomId}/lessons/${lessonId}`, payload);
    return res.data;
  },
  async remove(classroomId: string, lessonId: string): Promise<void> {
    await apiClient.delete(`/api/classes/${classroomId}/lessons/${lessonId}`);
  },
  async getDetail(classroomId: string, lessonId: string): Promise<LessonItem> {
    const res = await apiClient.get(`/api/classes/${classroomId}/lessons/${lessonId}/detail`);
    return res.data;
  },
};


