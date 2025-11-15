import { apiClient } from './client';

export async function getClassMembers(classroomId: string): Promise<Array<{ _id: string; name: string; email: string }>> {
  const { data } = await apiClient.get(`/api/classes/${classroomId}/members`);
  return Array.isArray(data) ? data : [];
}

import { apiClient } from './client';

export interface Classroom {
  _id: string;
  title: string;
  courseId?: {
    _id: string;
    title: string;
  };
  studentIds?: string[];
  teacherIds?: string[];
  assignmentIds?: string[];
  inviteCode?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateClassroomRequest {
  title: string;
  courseId?: string;
}

export interface UpdateClassroomRequest {
  title?: string;
  courseId?: string;
}

export const classroomsApi = {
  // Lấy danh sách lớp của học sinh
  async getStudentClassrooms(): Promise<Classroom[]> {
    try {
      const response = await apiClient.get('/classes/student');
      return response.data;
    } catch (error) {
      console.error('Error fetching student classrooms:', error);
      return [];
    }
  },

  // Lấy danh sách lớp của giáo viên
  async getTeacherClassrooms(): Promise<Classroom[]> {
    try {
      const response = await apiClient.get('/classes/teacher');
      return response.data;
    } catch (error) {
      console.error('Error fetching teacher classrooms:', error);
      return [];
    }
  },

  // Lấy chi tiết lớp học
  async getClassroom(id: string): Promise<Classroom> {
    const response = await apiClient.get(`/classes/${id}`);
    return response.data;
  },

  // Tạo lớp học mới
  async createClassroom(data: CreateClassroomRequest): Promise<Classroom> {
    const response = await apiClient.post('/classes', data);
    return response.data;
  },

  // Cập nhật lớp học
  async updateClassroom(id: string, data: UpdateClassroomRequest): Promise<Classroom> {
    const response = await apiClient.put(`/classes/${id}`, data);
    return response.data;
  },

  // Xóa lớp học
  async deleteClassroom(id: string): Promise<void> {
    await apiClient.delete(`/classes/${id}`);
  },

  // Tham gia lớp học bằng mã mời
  async joinClassroom(inviteCode: string): Promise<Classroom> {
    const response = await apiClient.post('/classes/join', { inviteCode });
    return response.data;
  },

  // Lấy danh sách học sinh trong lớp
  async getClassroomStudents(id: string): Promise<Array<{ _id: string; name: string; email: string }>> {
    try {
      const response = await apiClient.get(`/classes/${id}/students`);
      return response.data;
    } catch (error) {
      console.error('Error fetching classroom students:', error);
      return [];
    }
  },

  // Thêm học sinh vào lớp
  async addStudentToClassroom(classroomId: string, studentEmail: string): Promise<void> {
    await apiClient.post(`/classes/${classroomId}/students`, { studentEmail });
  },

  // Xóa học sinh khỏi lớp
  async removeStudentFromClassroom(classroomId: string, studentId: string): Promise<void> {
    await apiClient.delete(`/classes/${classroomId}/students/${studentId}`);
  },

  // Tìm học sinh theo email
  async findStudentByEmail(email: string): Promise<{ _id: string; name: string; email: string } | null> {
    try {
      const response = await apiClient.get(`/classes/find-student?email=${encodeURIComponent(email)}`);
      return response.data;
    } catch (error) {
      console.error('Error finding student:', error);
      return null;
    }
  }
};
