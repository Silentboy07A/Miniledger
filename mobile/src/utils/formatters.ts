import { Loan } from '../types';

/**
 * Format currency strictly in Indian Rupee format (e.g. ₹5,000.00 or ₹1,50,000.00)
 */
export const formatINR = (
  amount: number | null | undefined,
  compact = false
): string => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0.00';
  }
  const isNegative = amount < 0;
  const absVal = Math.abs(amount);

  if (compact && absVal >= 10000000) {
    return `${isNegative ? '-' : ''}₹${(absVal / 10000000).toFixed(2)} Cr`;
  }
  if (compact && absVal >= 100000) {
    return `${isNegative ? '-' : ''}₹${(absVal / 100000).toFixed(2)} L`;
  }

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
  // If pure date format YYYY-MM-DD without time/time zone
  if (!dateStr.includes('T')) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
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
 * Get human-friendly relative due date string:
 * e.g., "Due in 3 days", "Due today", "3 days overdue"
 */
export const getRelativeDueString = (
  dueDateStr: string,
  status: string
): { text: string; isOverdue: boolean } => {
  if (status === 'REPAID') {
    return { text: 'Settled', isOverdue: false };
  }

  const dueDate = parseLocalDate(dueDateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);

  const diffMs = dueDate.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    return {
      text: overdueDays === 1 ? '1 day overdue' : `${overdueDays} days overdue`,
      isOverdue: true,
    };
  }

  if (diffDays === 0) {
    return { text: 'Due today', isOverdue: false };
  }

  if (diffDays === 1) {
    return { text: 'Due tomorrow', isOverdue: false };
  }

  return { text: `Due in ${diffDays} days`, isOverdue: false };
};

/**
 * Extract 1-2 letter initials from friend name for elegant avatars
 */
export const getFriendInitials = (name: string): string => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

/**
 * Mask phone number for display: e.g. +91 ••••• 3210
 */
export const maskPhoneNumber = (phone: string): string => {
  const clean = phone.trim();
  if (!clean) return '';
  if (clean.length <= 6) return clean;
  if (clean.startsWith('+91') && clean.length === 13) {
    return `+91 ••••• ${clean.slice(-4)}`;
  }
  if (clean.length === 10) {
    return `••••• ${clean.slice(-4)}`;
  }
  const start = clean.slice(0, 3);
  const end = clean.slice(-4);
  return `${start} •••• ${end}`;
};

/**
 * Sort loans by priority:
 * 1. Overdue unpaid loans (earliest due first)
 * 2. Active unpaid loans (earliest due first)
 * 3. Repaid loans (most recently due/repaid first)
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

    const dateA = parseLocalDate(a.dueDate).getTime();
    const dateB = parseLocalDate(b.dueDate).getTime();
    return pA === 3 ? dateB - dateA : dateA - dateB;
  });
};
