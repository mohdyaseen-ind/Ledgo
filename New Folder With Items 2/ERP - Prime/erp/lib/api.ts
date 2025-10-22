// lib/api.ts

const API_BASE_URL = 'http://localhost:3001/api';

// Generic fetch wrapper
async function fetchAPI(endpoint: string, options?: RequestInit) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
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
  getAll: (params?: { type?: string; startDate?: string; endDate?: string }) => {
    const query = new URLSearchParams();
    if (params?.type) query.append('type', params.type);
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
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