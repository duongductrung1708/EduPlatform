import { apiClient } from './client';

export interface DashboardStats {
  totalUsers: number;
  totalCourses: number;
  totalClassrooms: number;
  totalAssignments: number;
  activeUsers: number;
  newUsersThisMonth: number;
  coursesCompleted: number;
  averageCompletionRate: number;
  usersByRole: {
    admin: number;
    teacher: number;
    student: number;
    parent: number;
  };
  coursesByCategory: Array<{
    category: string;
    count: number;
  }>;
  monthlyStats: Array<{
    month: string;
    users: number;
    courses: number;
    classrooms: number;
  }>;
}

export interface RecentActivity {
  id: string;
  type: 'user_registered' | 'course_created' | 'classroom_joined' | 'assignment_submitted';
  user: string;
  description: string;
  timestamp: string;
}

export interface TopCourse {
  id: string;
  title: string;
  students: number;
  completionRate: number;
  rating: number;
}

export const adminApi = {
  // Dashboard stats
  getDashboardStats: async (): Promise<DashboardStats> => {
    try {
      const response = await apiClient.get('/api/admin/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('Admin API - Dashboard stats error:', error);
      throw error;
    }
  },

  // Recent activity
  getRecentActivity: async (limit: number = 10): Promise<RecentActivity[]> => {
    const response = await apiClient.get(`/api/admin/dashboard/activity?limit=${limit}`);
    return response.data;
  },

  // Top courses
  getTopCourses: async (limit: number = 10): Promise<TopCourse[]> => {
    const response = await apiClient.get(`/api/admin/dashboard/top-courses?limit=${limit}`);
    return response.data;
  },

  // User management
  getAllUsers: async (page: number = 1, limit: number = 10, role?: string, search?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (role) params.append('role', role);
    if (search) params.append('search', search);
    
    const response = await apiClient.get(`/api/admin/users?${params}`);
    return response.data;
  },

  getUserById: async (id: string) => {
    const response = await apiClient.get(`/api/admin/users/${id}`);
    return response.data;
  },

  updateUser: async (id: string, data: any) => {
    const response = await apiClient.put(`/api/admin/users/${id}`, data);
    return response.data;
  },

  deleteUser: async (id: string) => {
    const response = await apiClient.delete(`/api/admin/users/${id}`);
    return response.data;
  },

  // Course management
  getAllCourses: async (page: number = 1, limit: number = 10, status?: string, search?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    
    const response = await apiClient.get(`/api/admin/courses?${params}`);
    return response.data;
  },

  updateCourseStatus: async (id: string, status: string) => {
    const response = await apiClient.put(`/api/admin/courses/${id}/status`, { status });
    return response.data;
  },

  createCourse: async (data: {
    title: string;
    slug?: string;
    description: string;
    category: string;
    level: string;
    visibility: 'public' | 'private';
    status?: 'draft' | 'published' | 'archived';
    thumbnail?: string;
    tags?: string[];
    teacherId: string;
  }) => {
    const response = await apiClient.post('/api/admin/courses', data);
    return response.data;
  },

  // Classroom management
  getAllClassrooms: async (page: number = 1, limit: number = 10, status?: string, search?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    
    const response = await apiClient.get(`/api/admin/classrooms?${params}`);
    return response.data;
  },

  updateClassroomStatus: async (id: string, status: string) => {
    const response = await apiClient.put(`/api/admin/classrooms/${id}/status`, { status });
    return response.data;
  },

  getClassroomStats: async () => {
    const response = await apiClient.get('/api/admin/classrooms/stats');
    return response.data;
  },

  // Analytics
  getAnalyticsData: async () => {
    const response = await apiClient.get('/api/admin/analytics');
    return response.data;
  },
};

// Teacher/Classes APIs (reusing same client, not restricted to admin only)
export interface ClassroomCreatePayload {
  title: string;
  courseId?: string;
  startDate?: string;
  endDate?: string;
  timezone?: string;
}

export interface ClassroomItem {
  _id: string;
  title: string;
  inviteCode?: string;
  studentIds?: string[];
  teacherIds?: string[];
  createdAt?: string;
}

export const classesApi = {
  async listMy(page = 1, limit = 12): Promise<{ items: ClassroomItem[]; total: number; page: number; limit: number; totalPages: number; }> {
    const res = await apiClient.get('/api/classes', { params: { page, limit } });
    // Backend returns paginated classrooms; normalize to items
    const data = res.data;
    return {
      items: data.classrooms || data.items || data,
      total: data.total || 0,
      page: data.page || page,
      limit: data.limit || limit,
      totalPages: data.totalPages || 1,
    };
  },
  async create(payload: ClassroomCreatePayload): Promise<ClassroomItem> {
    const res = await apiClient.post('/api/classes', payload);
    return res.data;
  },
  async join(inviteCode: string): Promise<ClassroomItem> {
    const res = await apiClient.post('/api/classes/join', { inviteCode });
    return res.data;
  },
  async getById(id: string): Promise<any> {
    const res = await apiClient.get(`/api/classes/${id}`);
    return res.data;
  },
  async update(id: string, data: any): Promise<any> {
    const res = await apiClient.patch(`/api/classes/${id}` , data);
    return res.data;
  },
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/api/classes/${id}`);
  },
  async removeStudent(classId: string, studentId: string): Promise<void> {
    await apiClient.delete(`/api/classes/${classId}/students/${studentId}`);
  },
  async addStudent(classId: string, studentId: string): Promise<any> {
    const res = await apiClient.post(`/api/classes/${classId}/students`, { studentId });
    return res.data;
  },
  async getStudents(classId: string): Promise<any[]> {
    const res = await apiClient.get(`/api/classes/${classId}/students`);
    return res.data;
  },
  async findStudentByEmail(email: string): Promise<any> {
    const res = await apiClient.get('/api/classes/find-student', { params: { email } });
    return res.data;
  },
};