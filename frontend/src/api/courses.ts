import { apiClient } from './client';

export interface CourseItem {
  _id: string;
  title: string;
  slug: string;
  category?: string;
  level?: string;
  description?: string;
  detailedDescription?: string;
  tags?: string[];
  visibility?: 'public' | 'private';
  status?: 'draft' | 'published' | 'archived';
  enrollmentCount?: number;
  averageRating?: number;
  totalRatings?: number;
  featured?: boolean;
  allowComments?: boolean;
  estimatedDuration?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  prerequisites?: string[];
  learningObjectives?: string[];
  createdBy?: {
    _id: string;
    name: string;
    email: string;
  };
}

export const coursesApi = {
  async listAll(page = 1, limit = 100, search?: string): Promise<{ items: CourseItem[]; total: number; page: number; limit: number; totalPages: number; }> {
    const res = await apiClient.get('/api/courses', { params: { page, limit, q: search } });
    const data = res.data;
    return {
      items: data.courses || [],
      total: data.total || 0,
      page: data.page || page,
      limit: data.limit || limit,
      totalPages: data.totalPages || 1,
    };
  },
  async listPublic(page = 1, limit = 100, search?: string, tags?: string[]): Promise<{ items: CourseItem[]; total: number; page: number; totalPages: number; }> {
    const params: any = { page, limit };
    if (search) params.q = search;
    if (tags && tags.length) params.tags = tags.join(',');
    const res = await apiClient.get('/api/courses/public/list', { params });
    const data = res.data;
    return {
      items: data.courses || [],
      total: data.total || 0,
      page: data.page || page,
      totalPages: data.totalPages || 1,
    };
  },
  async getById(id: string): Promise<CourseItem> {
    const res = await apiClient.get(`/api/courses/${id}`);
    return res.data;
  },
  async update(id: string, payload: { title?: string; description?: string; category?: string; level?: string; tags?: string[]; visibility?: string; status?: string }): Promise<CourseItem> {
    const res = await apiClient.patch(`/api/courses/${id}`, payload);
    return res.data;
  },
  async delete(id: string): Promise<{ message: string }> {
    const res = await apiClient.delete(`/api/courses/${id}`);
    return res.data;
  },
  async createPublic(payload: {
    title: string;
    slug: string;
    description: string;
    category: string;
    level: string;
    visibility: 'public';
    status?: 'draft' | 'published' | 'archived';
    thumbnail?: string;
    tags?: string[];
  }): Promise<CourseItem> {
    const res = await apiClient.post('/api/courses', payload);
    return res.data;
  },
  async enroll(courseId: string): Promise<{ message: string }> {
    const res = await apiClient.post(`/api/courses/${courseId}/enroll`);
    return res.data;
  },
  async checkEnrollment(courseId: string): Promise<{ enrolled: boolean; progress: number; rating?: number; review?: string }> {
    const res = await apiClient.get(`/api/courses/${courseId}/enrollment`);
    return res.data;
  },
  async getModules(courseId: string): Promise<any[]> {
    const res = await apiClient.get(`/api/courses/${courseId}/modules`);
    return res.data;
  },
  async createModule(courseId: string, payload: { title: string; description: string; order?: number; volume?: string; estimatedDuration?: number; isPublished?: boolean; }): Promise<any> {
    const res = await apiClient.post(`/api/courses/${courseId}/modules`, payload);
    return res.data;
  },
  async getLessons(moduleId: string): Promise<any[]> {
    const res = await apiClient.get(`/api/courses/modules/${moduleId}/lessons`);
    return res.data;
  },
  async createLesson(moduleId: string, payload: { title: string; description: string; type: 'document'|'video'|'interactive'|'quiz'|'assignment'; order?: number; content?: any; estimatedDuration?: number; isPublished?: boolean; }): Promise<any> {
    const res = await apiClient.post(`/api/courses/modules/${moduleId}/lessons`, payload);
    return res.data;
  },
  async completeLesson(lessonId: string): Promise<{ message: string }> {
    const res = await apiClient.post(`/api/lessons/${lessonId}/complete`);
    return res.data;
  },
  async rateCourse(courseId: string, rating: number, review?: string): Promise<{ message: string }> {
    const res = await apiClient.post(`/api/courses/${courseId}/rate`, { rating, review });
    return res.data;
  },
  async getMyEnrolled(): Promise<CourseItem[]> {
    try {
      const res = await apiClient.get('/api/courses/my-enrolled');
      return res.data.courses || [];
    } catch (error) {
      // If endpoint doesn't exist, return empty array
      return [];
    }
  },
  async getPublic(): Promise<CourseItem[]> {
    try {
      const res = await apiClient.get('/api/courses/public');
      return res.data.courses || [];
    } catch (error) {
      // Fallback to listPublic method
      const res = await this.listPublic(1, 100);
      return res.items || [];
    }
  },
  async getMyCourses(): Promise<CourseItem[]> {
    try {
      const res = await apiClient.get('/api/courses/my-courses');
      return res.data.courses || [];
    } catch (error) {
      return [];
    }
  },
  async updateModule(courseId: string, moduleId: string, payload: { title?: string; description?: string; order?: number; volume?: string; estimatedDuration?: number; isPublished?: boolean }): Promise<any> {
    const res = await apiClient.patch(`/api/courses/modules/${moduleId}`, payload);
    return res.data;
  },
  async deleteModule(courseId: string, moduleId: string): Promise<{ message: string }> {
    const res = await apiClient.delete(`/api/courses/${courseId}/modules/${moduleId}`);
    return res.data;
  },
  async updateLesson(moduleId: string, lessonId: string, payload: { title?: string; description?: string; type?: 'document'|'video'|'interactive'|'quiz'|'assignment'; order?: number; content?: any; estimatedDuration?: number; isPublished?: boolean }): Promise<any> {
    const res = await apiClient.patch(`/api/courses/modules/${moduleId}/lessons/${lessonId}`, payload);
    return res.data;
  },
  async deleteLesson(moduleId: string, lessonId: string): Promise<{ message: string }> {
    const res = await apiClient.delete(`/api/courses/modules/${moduleId}/lessons/${lessonId}`);
    return res.data;
  },
  async getEnrollments(courseId: string): Promise<{ students: any[] }> {
    const res = await apiClient.get(`/api/courses/${courseId}/enrollments`);
    return res.data || { students: [] };
  },
  async addStudent(courseId: string, studentEmail: string): Promise<any> {
    const res = await apiClient.post(`/api/courses/${courseId}/enrollments`, { studentEmail });
    return res.data;
  },
  async removeStudent(courseId: string, studentId: string): Promise<{ message: string }> {
    const res = await apiClient.delete(`/api/courses/${courseId}/enrollments/${studentId}`);
    return res.data;
  },
};


