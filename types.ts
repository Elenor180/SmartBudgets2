
export enum Category {
  FOOD = 'Food',
  RENT = 'Rent',
  TRANSPORT = 'Transport',
  ENTERTAINMENT = 'Entertainment',
  UTILITIES = 'Utilities',
  SAVINGS = 'Savings',
  HEALTH = 'Health',
  SHOPPING = 'Shopping',
  OTHERS = 'Others'
}

export enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  ZAR = 'ZAR',
  GBP = 'GBP',
  JPY = 'JPY'
}

export type Theme = 'light' | 'dark';

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Expense {
  id: string;
  amount: number;
  category: Category;
  description: string;
  date: string;
}

export interface Budget {
  category: Category;
  limit: number;
}

export interface IncomeRecord {
  month: string; // Format: "MMM YYYY" e.g., "Jan 2024"
  amount: number;
}

export type ReminderType = 'budget_threshold' | 'upcoming_expense';

export interface Reminder {
  id: string;
  type: ReminderType;
  title: string;
  category?: Category;
  threshold?: number; // e.g., 80 for 80%
  dueDate?: string; // For upcoming expenses
  triggered: boolean;
  createdAt: string;
}

export interface NotificationPreferences {
  weeklyReports: boolean;
  budgetThresholds: boolean;
  aiInsights: boolean;
  securityAlerts: boolean;
}

export interface FinancialState {
  expenses: Expense[];
  budgets: Budget[];
  reminders: Reminder[];
  monthlyIncome: number;
  currency: Currency;
  incomeHistory: IncomeRecord[];
  theme: Theme;
  notificationPreferences: NotificationPreferences;
}

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface AppNotification {
  id: string;
  message: string;
  type: NotificationType;
}
