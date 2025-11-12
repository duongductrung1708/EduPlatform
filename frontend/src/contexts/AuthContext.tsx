import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, AuthResponse, RegisterResponse } from '../api/auth';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  verified: boolean;
}

interface SelectedSubject {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

interface SelectedGradeLevel {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

interface SelectedCourse {
  _id: string;
  title: string;
  description?: string;
  category?: string;
  level?: string;
  coverImage?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    name: string,
    password: string,
    role?: string,
  ) => Promise<RegisterResponse>;
  logout: () => void;
  loading: boolean;
  token: string | null;
  setUserProfile: (updates: Partial<User>) => void;
  refreshUserState: () => void;
  selectedSubject: SelectedSubject | null;
  setSelectedSubject: (subject: SelectedSubject | null) => void;
  selectedGradeLevel: SelectedGradeLevel | null;
  setSelectedGradeLevel: (gradeLevel: SelectedGradeLevel | null) => void;
  selectedCourse: SelectedCourse | null;
  setSelectedCourse: (course: SelectedCourse | null) => void;
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
  const [selectedSubject, setSelectedSubject] = useState<SelectedSubject | null>(null);
  const [selectedGradeLevel, setSelectedGradeLevel] = useState<SelectedGradeLevel | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<SelectedCourse | null>(null);

  useEffect(() => {
    // Check if user is logged in on app start
    const token = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('user');
    const subjectData = localStorage.getItem('selectedSubject');
    const gradeLevelData = localStorage.getItem('selectedGradeLevel');
    const courseData = localStorage.getItem('selectedCourse');

    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
        setToken(token);

        // Load selected subject if exists
        if (subjectData) {
          setSelectedSubject(JSON.parse(subjectData));
        }

        // Load selected grade level if exists
        if (gradeLevelData) {
          setSelectedGradeLevel(JSON.parse(gradeLevelData));
        }

        // Load selected course if exists
        if (courseData) {
          setSelectedCourse(JSON.parse(courseData));
        }
      } catch (error) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('selectedSubject');
        localStorage.removeItem('selectedGradeLevel');
        localStorage.removeItem('selectedCourse');
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
      // Extract specific error message from API response
      // NestJS returns error in error.response.data.message (can be string or array)
      let errorMessage = 'Đăng nhập thất bại';

      if (error.response?.data?.message) {
        const message = error.response.data.message;
        if (Array.isArray(message)) {
          errorMessage = message[0] || 'Đăng nhập thất bại';
        } else {
          errorMessage = message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    }
  };

  const register = async (
    email: string,
    name: string,
    password: string,
    role = 'student',
  ): Promise<RegisterResponse> => {
    try {
      const response: RegisterResponse = await authApi.register({ email, name, password, role });

      // If registration requires verification, return the response without setting user/token
      if (response.requiresVerification) {
        return response;
      }

      // If direct login (fallback for admin users), handle as before
      const authResponse = response as any as AuthResponse;
      localStorage.setItem('accessToken', authResponse.accessToken);
      localStorage.setItem('refreshToken', authResponse.refreshToken);
      localStorage.setItem('user', JSON.stringify(authResponse.user));

      setUser(authResponse.user);
      setToken(authResponse.accessToken);

      return response;
    } catch (error: any) {
      // Extract specific error message from API response
      const errorMessage = error.response?.data?.message || error.message || 'Đăng ký thất bại';
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('selectedSubject');
    localStorage.removeItem('selectedGradeLevel');
    localStorage.removeItem('selectedCourse');
    setUser(null);
    setToken(null);
    setSelectedSubject(null);
    setSelectedGradeLevel(null);
    setSelectedCourse(null);
  };

  const setUserProfile = (updates: Partial<User>) => {
    setUser((prev) => {
      const next = prev ? { ...prev, ...updates } : (updates as User);
      localStorage.setItem('user', JSON.stringify(next));
      return next;
    });
  };

  const handleSetSelectedSubject = (subject: SelectedSubject | null) => {
    setSelectedSubject(subject);
    if (subject) {
      localStorage.setItem('selectedSubject', JSON.stringify(subject));
    } else {
      localStorage.removeItem('selectedSubject');
    }
  };

  const handleSetSelectedGradeLevel = (gradeLevel: SelectedGradeLevel | null) => {
    setSelectedGradeLevel(gradeLevel);
    if (gradeLevel) {
      localStorage.setItem('selectedGradeLevel', JSON.stringify(gradeLevel));
    } else {
      localStorage.removeItem('selectedGradeLevel');
    }
  };

  const handleSetSelectedCourse = (course: SelectedCourse | null) => {
    setSelectedCourse(course);
    if (course) {
      localStorage.setItem('selectedCourse', JSON.stringify(course));
    } else {
      localStorage.removeItem('selectedCourse');
    }
  };

  const refreshUserState = () => {
    // Refresh user state from localStorage (useful after OTP verification)
    const token = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
        setToken(token);
      } catch (error) {
        // Clear invalid data
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        setUser(null);
        setToken(null);
      }
    }
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    loading,
    token,
    setUserProfile,
    refreshUserState,
    selectedSubject,
    setSelectedSubject: handleSetSelectedSubject,
    selectedGradeLevel,
    setSelectedGradeLevel: handleSetSelectedGradeLevel,
    selectedCourse,
    setSelectedCourse: handleSetSelectedCourse,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
