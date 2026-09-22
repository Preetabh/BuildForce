/**
 * Format currency in Indian Numbering System (Lakhs & Crores or comma separated)
 * e.g., ₹20,89,769.23 or ₹42,50,00,000
 */
export const formatCurrency = (
  amount: number | undefined | null,
  currency = 'INR',
  compact = false
): string => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '₹0.00';
  }

  if (compact) {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    }
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)} L`;
    }
  }

  // Standard Indian numbering formatting
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency || 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(amount);

  return formatted;
};

/**
 * Format date as DD-MM-YYYY (e.g. 09-07-2026)
 */
export const formatDate = (dateString?: string | Date | null): string => {
  if (!dateString) return 'Not set';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return 'Invalid Date';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  return `${day}-${month}-${year}`;
};

/**
 * Format relative time (e.g. 2 hours ago, yesterday)
 */
export const formatRelativeTime = (dateString?: string | Date | null): string => {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '';

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 30) return `${diffDays}d ago`;
  return formatDate(d);
};
