import { useState, useEffect } from 'react';
import { isAuthenticated, getCurrentUser, getAuthTokens } from '../utils/auth';

export interface AuthState {
  isAuthenticated: boolean;
  user: any | null;
  loading: boolean;
  tokens: {
    accessToken: string | null;
    refreshToken: string | null;
  };
}

export function useAuth(): AuthState {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true,
    tokens: {
      accessToken: null,
      refreshToken: null
    }
  });

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      const user = getCurrentUser();
      const tokens = getAuthTokens();

      setAuthState({
        isAuthenticated: authenticated,
        user,
        loading: false,
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken
        }
      });
    };

    checkAuth();

    // Listen for storage changes (e.g., when user logs in/out in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'accessToken' || e.key === 'refreshToken' || e.key === 'user') {
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return authState;
}

export function useRequireAuth() {
  const { isAuthenticated, loading } = useAuth();
  
  return {
    isAuthenticated,
    loading,
    shouldRedirect: !loading && !isAuthenticated
  };
}
