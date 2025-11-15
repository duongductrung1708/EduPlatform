import { apiClient } from './client';

export interface ProgressData {
  courseId:
    | string
    | {
        _id: string;
        title: string;
        slug: string;
        thumbnail?: string;
      };
  enrolledAt: string;
  completedAt?: string;
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
  metadata?: Record<string, unknown>;
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
    const res = await apiClient.get('/api/progress/student-progress', {
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
      params: {
        _: Date.now(),
      },
    });

    const payload = res.data ?? [];

    if (Array.isArray(payload)) {
      return payload as ProgressData[];
    }

    if (Array.isArray(payload.data)) {
      return payload.data as ProgressData[];
    }

    if (Array.isArray(payload.items)) {
      return payload.items as ProgressData[];
    }

    if (payload.data && Array.isArray(payload.data.items)) {
      return payload.data.items as ProgressData[];
    }

    if (Array.isArray(payload.progress)) {
      return payload.progress as ProgressData[];
    }

    if (payload.data && Array.isArray(payload.data.progress)) {
      return payload.data.progress as ProgressData[];
    }

    return [];
  },

  async getStudentBadges(): Promise<BadgeData[]> {
    try {
      const res = await apiClient.get('/api/progress/student-badges', {
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
        params: {
          _: Date.now(),
        },
      });
      
      const payload = res.data ?? [];

      if (Array.isArray(payload)) {
        return payload as BadgeData[];
      }

      if (Array.isArray(payload.data)) {
        return payload.data as BadgeData[];
      }

      if (Array.isArray(payload.items)) {
        return payload.items as BadgeData[];
      }

      if (Array.isArray(payload.badges)) {
        return payload.badges as BadgeData[];
      }

      return [];
    } catch (error: unknown) {
      throw error;
    }
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

  async getBadges(): Promise<BadgeData[]> {
    const res = await apiClient.get('/api/progress/badges');
    return res.data;
  },
};
