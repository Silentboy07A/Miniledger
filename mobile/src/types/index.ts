export type LoanStatus = 'UNPAID' | 'REPAID' | 'OVERDUE';

export interface Loan {
  id: string;
  friendName: string;
  amount: number;
  dueDate: string; // ISO date format YYYY-MM-DD
  status: LoanStatus;
  createdAt?: string;
  repaidAt?: string | null;
  notes?: string;
}

export interface FinancialSummary {
  totalLent: number;
  totalRepaid: number;
  overdueAmount: number;
}

export interface User {
  id: string;
  phone: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: User;
}

export interface SendOtpResponse {
  success: boolean;
  message: string;
  mockOtp?: string; // Only present if backend sends in dev mode
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export type RootStackParamList = {
  Login: undefined;
  OtpVerify: { phone: string };
  Dashboard: undefined;
  AddLoan: undefined;
  LoanDetails: { loan: Loan };
};
