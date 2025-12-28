// API utility functions for frontend

const API_BASE = "/api";

// Error response type
interface APIError {
  error: string;
  code?: string;
  details?: any;
}

// Generic fetch wrapper with error handling and retry logic
async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit,
  retryCount = 0
): Promise<T> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorData: APIError = await response.json().catch(() => ({
        error: "Network error occurred",
        code: "NETWORK_ERROR"
      }));
      
      // Create enhanced error with additional metadata
      const error = new Error(errorData.error || `HTTP ${response.status}`);
      (error as any).code = errorData.code;
      (error as any).details = errorData.details;
      (error as any).statusCode = response.status;
      
      throw error;
    }

    return response.json();
  } catch (error: any) {
    // Retry logic for network errors (single retry after 1 second)
    if (
      error.message?.includes('Failed to fetch') && 
      retryCount === 0 && 
      !options?.signal?.aborted
    ) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchAPI<T>(endpoint, options, retryCount + 1);
    }
    
    throw error;
  }
}

// ============================
// Settings APIs
// ============================

export const settingsAPI = {
  // Get user profile
  getProfile: () => fetchAPI<any>("/settings/profile"),

  // Update profile
  updateProfile: (data: any) =>
    fetchAPI<any>("/settings/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Update password
  updatePassword: (currentPassword: string, newPassword: string) =>
    fetchAPI<any>("/settings/password", {
      method: "PUT",
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};

// ============================
// Report APIs
// ============================

export const reportsAPI = {
};




// ============================
// Notification APIs
// ============================

export const notificationsAPI = {
  // Get notifications
  getAll: (unreadOnly?: boolean) => {
    const searchParams = new URLSearchParams();
    if (unreadOnly) searchParams.append("unread", "true");

    return fetchAPI<any>(`/notifications?${searchParams}`);
  },

  // Mark as read
  markAsRead: (notificationIds?: string[], markAll?: boolean) =>
    fetchAPI<any>("/notifications", {
      method: "PATCH",
      body: JSON.stringify({ notificationIds, markAll }),
    }),

  // Get preferences
  getPreferences: () => fetchAPI<any>("/notifications/preferences"),

  // Update preferences
  updatePreferences: (data: any) =>
    fetchAPI<any>("/notifications/preferences", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

// ============================
// Auth APIs
// ============================

export const authAPI = {
  // Signup
  signup: (name: string, email: string, password: string) =>
    fetchAPI<any>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }),

  // Login
  login: (email: string, password: string) =>
    fetchAPI<any>("/auth/callback/credentials", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
};

// ============================
// Consent APIs
// ============================

export const consentsAPI = {
  // Get patient consents
  getAll: (params?: { patientId?: string; status?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.patientId) searchParams.append("patientId", params.patientId);
    if (params?.status) searchParams.append("status", params.status);

    return fetchAPI<any>(`/consents?${searchParams}`);
  },

  // Create patient consent (FormData for signature)
  create: async (formData: FormData) => {
    const response = await fetch(`${API_BASE}/consents`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: "Consent creation failed",
      }));
      throw new Error(errorData.error);
    }

    return response.json();
  },

  // Templates
  templates: {
    getAll: (params?: { category?: string; isActive?: boolean }) => {
      const searchParams = new URLSearchParams();
      if (params?.category) searchParams.append("category", params.category);
      if (params?.isActive !== undefined)
        searchParams.append("isActive", params.isActive.toString());

      return fetchAPI<any>(`/consents/templates?${searchParams}`);
    },

    getById: (id: string) => fetchAPI<any>(`/consents/templates/${id}`),

    create: (data: any) =>
      fetchAPI<any>("/consents/templates", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    update: (id: string, data: any) =>
      fetchAPI<any>(`/consents/templates/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      fetchAPI<any>(`/consents/templates/${id}`, {
        method: "DELETE",
      }),
  },
};

// ============================
// Prescription APIs
// ============================

export const prescriptionsAPI = {
  // Get prescriptions
  getAll: (params?: { patientId?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.patientId) searchParams.append("patientId", params.patientId);

    return fetchAPI<any>(`/prescriptions?${searchParams}`);
  },

  // Generate prescription PDF
  generate: (data: any) =>
    fetchAPI<any>("/prescriptions", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};


