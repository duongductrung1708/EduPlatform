import axios from 'axios';

const api = axios.create({ withCredentials: true, baseURL: (import.meta as any).env?.VITE_API_BASE || '' });

export interface UserLite {
  _id: string;
  name: string;
  email: string;
}

export async function searchUsers(search: string, limit = 10): Promise<UserLite[]> {
  if (!search || !search.trim()) return [];
  const { data } = await api.get('/api/users', { params: { page: 1, limit, search } });
  // Backend returns { users, total, ... }
  return Array.isArray(data?.users) ? data.users.map((u: any) => ({ _id: String(u._id), name: u.name, email: u.email })) : [];
}

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
  avatarUrl?: string;
  phone?: string;
  address?: string;
  gender?: string;
}

export const usersApi = {
  async getMe(): Promise<CurrentUserResponse> {
    const res = await apiClient.get('/api/users/me');
    const data = res.data;
    // Map avatarUrl from backend to avatar for frontend compatibility
    return {
      ...data,
      avatar: data.avatarUrl || data.avatar,
    };
  },
  async updateMe(payload: UpdateMePayload): Promise<CurrentUserResponse> {
    const res = await apiClient.put('/api/users/me', payload);
    const data = res.data;
    // Map avatarUrl from backend to avatar for frontend compatibility
    return {
      ...data,
      avatar: data.avatarUrl || data.avatar,
    };
  },
};


