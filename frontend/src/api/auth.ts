import { apiClient } from './client';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  name: string;
  password: string;
  role?: string;
}

export interface RegisterResponse {
  message: string;
  email: string;
  requiresVerification: boolean;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface ResendOtpRequest {
  email: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    verified: boolean;
  };
}

export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post('/api/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const response = await apiClient.post('/api/auth/register', data);
    return response.data;
  },

  verifyOtp: async (data: VerifyOtpRequest): Promise<AuthResponse> => {
    const response = await apiClient.post('/api/auth/verify-otp', data);
    return response.data;
  },

  resendOtp: async (data: ResendOtpRequest): Promise<{ message: string; email: string }> => {
    const response = await apiClient.post('/api/auth/resend-otp', data);
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<{ accessToken: string }> => {
    const response = await apiClient.post('/api/auth/refresh', { refreshToken });
    return response.data;
  },
  changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<{ message: string }> => {
    const response = await apiClient.put('/api/auth/change-password', data);
    return response.data;
  },
  forgotPassword: async (email: string): Promise<{ message: string; token?: string }> => {
    const response = await apiClient.post('/api/auth/forgot-password', { email });
    return response.data;
  },
  resetPassword: async (token: string, newPassword: string): Promise<{ message: string }> => {
    const response = await apiClient.post('/api/auth/reset-password', { token, newPassword });
    return response.data;
  },
};
