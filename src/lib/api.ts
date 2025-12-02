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
// Patient APIs
// ============================

export const patientsAPI = {
  // Get all patients with pagination and search
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.search) searchParams.append("search", params.search);

    return fetchAPI<any>(`/patients?${searchParams}`);
  },

  // Get single patient
  getById: (id: string) => fetchAPI<any>(`/patients/${id}`),

  // Create new patient
  create: (data: any) =>
    fetchAPI<any>("/patients", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Update patient
  update: (id: string, data: any) =>
    fetchAPI<any>(`/patients/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Delete patient
  delete: (id: string) =>
    fetchAPI<any>(`/patients/${id}`, {
      method: "DELETE",
    }),
};

// ============================
// Treatment APIs
// ============================

export const treatmentsAPI = {
  // Get all treatments
  getAll: (params?: {
    patientId?: string;
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.patientId) searchParams.append("patientId", params.patientId);
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.startDate) searchParams.append("startDate", params.startDate);
    if (params?.endDate) searchParams.append("endDate", params.endDate);

    return fetchAPI<any>(`/treatments?${searchParams}`);
  },

  // Get single treatment
  getById: (id: string) => fetchAPI<any>(`/treatments/${id}`),

  // Create new treatment
  create: (data: any) =>
    fetchAPI<any>("/treatments", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Update treatment
  update: (id: string, data: any) =>
    fetchAPI<any>(`/treatments/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Delete treatment
  delete: (id: string) =>
    fetchAPI<any>(`/treatments/${id}`, {
      method: "DELETE",
    }),

  // Record payment
  recordPayment: (id: string, amount: number) =>
    fetchAPI<any>(`/treatments/${id}/payment`, {
      method: "POST",
      body: JSON.stringify({ amount }),
    }),
};

// ============================
// Appointment APIs
// ============================

export const appointmentsAPI = {
  // Get all appointments
  getAll: (params?: {
    patientId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.patientId) searchParams.append("patientId", params.patientId);
    if (params?.status) searchParams.append("status", params.status);
    if (params?.startDate) searchParams.append("startDate", params.startDate);
    if (params?.endDate) searchParams.append("endDate", params.endDate);
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());

    return fetchAPI<any>(`/appointments?${searchParams}`);
  },

  // Get calendar view
  getCalendar: (params?: { startDate?: string; endDate?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append("startDate", params.startDate);
    if (params?.endDate) searchParams.append("endDate", params.endDate);

    return fetchAPI<any>(`/appointments/calendar?${searchParams}`);
  },

  // Get single appointment
  getById: (id: string) => fetchAPI<any>(`/appointments/${id}`),

  // Create new appointment
  create: (data: any) =>
    fetchAPI<any>("/appointments", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Update appointment
  update: (id: string, data: any) =>
    fetchAPI<any>(`/appointments/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Delete appointment
  delete: (id: string) =>
    fetchAPI<any>(`/appointments/${id}`, {
      method: "DELETE",
    }),
};

// ============================
// Document APIs
// ============================

export const documentsAPI = {
  // Get patient documents
  getByPatient: (patientId: string) =>
    fetchAPI<any>(`/documents?patientId=${patientId}`),

  // Get single document
  getById: (id: string) => fetchAPI<any>(`/documents/${id}`),

  // Upload document
  upload: (data: any) =>
    fetchAPI<any>("/documents", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Delete document
  delete: (id: string) =>
    fetchAPI<any>(`/documents/${id}`, {
      method: "DELETE",
    }),
};

// ============================
// Analytics APIs
// ============================

export const analyticsAPI = {
  // Get dashboard analytics
  getOverview: (params?: { startDate?: string; endDate?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append("startDate", params.startDate);
    if (params?.endDate) searchParams.append("endDate", params.endDate);

    return fetchAPI<any>(`/analytics?${searchParams}`);
  },
};

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
  // Generate treatment report PDF
  generateTreatmentReport: (id: string) =>
    fetchAPI<any>(`/reports/treatment/${id}`),
};

// ============================
// Employee APIs
// ============================

export const employeesAPI = {
  // Get all employees and invitations
  getAll: () => fetchAPI<any>("/employees"),

  // Get single employee
  getById: (id: string) => fetchAPI<any>(`/employees/${id}`),

  // Update employee
  update: (id: string, data: any) =>
    fetchAPI<any>(`/employees/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Delete employee
  delete: (id: string) =>
    fetchAPI<any>(`/employees/${id}`, {
      method: "DELETE",
    }),

  // Send invitations
  sendInvitations: (invitations: Array<{ email: string; role: string }>) =>
    fetchAPI<any>("/clinic/invitations", {
      method: "POST",
      body: JSON.stringify({ invitations }),
    }),

  // Cancel invitation
  cancelInvitation: (id: string) =>
    fetchAPI<any>(`/invitations/${id}`, {
      method: "DELETE",
    }),
};

// ============================
// Inventory APIs
// ============================

export const inventoryAPI = {
  // Get all inventory items
  getAll: (params?: { category?: string; search?: string; lowStock?: boolean }) => {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.append("category", params.category);
    if (params?.search) searchParams.append("search", params.search);
    if (params?.lowStock) searchParams.append("lowStock", "true");

    return fetchAPI<any>(`/inventory?${searchParams}`);
  },

  // Get single item
  getById: (id: string) => fetchAPI<any>(`/inventory/${id}`),

  // Create item
  create: (data: any) =>
    fetchAPI<any>("/inventory", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Update item
  update: (id: string, data: any) =>
    fetchAPI<any>(`/inventory/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Delete item
  delete: (id: string) =>
    fetchAPI<any>(`/inventory/${id}`, {
      method: "DELETE",
    }),

  // Adjust stock
  adjustStock: (id: string, data: any) =>
    fetchAPI<any>(`/inventory/${id}/adjust-stock`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ============================
// Supplier APIs
// ============================

export const suppliersAPI = {
  getAll: () => fetchAPI<any>("/suppliers"),
  create: (data: any) =>
    fetchAPI<any>("/suppliers", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ============================
// Invoice APIs
// ============================

export const invoicesAPI = {
  // Get all invoices
  getAll: (params?: { status?: string; patientId?: string; search?: string; dateFrom?: string; dateTo?: string; }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append("status", params.status);
    if (params?.patientId) searchParams.append("patientId", params.patientId);
    if (params?.search) searchParams.append("search", params.search);
    if (params?.dateFrom) searchParams.append("dateFrom", params.dateFrom);
    if (params?.dateTo) searchParams.append("dateTo", params.dateTo);

    return fetchAPI<any>(`/invoices?${searchParams}`);
  },

  // Get single invoice
  getById: (id: string) => fetchAPI<any>(`/invoices/${id}`),

  // Create invoice
  create: (data: any) =>
    fetchAPI<any>("/invoices", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Update invoice
  update: (id: string, data: any) =>
    fetchAPI<any>(`/invoices/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Delete invoice
  delete: (id: string) =>
    fetchAPI<any>(`/invoices/${id}`, {
      method: "DELETE",
    }),

  // Record payment
  recordPayment: (id: string, data: any) =>
    fetchAPI<any>(`/invoices/${id}/payments`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
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
// Clinical Images APIs
// ============================

export const clinicalImagesAPI = {
  // Get clinical images
  getAll: (params?: { patientId?: string; treatmentId?: string; type?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.patientId) searchParams.append("patientId", params.patientId);
    if (params?.treatmentId) searchParams.append("treatmentId", params.treatmentId);
    if (params?.type) searchParams.append("type", params.type);

    return fetchAPI<any>(`/clinical-images?${searchParams}`);
  },

  // Get single image
  getById: (id: string) => fetchAPI<any>(`/clinical-images/${id}`),

  // Upload image (FormData)
  upload: async (formData: FormData) => {
    const response = await fetch(`${API_BASE}/clinical-images`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: "Upload failed",
      }));
      throw new Error(errorData.error);
    }

    return response.json();
  },

  // Delete image
  delete: (id: string) =>
    fetchAPI<any>(`/clinical-images/${id}`, {
      method: "DELETE",
    }),
};

// ============================
// Consent APIs
// ============================

export const consentsAPI = {
  // Get patient consents
  getAll: (params?: { patientId?: string; treatmentId?: string; status?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.patientId) searchParams.append("patientId", params.patientId);
    if (params?.treatmentId) searchParams.append("treatmentId", params.treatmentId);
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
// Treatment Visit APIs
// ============================

export const treatmentVisitsAPI = {
  // Get visits for a treatment
  getByTreatment: (treatmentId: string) =>
    fetchAPI<any>(`/treatments/${treatmentId}/visits`),

  // Create visit
  create: (treatmentId: string, data: any) =>
    fetchAPI<any>(`/treatments/${treatmentId}/visits`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Update visit
  update: (treatmentId: string, visitId: string, data: any) =>
    fetchAPI<any>(`/treatments/${treatmentId}/visits/${visitId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // Delete visit
  delete: (treatmentId: string, visitId: string) =>
    fetchAPI<any>(`/treatments/${treatmentId}/visits/${visitId}`, {
      method: "DELETE",
    }),
};

// ============================
// Prescription APIs
// ============================

export const prescriptionsAPI = {
  // Get prescriptions
  getAll: (params?: { patientId?: string; treatmentId?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.patientId) searchParams.append("patientId", params.patientId);
    if (params?.treatmentId) searchParams.append("treatmentId", params.treatmentId);

    return fetchAPI<any>(`/prescriptions?${searchParams}`);
  },

  // Generate prescription PDF
  generate: (data: any) =>
    fetchAPI<any>("/prescriptions", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ============================
// Dental Chart APIs
// ============================

export const dentalChartAPI = {
  // Get dental chart for treatment
  get: (treatmentId: string) =>
    fetchAPI<any>(`/treatments/${treatmentId}/dental-chart`),

  // Update dental chart
  update: (treatmentId: string, chart: any) =>
    fetchAPI<any>(`/treatments/${treatmentId}/dental-chart`, {
      method: "PUT",
      body: JSON.stringify({ chart }),
    }),
};

