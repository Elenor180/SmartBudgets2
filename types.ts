export enum Category {
  FOOD = 'Food',
  RENT = 'Rent',
  TRANSPORT = 'Transport',
  ENTERTAINMENT = 'Entertainment',
  UTILITIES = 'Utilities',
  SAVINGS = 'Savings',
  HEALTH = 'Health',
  SHOPPING = 'Shopping',
  INSURANCE = 'Insurance',
  OTHERS = 'Others'
}

export enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  ZAR = 'ZAR',
  GBP = 'GBP',
  JPY = 'JPY'
}

export enum SubscriptionTier {
  FREE = 'FREE',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY'
}

export type PaymentMethod = 'EFT' | 'CARD' | 'PAYPAL' | 'STRIPE';

export interface SubscriptionInfo {
  tier: SubscriptionTier;
  expiryDate?: string;
  autoRenew: boolean;
  paymentMethod?: PaymentMethod;
}

export type Theme = 'light' | 'dark';

export interface SMTPConfig {
  host: string;
  port: number;
  username: string;
  appPassword: string;
}

export interface OwnerConfig {
  ownerEmail: string;
  vaultPassword: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  branchCode: string;
  stripePublicKey: string;
  paypalEmail: string;
  lastUpdated: string;
  smtpConfig: SMTPConfig;
}

export interface User {
  id: string;
  email: string;
  name: string;
  subscription: SubscriptionInfo;
  isAdmin?: boolean;
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
  alarsDailyPromptsUsed: number;
  alarsLastPromptDate: string; // YYYY-MM-DD
}

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface AppNotification {
  id: string;
  message: string;
  type: NotificationType;
}