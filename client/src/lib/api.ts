// Use relative URL to go through Vite dev server proxy (avoids CORS)
const API_BASE_URL = '/api';
const REPORTS_API_URL = API_BASE_URL;

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
      return fetch(`${REPORTS_API_URL}/reports${queryString}`);
    },
    
    getById: (id: string) =>
      fetch(`${REPORTS_API_URL}/reports/${id}`),
    
    create: (reportData: any, token: string | null | undefined) =>
      fetch(`${REPORTS_API_URL}/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(reportData),
      }),
    
    update: (id: string, reportData: any, token: string) =>
      fetch(`${REPORTS_API_URL}/reports/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(reportData),
      }),
    
    delete: (id: string, token: string) =>
      fetch(`${REPORTS_API_URL}/reports/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }),
    
    upvote: (id: string, token: string) =>
      fetch(`${REPORTS_API_URL}/reports/${id}/upvote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }),
    
    removeUpvote: (id: string, token: string) =>
      fetch(`${REPORTS_API_URL}/reports/${id}/upvote`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }),
    
    getComments: (id: string, token?: string) => {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      return fetch(`${REPORTS_API_URL}/reports/${id}/comments`, { headers });
    },
    
    addComment: (id: string, content: string, token: string) =>
      fetch(`${REPORTS_API_URL}/reports/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      }),
    
    updateComment: (id: string, commentId: string, content: string, token: string) =>
      fetch(`${REPORTS_API_URL}/reports/${id}/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      }),
    
    deleteComment: (id: string, commentId: string, token: string) =>
      fetch(`${REPORTS_API_URL}/reports/${id}/comments/${commentId}`, {
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

  // Upload photo for a report
  uploadPhoto: (reportId: string, file: File, token: string) => {
    const formData = new FormData();
    formData.append('photo', file);
    
    return fetch(`${REPORTS_API_URL}/reports/${reportId}/photos`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
  },

  // Trails endpoints
  trails: {
    getAll: () =>
      fetch(`${API_BASE_URL}/trails`),
    
    getById: (id: string) =>
      fetch(`${API_BASE_URL}/trails/${id}`),
    
    getNearby: (lat: number, lng: number, radius?: number) =>
      fetch(`${API_BASE_URL}/trails/nearby?lat=${lat}&lng=${lng}&radius=${radius || 10}`),
  },

  // Admin endpoints (Phase 2)
  admin: {
    getStats: (token: string) =>
      fetch(`${API_BASE_URL}/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }),
    
    getUsers: (token: string) =>
      fetch(`${API_BASE_URL}/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }),
    
    getAllReports: (token: string) =>
      fetch(`${API_BASE_URL}/admin/reports`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }),
    
    banUser: (userId: string, token: string) =>
      fetch(`${API_BASE_URL}/admin/users/${userId}/ban`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }),
    
    flagReport: (reportId: string, token: string) =>
      fetch(`${API_BASE_URL}/admin/reports/${reportId}/flag`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }),
    
    removeReport: (reportId: string, token: string) =>
      fetch(`${API_BASE_URL}/admin/reports/${reportId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }),
    
    resolveReport: (reportId: string, token: string) =>
      fetch(`${API_BASE_URL}/admin/reports/${reportId}/resolve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }),
    
    getUserDetails: (userId: string, token: string) =>
      fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }),
    
    getUserReports: (userId: string, token: string) =>
      fetch(`${API_BASE_URL}/admin/users/${userId}/reports`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }),
  },
  
  userStats: {
    getStats: (token: string) =>
      fetch(`${API_BASE_URL}/users/me/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }),
  },
  
  trailImport: {
    importCSV: (trails: any[], token: string) =>
      fetch(`${API_BASE_URL}/trails/import/csv`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ trails }),
      }),
    
    getSample: (token: string) =>
      fetch(`${API_BASE_URL}/trails/import/sample`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }),
    
    getStatus: (token: string) =>
      fetch(`${API_BASE_URL}/trails/import/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }),
  },
  
  push: {
    getVapidPublicKey: () =>
      fetch(`${API_BASE_URL}/push/vapid-public-key`),
    
    subscribe: (subscription: any) => {
      // Get token from Zustand auth store (stored under 'auth-storage' key)
      const authStorage = localStorage.getItem('auth-storage');
      let token = null;
      
      if (authStorage) {
        try {
          const authData = JSON.parse(authStorage);
          token = authData.state?.token;
        } catch (e) {
          console.log('Failed to parse auth storage');
        }
      }
      
      console.log('Push subscribe - token:', token ? `present (length: ${token.length})` : 'missing from auth-storage');
      if (!token) {
        return Promise.reject(new Error('No authentication token'));
      }
      return fetch(`${API_BASE_URL}/push/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ subscription }),
      });
    },
    
    unsubscribe: (endpoint: string) => {
      // Get token from Zustand auth store (stored under 'auth-storage' key)
      const authStorage = localStorage.getItem('auth-storage');
      let token = null;
      
      if (authStorage) {
        try {
          const authData = JSON.parse(authStorage);
          token = authData.state?.token;
        } catch (e) {
          console.log('Failed to parse auth storage');
        }
      }
      
      console.log('Push unsubscribe - token:', token ? `present (length: ${token.length})` : 'missing from auth-storage');
      if (!token) {
        return Promise.reject(new Error('No authentication token'));
      }
      return fetch(`${API_BASE_URL}/push/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ endpoint }),
      });
    },
    
    test: () => {
      // Get token from Zustand auth store (stored under 'auth-storage' key)
      const authStorage = localStorage.getItem('auth-storage');
      let token = null;
      
      if (authStorage) {
        try {
          const authData = JSON.parse(authStorage);
          token = authData.state?.token;
        } catch (e) {
          console.log('Failed to parse auth storage');
        }
      }
      
      console.log('Push test - token:', token ? `present (length: ${token.length})` : 'missing from auth-storage');
      if (!token || token.length === 0) {
        return Promise.reject(new Error('No authentication token found. Please log in again.'));
      }
      return fetch(`${API_BASE_URL}/push/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
    },
  },

  // Weather API
  weather: {
    getWeather: (lat: number, lng: number) => {
      return fetch(`${API_BASE_URL}/weather?lat=${lat}&lng=${lng}`);
    },
  },

  // AI Classification API
  ai: {
    classifyHazard: (description: string, hazardType: string) => {
      return fetch(`${API_BASE_URL}/ai/classify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description, hazardType }),
      });
    },
    batchClassify: (reports: Array<{ description: string; hazardType: string }>) => {
      return fetch(`${API_BASE_URL}/ai/batch-classify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reports }),
      });
    },
  },
};

// Helper function to handle API responses
export const handleApiResponse = async (response: Response) => {
  // DEBUG: Log the response status and headers
  console.log('API Response:', response.status, response.statusText);
  console.log('Content-Type:', response.headers.get('content-type'));
  
  // Check if response is JSON
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    console.error('Non-JSON response:', text.slice(0, 200));
    throw new Error(`Server returned non-JSON response: ${text.slice(0, 100)}`);
  }
  
  const data = await response.json();
  console.log('Response data:', data);
  
  // DEBUG: Log validation error details
  if (data.details && Array.isArray(data.details)) {
    console.error('Validation errors:', JSON.stringify(data.details, null, 2));
  }
  
  if (!response.ok) {
    // Include validation details in error message
    let errorMessage = data.error || data.message || `API request failed (${response.status})`;
    if (data.details && Array.isArray(data.details) && data.details.length > 0) {
      const details = data.details.map((d: any) => `${d.field}: ${d.message}`).join(', ');
      errorMessage += ` - ${details}`;
    }
    throw new Error(errorMessage);
  }
  
  return data;
};
