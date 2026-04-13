const API_BASE_URL = (import.meta.env as any).VITE_API_URL || 'http://localhost:3002/api';

export const api = {
  // Auth endpoints
  auth: {
    login: (email: string, password: string) =>
      fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      }),
    
    register: (userData: any) =>
      fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      }),
    
    logout: (token: string) =>
      fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }),
    
    getMe: (token: string) =>
      fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }),
  },

  // Report endpoints
  reports: {
    getAll: (params?: any) => {
      const queryString = params ? `?${new URLSearchParams(params)}` : '';
      return fetch(`${API_BASE_URL}/reports${queryString}`);
    },
    
    getById: (id: string) =>
      fetch(`${API_BASE_URL}/reports/${id}`),
    
    create: (reportData: any, token: string) =>
      fetch(`${API_BASE_URL}/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(reportData),
      }),
    
    update: (id: string, reportData: any, token: string) =>
      fetch(`${API_BASE_URL}/reports/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(reportData),
      }),
    
    delete: (id: string, token: string) =>
      fetch(`${API_BASE_URL}/reports/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }),
  },

  // User endpoints
  users: {
    getProfile: (token: string) =>
      fetch(`${API_BASE_URL}/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }),
    
    updateProfile: (profileData: any, token: string) =>
      fetch(`${API_BASE_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      }),
  },
};

// Helper function to handle API responses
export const handleApiResponse = async (response: Response) => {
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }
  
  return data;
};
