import { apiClient } from './client';

export interface AssignmentAttachment {
  url: string;
  type: string;
  name?: string;
  size?: number;
}

export interface AssignmentItem {
  _id: string;
  title: string;
  description?: string;
  attachments?: AssignmentAttachment[];
  dueDate?: string;
  totalPoints?: number;
  createdAt?: string;
}

export const assignmentsApi = {
  async list(classroomId: string): Promise<AssignmentItem[]> {
    const res = await apiClient.get(`/api/classes/${classroomId}/assignments`);
    return res.data?.assignments || res.data || [];
  },
  async getById(classroomId: string, assignmentId: string): Promise<AssignmentItem> {
    const res = await apiClient.get(`/api/classes/${classroomId}/assignments/${assignmentId}`);
    return res.data;
  },
  async create(classroomId: string, payload: { title: string; description?: string; attachments?: AssignmentAttachment[]; dueDate?: string; totalPoints?: number; }): Promise<AssignmentItem> {
    const res = await apiClient.post(`/api/classes/${classroomId}/assignments`, payload);
    return res.data;
  },
  async listSubmissions(classroomId: string, assignmentId: string): Promise<any[]> {
    const res = await apiClient.get(`/api/classes/${classroomId}/assignments/${assignmentId}/submissions`);
    return res.data?.submissions || res.data || [];
  },
  async getMySubmission(classroomId: string, assignmentId: string): Promise<any | null> {
    const res = await apiClient.get(`/api/classes/${classroomId}/assignments/${assignmentId}/my-submission`);
    return res.data || null;
  },
  async submit(classroomId: string, assignmentId: string, payload: { contentText?: string; attachments?: AssignmentAttachment[]; }): Promise<any> {
    const res = await apiClient.post(`/api/classes/${classroomId}/assignments/${assignmentId}/submissions`, payload);
    return res.data;
  },
  async grade(classroomId: string, assignmentId: string, submissionId: string, payload: { grade?: number; feedback?: string; }): Promise<any> {
    const res = await apiClient.patch(`/api/classes/${classroomId}/assignments/${assignmentId}/submissions/${submissionId}/grade`, payload);
    return res.data;
  },
  async update(classroomId: string, assignmentId: string, payload: { title?: string; description?: string; attachments?: AssignmentAttachment[]; dueDate?: string; totalPoints?: number; }): Promise<AssignmentItem> {
    const res = await apiClient.patch(`/api/classes/${classroomId}/assignments/${assignmentId}`, payload);
    return res.data;
  },
  async delete(classroomId: string, assignmentId: string): Promise<{ message: string }> {
    const res = await apiClient.delete(`/api/classes/${classroomId}/assignments/${assignmentId}`);
    return res.data;
  },
};


