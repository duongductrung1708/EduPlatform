import { apiClient } from './client';

export interface ProgressData {
  courseId: string;
  enrolledAt: Date;
  completedAt?: Date;
  progress: {
    completedLessons: string[];
    completedModules: string[];
    totalLessons: number;
    totalModules: number;
    percentage: number;
  };
  rating?: number;
  review?: string;
}

export interface BadgeData {
  badge: {
    _id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    criteria: {
      kind: string;
      courseId?: string;
      requiredScore?: number;
      requiredStreak?: number;
      customCondition?: string;
    };
  };
  earnedAt: Date;
  course?: {
    _id: string;
    title: string;
    slug: string;
  };
  metadata?: any;
}

export const progressApi = {
  async enrollInCourse(courseId: string): Promise<{ message: string }> {
    const res = await apiClient.post(`/api/progress/enroll/${courseId}`);
    return res.data;
  },

  async checkEnrollment(courseId: string): Promise<{ enrolled: boolean; progress: number }> {
    const res = await apiClient.get(`/api/progress/enrollment/${courseId}`);
    return res.data;
  },

  async completeLesson(lessonId: string): Promise<{ message: string }> {
    const res = await apiClient.post(`/api/progress/complete-lesson/${lessonId}`);
    return res.data;
  },

  async rateCourse(courseId: string, rating: number, review?: string): Promise<{ message: string }> {
    const res = await apiClient.post(`/api/progress/rate-course/${courseId}`, { rating, review });
    return res.data;
  },

  async getStudentProgress(): Promise<ProgressData[]> {
    const res = await apiClient.get('/api/progress/student-progress');
    return res.data;
  },

  async getStudentBadges(): Promise<BadgeData[]> {
    const res = await apiClient.get('/api/progress/student-badges');
    return res.data;
  },

  async createBadge(badgeData: {
    name: string;
    description: string;
    icon: string;
    color: string;
    criteria: {
      kind: 'course_completion' | 'quiz_perfect' | 'streak' | 'custom';
      courseId?: string;
      requiredScore?: number;
      requiredStreak?: number;
      customCondition?: string;
    };
  }): Promise<any> {
    const res = await apiClient.post('/api/progress/badges', badgeData);
    return res.data;
  },

  async getBadges(): Promise<any[]> {
    const res = await apiClient.get('/api/progress/badges');
    return res.data;
  },
};
