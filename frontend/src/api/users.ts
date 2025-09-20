import { apiClient } from './client';

export interface CurrentUserResponse {
  id: string;
  email: string;
  name: string;
  role: string;
  verified?: boolean;
  avatar?: string;
  phone?: string;
  address?: string;
  gender?: string;
}

export interface UpdateMePayload {
  name?: string;
  avatar?: string;
  phone?: string;
  address?: string;
  gender?: string;
}

export const usersApi = {
  async getMe(): Promise<CurrentUserResponse> {
    const res = await apiClient.get('/api/users/me');
    return res.data;
  },
  async updateMe(payload: UpdateMePayload): Promise<CurrentUserResponse> {
    const res = await apiClient.put('/api/users/me', payload);
    return res.data;
  },
};


