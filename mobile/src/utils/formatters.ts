import { Loan } from '../types';

/**
 * Format currency strictly in Indian Rupee format (e.g. ₹5,000.00 or ₹1,50,000.00)
 */
export const formatINR = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0.00';
  }
  const isNegative = amount < 0;
  const absVal = Math.abs(amount);
  const fixed = absVal.toFixed(2);
  const [intPart, decPart] = fixed.split('.');

  // Indian numbering format: group last 3, then group by 2
  const lastThree = intPart.slice(-3);
  const otherNumbers = intPart.slice(0, -3);
  const formattedInt =
    otherNumbers !== ''
      ? otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree
      : lastThree;

  return `${isNegative ? '-' : ''}₹${formattedInt}.${decPart}`;
};

/**
 * Safe local calendar date parser to prevent UTC midnight shifts
 */
export const parseLocalDate = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  // If YYYY-MM-DD
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  return new Date(dateStr);
};

/**
 * Format date to standard readable format e.g., "24 Oct 2026"
 */
export const formatDate = (dateStr: string): string => {
  try {
    const date = parseLocalDate(dateStr);
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    const day = date.getDate().toString().padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return dateStr;
  }
};

/**
 * Format Date object to YYYY-MM-DD for backend APIs
 */
export const toIsoDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Determine if a loan is overdue based on local midnight comparison
 */
export const isLoanOverdue = (dueDateStr: string, status: string): boolean => {
  if (status === 'REPAID') {
    return false;
  }
  const dueDate = parseLocalDate(dueDateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);
  return dueDate < today;
};

/**
 * Mask phone number for OTP verification display: e.g. +91 98••••••10
 */
export const maskPhoneNumber = (phone: string): string => {
  const clean = phone.trim();
  if (clean.length <= 4) return clean;
  const start = clean.slice(0, Math.min(6, clean.length - 4));
  const end = clean.slice(-4);
  const maskedCount = Math.max(0, clean.length - start.length - end.length);
  return `${start}${'•'.repeat(maskedCount)}${end}`;
};

/**
 * Sort loans by priority:
 * 1. Overdue unpaid loans
 * 2. Other unpaid loans
 * 3. Repaid loans
 */
export const sortLoans = (loans: Loan[]): Loan[] => {
  return [...loans].sort((a, b) => {
    const aRepaid = a.status === 'REPAID';
    const bRepaid = b.status === 'REPAID';
    const aOverdue = isLoanOverdue(a.dueDate, a.status);
    const bOverdue = isLoanOverdue(b.dueDate, b.status);

    const getPriority = (repaid: boolean, overdue: boolean): number => {
      if (overdue && !repaid) return 1;
      if (!repaid) return 2;
      return 3;
    };

    const pA = getPriority(aRepaid, aOverdue);
    const pB = getPriority(bRepaid, bOverdue);

    if (pA !== pB) {
      return pA - pB;
    }

    // Secondary sort: earliest due date first for active loans, latest first for repaid
    const dateA = parseLocalDate(a.dueDate).getTime();
    const dateB = parseLocalDate(b.dueDate).getTime();
    return pA === 3 ? dateB - dateA : dateA - dateB;
  });
};
