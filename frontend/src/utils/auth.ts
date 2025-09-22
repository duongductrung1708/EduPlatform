// Authentication utility functions

export interface AuthTokens {
  accessToken: string | null;
  refreshToken: string | null;
  user: any | null;
}

export const getAuthTokens = (): AuthTokens => {
  return {
    accessToken: localStorage.getItem('accessToken'),
    refreshToken: localStorage.getItem('refreshToken'),
    user: JSON.parse(localStorage.getItem('user') || 'null')
  };
};

export const isAuthenticated = (): boolean => {
  const { accessToken, refreshToken } = getAuthTokens();
  return !!(accessToken && refreshToken);
};

export const clearAuth = (): void => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};

export const setAuth = (accessToken: string, refreshToken: string, user: any): void => {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
  localStorage.setItem('user', JSON.stringify(user));
};

export const getCurrentUser = (): any | null => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch {
    return true;
  }
};

export const shouldRefreshToken = (): boolean => {
  const { accessToken } = getAuthTokens();
  if (!accessToken) return false;
  
  try {
    const payload = JSON.parse(atob(accessToken.split('.')[1]));
    const currentTime = Date.now() / 1000;
    // Refresh if token expires in less than 5 minutes
    return payload.exp - currentTime < 300;
  } catch {
    return true;
  }
};
