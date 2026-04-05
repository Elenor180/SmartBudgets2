import { categoryDefinitions, type Currency } from '@/domain/models';

export const formatCurrency = (amount: number, currency: Currency) =>
  new Intl.NumberFormat(currency === 'ZAR' ? 'en-ZA' : 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);

export const formatCompactCurrency = (amount: number, currency: Currency) =>
  new Intl.NumberFormat(currency === 'ZAR' ? 'en-ZA' : 'en-US', {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount);

export const formatPercent = (value: number) =>
  `${Math.max(value, 0).toFixed(1)}%`;

export const formatLongDate = (value: string) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));

export const toDateInputValue = (value: string) =>
  new Date(value).toISOString().slice(0, 10);

export const getMonthKey = (value: string) =>
  new Date(value).toISOString().slice(0, 7);

export const getMonthLabel = (monthKey: string) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${monthKey}-01T00:00:00.000Z`));

export const daysUntil = (value: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(value);
  target.setHours(0, 0, 0, 0);

  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

export const getCategoryLabel = (categoryId: string) =>
  categoryDefinitions.find((category) => category.id === categoryId)?.label ??
  'Other';

export const getCategoryTone = (categoryId: string) =>
  categoryDefinitions.find((category) => category.id === categoryId)?.tone ??
  'slate';
