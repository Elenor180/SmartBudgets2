import type {
  Budget,
  CategoryId,
  Currency,
  Goal,
  Profile,
  Reminder,
  ThemeMode,
  Transaction,
  WorkspaceState,
} from '@/domain/models';
import { createId } from '@/lib/id';

export const WORKSPACE_SCHEMA_VERSION = 1;

const now = () => new Date().toISOString();

const createProfile = (
  overrides: Partial<Profile> = {},
): Profile => ({
  fullName: '',
  email: '',
  currency: 'USD',
  monthlyIncome: 0,
  theme: 'light',
  startedAt: now(),
  ...overrides,
});

export const defaultBudgetLimits: Record<CategoryId, number> = {
  housing: 1250,
  food: 420,
  transport: 240,
  utilities: 180,
  healthcare: 140,
  debt: 300,
  entertainment: 160,
  savings: 500,
  education: 120,
  other: 150,
};

export const createDefaultBudgets = (): Budget[] => {
  const createdAt = now();

  return Object.entries(defaultBudgetLimits).map(([categoryId, limit]) => ({
    id: createId(`budget-${categoryId}`),
    categoryId: categoryId as CategoryId,
    limit,
    createdAt,
    updatedAt: createdAt,
  }));
};

export const createEmptyWorkspace = (): WorkspaceState => ({
  version: WORKSPACE_SCHEMA_VERSION,
  setupComplete: false,
  profile: createProfile(),
  budgets: [],
  transactions: [],
  goals: [],
  reminders: [],
});

const daysAgo = (count: number) => {
  const value = new Date();
  value.setDate(value.getDate() - count);
  return value.toISOString();
};

const daysFromNow = (count: number) => {
  const value = new Date();
  value.setDate(value.getDate() + count);
  return value.toISOString();
};

const sampleTransactions = (): Transaction[] => [
  {
    id: createId('txn'),
    description: 'Rent payment',
    amount: 1200,
    categoryId: 'housing',
    occurredOn: daysAgo(6),
    notes: 'Monthly apartment rent',
    createdAt: daysAgo(6),
  },
  {
    id: createId('txn'),
    description: 'Groceries',
    amount: 112,
    categoryId: 'food',
    occurredOn: daysAgo(4),
    notes: 'Weekly grocery run',
    createdAt: daysAgo(4),
  },
  {
    id: createId('txn'),
    description: 'Fuel top-up',
    amount: 54,
    categoryId: 'transport',
    occurredOn: daysAgo(3),
    notes: 'Commute refill',
    createdAt: daysAgo(3),
  },
  {
    id: createId('txn'),
    description: 'Internet bill',
    amount: 78,
    categoryId: 'utilities',
    occurredOn: daysAgo(2),
    notes: 'Home connectivity',
    createdAt: daysAgo(2),
  },
  {
    id: createId('txn'),
    description: 'Emergency fund transfer',
    amount: 250,
    categoryId: 'savings',
    occurredOn: daysAgo(1),
    notes: 'Automatic savings transfer',
    createdAt: daysAgo(1),
  },
];

const sampleGoals = (): Goal[] => {
  const createdAt = now();

  return [
    {
      id: createId('goal'),
      name: 'Emergency reserve',
      categoryId: 'savings',
      targetAmount: 8000,
      currentAmount: 2500,
      targetDate: daysFromNow(180),
      notes: 'Build six months of runway.',
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: createId('goal'),
      name: 'Professional course',
      categoryId: 'education',
      targetAmount: 1200,
      currentAmount: 450,
      targetDate: daysFromNow(75),
      notes: 'Fund a certification by next quarter.',
      createdAt,
      updatedAt: createdAt,
    },
  ];
};

const sampleReminders = (): Reminder[] => {
  const createdAt = now();

  return [
    {
      id: createId('reminder'),
      title: 'Electricity bill due',
      kind: 'bill',
      dueDate: daysFromNow(5),
      amount: 95,
      note: 'Pay before the due date to avoid fees.',
      active: true,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: createId('reminder'),
      title: 'Food budget threshold',
      kind: 'budget',
      categoryId: 'food',
      threshold: 80,
      note: 'Review food spending before weekend.',
      active: true,
      createdAt,
      updatedAt: createdAt,
    },
  ];
};

export const createSampleWorkspace = (
  overrides: Partial<{
    fullName: string;
    email: string;
    currency: Currency;
    monthlyIncome: number;
    theme: ThemeMode;
  }> = {},
): WorkspaceState => ({
  version: WORKSPACE_SCHEMA_VERSION,
  setupComplete: true,
  profile: createProfile({
    fullName: overrides.fullName || 'Randy',
    email: overrides.email || '',
    currency: overrides.currency || 'USD',
    monthlyIncome: overrides.monthlyIncome || 5600,
    theme: overrides.theme || 'light',
  }),
  budgets: createDefaultBudgets(),
  transactions: sampleTransactions(),
  goals: sampleGoals(),
  reminders: sampleReminders(),
});
