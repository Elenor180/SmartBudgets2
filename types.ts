
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

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  category: Category;
  deadline?: string;
  createdAt: string;
}

export interface IncomeSource {
  id: string;
  name: string;
  amount: number;
}

export interface IncomeRecord {
  month: string;
  amount: number;
}

export type ReminderType = 'budget_threshold' | 'upcoming_expense' | 'goal_milestone' | 'recurring_debit';

export interface Reminder {
  id: string;
  type: ReminderType;
  title: string;
  category?: Category;
  threshold?: number;
  dueDate?: string;
  amount?: number;
  isRecurring?: boolean;
  dayOfMonth?: number;
  lastTriggeredMonth?: string; // Format: "YYYY-MM"
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
  goals: Goal[];
  reminders: Reminder[];
  monthlyIncome: number;
  incomeSources: IncomeSource[];
  currency: Currency;
  incomeHistory: IncomeRecord[];
  theme: Theme;
  notificationPreferences: NotificationPreferences;
  alarsAutonomy: boolean;
}

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface AppNotification {
  id: string;
  message: string;
  type: NotificationType;
}
