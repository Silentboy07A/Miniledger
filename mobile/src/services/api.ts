import { API_CONFIG } from '../constants/config';
import { FinancialSummary, Loan, SendOtpResponse, AuthResponse } from '../types';
import { storage } from './storage';

let currentApiBaseUrl = API_CONFIG.BASE_URL;

export const setApiBaseUrl = (url: string) => {
  currentApiBaseUrl = url.trim().replace(/\/+$/, '');
};

export const getApiBaseUrl = () => currentApiBaseUrl;

class ApiError extends Error {
  status?: number;
  data?: any;

  constructor(message: string, status?: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

const request = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = `${currentApiBaseUrl}${endpoint}`;
  const token = await storage.getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const text = await response.text();
    let data: any;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }

    if (!response.ok) {
      const message =
        data?.message ||
        data?.error ||
        `Request failed with status ${response.status} (${response.statusText})`;
      throw new ApiError(message, response.status, data);
    }

    return data as T;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new ApiError(`Network timeout: unable to reach server at ${currentApiBaseUrl}. Verify server is running and accessible.`);
    }
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      `Unable to connect to backend server at ${currentApiBaseUrl}. Check network connection and server status.`
    );
  }
};

export const api = {
  /**
   * Check backend health status
   */
  async checkHealth(): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>('/health', {
      method: 'GET',
    });
  },

  /**
   * Request OTP for a phone number
   */
  async sendOtp(phone: string): Promise<SendOtpResponse> {
    return request<SendOtpResponse>('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  },

  /**
   * Verify OTP entered by user
   */
  async verifyOtp(phone: string, otp: string): Promise<AuthResponse> {
    return request<AuthResponse>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, otp }),
    });
  },

  /**
   * Fetch financial summary (Total Lent, Repaid, Overdue)
   */
  async getSummary(): Promise<FinancialSummary> {
    const response = await request<any>('/summary', {
      method: 'GET',
    });

    // Handle both { data: { ... } } and direct { totalLent: ... } formats
    const payload = response?.data || response;
    return {
      totalLent: Number(payload?.totalLent) || 0,
      totalRepaid: Number(payload?.totalRepaid) || 0,
      overdueAmount: Number(payload?.overdueAmount) || 0,
    };
  },

  /**
   * Fetch all loans for current user
   */
  async getLoans(): Promise<Loan[]> {
    const response = await request<any>('/loans', {
      method: 'GET',
    });

    const loansList: any[] = Array.isArray(response)
      ? response
      : Array.isArray(response?.data)
      ? response.data
      : [];

    return loansList.map((item) => ({
      id: String(item.id || item._id),
      friendName: String(item.friendName || item.friend_name || ''),
      amount: Number(item.amount) || 0,
      dueDate: String(item.dueDate || item.due_date || ''),
      status: (item.status?.toUpperCase() || 'UNPAID') as Loan['status'],
      createdAt: item.createdAt || item.created_at,
      repaidAt: item.repaidAt || item.repaid_at,
      notes: item.notes,
    }));
  },

  /**
   * Create a new loan record
   */
  async createLoan(data: {
    friendName: string;
    amount: number;
    dueDate: string;
    notes?: string;
  }): Promise<Loan> {
    const response = await request<any>('/loans', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    const item = response?.data || response;
    return {
      id: String(item.id || item._id || Date.now()),
      friendName: String(item.friendName || item.friend_name || data.friendName),
      amount: Number(item.amount) || data.amount,
      dueDate: String(item.dueDate || item.due_date || data.dueDate),
      status: (item.status?.toUpperCase() || 'UNPAID') as Loan['status'],
      createdAt: item.createdAt || new Date().toISOString(),
      notes: item.notes,
    };
  },

  /**
   * Mark a loan as repaid
   */
  async repayLoan(id: string): Promise<Loan> {
    const response = await request<any>(`/loans/${id}/repay`, {
      method: 'PATCH',
    });

    const item = response?.data || response;
    return {
      id: String(item.id || id),
      friendName: String(item.friendName || ''),
      amount: Number(item.amount) || 0,
      dueDate: String(item.dueDate || ''),
      status: 'REPAID',
      repaidAt: item.repaidAt || new Date().toISOString(),
    };
  },
};
