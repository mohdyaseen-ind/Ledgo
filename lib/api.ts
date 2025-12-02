// lib/api.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : 'http://localhost:3001/api';

// Generic fetch wrapper
async function fetchAPI(endpoint: string, options?: RequestInit & { _retry?: boolean }) {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options?.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    // Handle 401 Unauthorized (Token Expired)
    if (response.status === 401 && !options?._retry) {
      try {
        // Attempt to refresh the token
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        if (refreshResponse.ok) {
          // Token refreshed successfully! Retry the original request.
          return fetchAPI(endpoint, { ...options, _retry: true });
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
      }

      // If refresh failed or we are already retrying, redirect to login
      if (typeof window !== 'undefined') {
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }

    const error = await response.json();
    throw new Error(error.message || 'API request failed');
  }

  return response.json();
}

// ACCOUNTS
export const accountsAPI = {
  getAll: (params?: { type?: string; isParty?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.type) query.append('type', params.type);
    if (params?.isParty !== undefined) query.append('isParty', String(params.isParty));
    return fetchAPI(`/accounts?${query.toString()}`);
  },

  getById: (id: string) => fetchAPI(`/accounts/${id}`),

  create: (data: any) =>
    fetchAPI('/accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// VOUCHERS
export const vouchersAPI = {
  getAll: (params?: { type?: string; startDate?: string; endDate?: string; search?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.type) query.append('type', params.type);
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    if (params?.search) query.append('search', params.search);
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    return fetchAPI(`/vouchers?${query.toString()}`);
  },

  getById: (id: string) => fetchAPI(`/vouchers/${id}`),

  create: (data: any) =>
    fetchAPI('/vouchers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchAPI(`/vouchers/${id}`, {
      method: 'DELETE',
    }),

  update: (id: string, data: any) =>
    fetchAPI(`/vouchers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// REPORTS
export const reportsAPI = {
  trialBalance: (date?: string) => {
    const query = date ? `?date=${date}` : '';
    return fetchAPI(`/reports/trial-balance${query}`);
  },

  profitAndLoss: (startDate?: string, endDate?: string) => {
    const query = new URLSearchParams();
    if (startDate) query.append('startDate', startDate);
    if (endDate) query.append('endDate', endDate);
    return fetchAPI(`/reports/pl?${query.toString()}`);
  },

  gst: (month?: number, year?: number) => {
    const query = new URLSearchParams();
    if (month) query.append('month', String(month));
    if (year) query.append('year', String(year));
    return fetchAPI(`/reports/gst?${query.toString()}`);
  },

  outstanding: () => fetchAPI('/reports/outstanding'),

  ledger: (accountId: string, startDate?: string, endDate?: string) => {
    const query = new URLSearchParams();
    if (startDate) query.append('startDate', startDate);
    if (endDate) query.append('endDate', endDate);
    return fetchAPI(`/reports/ledger/${accountId}?${query.toString()}`);
  },
};