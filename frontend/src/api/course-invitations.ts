import { apiClient } from './client';

export interface CourseInvitation {
  _id: string;
  courseId: {
    _id: string;
    title: string;
    description: string;
    category: string;
    level: string;
  };
  teacherId: {
    _id: string;
    name: string;
    email: string;
  };
  studentId: {
    _id: string;
    name: string;
    email: string;
  };
  courseTitle: string;
  teacherName: string;
  studentEmail: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expiresAt: string;
  message?: string;
  createdAt: string;
}

export const courseInvitationsApi = {
  // Create invitation (teacher/admin only)
  async createInvitation(data: {
    courseId: string;
    studentEmail: string;
    message?: string;
  }): Promise<CourseInvitation> {
    const res = await apiClient.post('/api/course-invitations', data);
    return res.data;
  },

  // Get student invitations
  async getMyInvitations(): Promise<CourseInvitation[]> {
    const res = await apiClient.get('/api/course-invitations/my-invitations');
    return res.data;
  },

  // Get teacher sent invitations
  async getSentInvitations(): Promise<CourseInvitation[]> {
    const res = await apiClient.get('/api/course-invitations/sent-invitations');
    return res.data;
  },

  // Get invitation by ID
  async getInvitation(invitationId: string): Promise<CourseInvitation> {
    const res = await apiClient.get(`/api/course-invitations/${invitationId}`);
    return res.data;
  },

  // Accept invitation
  async acceptInvitation(invitationId: string): Promise<any> {
    const res = await apiClient.put(`/api/course-invitations/${invitationId}/accept`);
    return res.data;
  },

  // Decline invitation
  async declineInvitation(invitationId: string): Promise<any> {
    const res = await apiClient.put(`/api/course-invitations/${invitationId}/decline`);
    return res.data;
  },

  // Cancel invitation (teacher/admin only)
  async cancelInvitation(invitationId: string): Promise<any> {
    const res = await apiClient.delete(`/api/course-invitations/${invitationId}`);
    return res.data;
  }
};
