export const themeModes = ['light', 'dark'] as const;

export type ThemeMode = (typeof themeModes)[number];

export const currencies = ['USD', 'EUR', 'GBP', 'ZAR'] as const;

export type Currency = (typeof currencies)[number];

export const categoryIds = [
  'housing',
  'food',
  'transport',
  'utilities',
  'healthcare',
  'debt',
  'entertainment',
  'savings',
  'education',
  'other',
] as const;

export type CategoryId = (typeof categoryIds)[number];

export interface CategoryDefinition {
  id: CategoryId;
  label: string;
  description: string;
  tone: 'teal' | 'amber' | 'rose' | 'sky' | 'mint' | 'slate';
}

export const categoryDefinitions = [
  {
    id: 'housing',
    label: 'Housing',
    description: 'Rent, mortgage, and household costs.',
    tone: 'teal',
  },
  {
    id: 'food',
    label: 'Food',
    description: 'Groceries, takeout, and dining.',
    tone: 'amber',
  },
  {
    id: 'transport',
    label: 'Transport',
    description: 'Fuel, rides, commuting, and travel.',
    tone: 'sky',
  },
  {
    id: 'utilities',
    label: 'Utilities',
    description: 'Electricity, water, internet, and mobile.',
    tone: 'mint',
  },
  {
    id: 'healthcare',
    label: 'Healthcare',
    description: 'Medical costs, pharmacy, and insurance.',
    tone: 'rose',
  },
  {
    id: 'debt',
    label: 'Debt',
    description: 'Loans, cards, and repayment plans.',
    tone: 'rose',
  },
  {
    id: 'entertainment',
    label: 'Entertainment',
    description: 'Streaming, events, subscriptions, and fun.',
    tone: 'amber',
  },
  {
    id: 'savings',
    label: 'Savings',
    description: 'Cash reserves and long-term saving.',
    tone: 'teal',
  },
  {
    id: 'education',
    label: 'Education',
    description: 'Books, courses, and development.',
    tone: 'sky',
  },
  {
    id: 'other',
    label: 'Other',
    description: 'Everything else that still needs tracking.',
    tone: 'slate',
  },
] as const satisfies readonly CategoryDefinition[];

export const reminderKinds = ['bill', 'budget', 'goal'] as const;

export type ReminderKind = (typeof reminderKinds)[number];

export interface Profile {
  fullName: string;
  email: string;
  currency: Currency;
  monthlyIncome: number;
  theme: ThemeMode;
  startedAt: string;
}

export interface Budget {
  id: string;
  categoryId: CategoryId;
  limit: number;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  categoryId: CategoryId;
  occurredOn: string;
  notes: string;
  createdAt: string;
}

export interface Goal {
  id: string;
  name: string;
  categoryId: CategoryId;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Reminder {
  id: string;
  title: string;
  kind: ReminderKind;
  categoryId?: CategoryId;
  dueDate?: string;
  threshold?: number;
  amount?: number;
  note: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceState {
  version: number;
  setupComplete: boolean;
  profile: Profile;
  budgets: Budget[];
  transactions: Transaction[];
  goals: Goal[];
  reminders: Reminder[];
}

export interface SetupBudgetTarget {
  categoryId: CategoryId;
  monthlyAmount: number;
}

export interface SetupPayload {
  fullName: string;
  email: string;
  currency: Currency;
  monthlyIncome: number;
  theme: ThemeMode;
  budgetTargets: SetupBudgetTarget[];
  monthlySavingsTarget: number;
}

export interface AuthUser {
  id: string;
  email: string;
}

export type AdvisorTone = 'teal' | 'amber' | 'rose' | 'sky';

export type AdvisorActionKind =
  | 'upsert_budget'
  | 'create_goal'
  | 'create_reminder'
  | 'update_monthly_income'
  | 'log_transaction';

export interface AdvisorInsight {
  title: string;
  detail: string;
  tone: AdvisorTone;
}

export interface AdvisorNotice {
  title: string;
  detail: string;
  urgency: 'low' | 'medium' | 'high';
}

export interface AdvisorAction {
  id: string;
  kind: AdvisorActionKind;
  title: string;
  rationale: string;
  categoryId?: CategoryId;
  amount?: number;
  limit?: number;
  name?: string;
  targetAmount?: number;
  currentAmount?: number;
  targetDate?: string;
  dueDate?: string;
  threshold?: number;
  reminderTitle?: string;
  description?: string;
  notes?: string;
  reminderKind?: ReminderKind;
}

export interface AdvisorResponse {
  headline: string;
  message: string;
  insights: AdvisorInsight[];
  notices: AdvisorNotice[];
  actions: AdvisorAction[];
}

export interface WorkspaceAuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isConfigured: boolean;
  isLoading: boolean;
  isWorkspaceReady: boolean;
  isSaving: boolean;
  syncError: string | null;
  notice: string | null;
}

export interface WorkspaceContextValue {
  state: WorkspaceState;
  auth: WorkspaceAuthState;
  actions: {
    signIn: (payload: { email: string; password: string }) => Promise<void>;
    signUp: (payload: {
      fullName: string;
      email: string;
      password: string;
    }) => Promise<void>;
    resendConfirmation: (email: string) => Promise<void>;
    reloadWorkspace: () => Promise<void>;
    signOut: () => Promise<void>;
    clearNotice: () => void;
    completeSetup: (
      payload: SetupPayload,
      seedSample: boolean,
    ) => Promise<void>;
    updateProfile: (payload: Partial<Profile>) => Promise<void>;
    setTheme: (theme: ThemeMode) => Promise<void>;
    upsertBudget: (payload: {
      categoryId: CategoryId;
      limit: number;
    }) => Promise<void>;
    removeBudget: (categoryId: CategoryId) => Promise<void>;
    addTransaction: (
      payload: Omit<Transaction, 'id' | 'createdAt'>,
    ) => Promise<void>;
    deleteTransaction: (transactionId: string) => Promise<void>;
    addGoal: (
      payload: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>,
    ) => Promise<void>;
    contributeToGoal: (
      goalId: string,
      contribution: number,
    ) => Promise<void>;
    deleteGoal: (goalId: string) => Promise<void>;
    addReminder: (
      payload: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>,
    ) => Promise<void>;
    toggleReminder: (reminderId: string) => Promise<void>;
    deleteReminder: (reminderId: string) => Promise<void>;
    replaceWorkspace: (payload: WorkspaceState) => Promise<void>;
    resetWorkspace: () => Promise<void>;
    loadSampleWorkspace: () => Promise<void>;
  };
}
