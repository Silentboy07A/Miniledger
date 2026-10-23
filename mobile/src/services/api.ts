
import { API_CONFIG } from '../constants/config';
import { storage } from './storage';
import type { FinancialSummary, Loan } from '../types';

type ApiResponse<T = any> = {
  success?: boolean;
  message?: string;
  data?: T;
  token?: string;
  user?: any;
  loan?: any;
  loans?: any[];
  summary?: FinancialSummary;
};

export function getApiBaseUrl(): string {
  return API_CONFIG.BASE_URL;
}

export function setApiBaseUrl(url: string): void {
  (API_CONFIG as { BASE_URL: string }).BASE_URL = url.trim().replace(/\/+$/, '');
}

async function request<T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await storage.getToken();

  const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      result?.message || result?.error || `Request failed (${response.status})`,
    );
  }

  return result as T;
}

function mapLoan(item: any): Loan {
  const repaid = Boolean(item.repaidAt ?? item.repaid_at);
  const dueDate = item.dueDate ?? item.due_date;
  const dueTimestamp = dueDate ? new Date(dueDate).getTime() : NaN;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdue =
    Boolean(item.overdue) ||
    (!repaid && Number.isFinite(dueTimestamp) && dueTimestamp < today.getTime());

  return {
    id: String(item.id),
    friendName: item.friendName ?? item.friend_name ?? '',
    amount: Number(item.amount) || 0,
    dueDate,
    status: repaid ? 'REPAID' : overdue ? 'OVERDUE' : 'UNPAID',
    createdAt: item.createdAt ?? item.created_at ?? new Date().toISOString(),
    repaidAt: item.repaidAt ?? item.repaid_at ?? null,
    notes: item.notes ?? '',
  } as Loan;
}

export const api = {
  async sendOtp(phone: string): Promise<ApiResponse> {
    return request<ApiResponse>('/auth/request-otp', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  },

  async verifyOtp(phone: string, otp: string): Promise<ApiResponse> {
    return request<ApiResponse>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, otp }),
    });
  },

  async getSummary(): Promise<FinancialSummary> {
    const response = await request<ApiResponse<FinancialSummary>>(
      '/loans/summary',
      { method: 'GET' },
    );

    const payload = response?.summary ?? response?.data ?? response;

    return {
      totalLent: Number((payload as any)?.totalLent) || 0,
      totalRepaid: Number((payload as any)?.totalRepaid) || 0,
      overdueAmount: Number((payload as any)?.overdueAmount) || 0,
    };
  },

  async getLoans(): Promise<Loan[]> {
    const response = await request<ApiResponse>('/loans', {
      method: 'GET',
    });

    const loansList: any[] = Array.isArray(response?.loans)
      ? response.loans
      : Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
          ? (response as any)
          : [];

    return loansList.map(mapLoan);
  },

  async createLoan(data: {
    friendName: string;
    amount: number;
    dueDate: string;
    notes?: string;
  }): Promise<Loan> {
    const response = await request<ApiResponse>('/loans', {
      method: 'POST',
      body: JSON.stringify({
        friendName: data.friendName,
        amount: data.amount,
        dueDate: data.dueDate,
        notes: data.notes,
      }),
    });

    const item = response?.loan ?? response?.data ?? response;

    return mapLoan(item);
  },

  async repayLoan(id: string): Promise<Loan> {
    const response = await request<ApiResponse>(`/loans/${id}/repay`, {
      method: 'PATCH',
    });

    const item = response?.loan ?? response?.data ?? response;

    return mapLoan(item);
  },
};
