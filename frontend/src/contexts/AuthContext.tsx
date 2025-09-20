import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, AuthResponse } from '../api/auth';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  verified: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string, role?: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  token: string | null;
  setUserProfile: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is logged in on app start
    const token = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
        setToken(token);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response: AuthResponse = await authApi.login({ email, password });
      
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      setUser(response.user);
      setToken(response.accessToken);
    } catch (error: any) {
      console.error('Login error:', error);
      // Extract specific error message from API response
      const errorMessage = error.response?.data?.message || error.message || 'Đăng nhập thất bại';
      throw new Error(errorMessage);
    }
  };

  const register = async (email: string, name: string, password: string, role = 'student') => {
    try {
      const response: AuthResponse = await authApi.register({ email, name, password, role });
      
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      setUser(response.user);
      setToken(response.accessToken);
    } catch (error: any) {
      console.error('Register error:', error);
      // Extract specific error message from API response
      const errorMessage = error.response?.data?.message || error.message || 'Đăng ký thất bại';
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
  };

  const setUserProfile = (updates: Partial<User>) => {
    setUser(prev => {
      const next = prev ? { ...prev, ...updates } : (updates as User);
      localStorage.setItem('user', JSON.stringify(next));
      return next;
    });
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    loading,
    token,
    setUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
