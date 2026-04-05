import {
  type Budget,
  type CategoryId,
  type Goal,
  type Profile,
  type Reminder,
  type ReminderKind,
  type SetupPayload,
  type ThemeMode,
  type Transaction,
  type WorkspaceState,
} from '@/domain/models';
import {
  WORKSPACE_SCHEMA_VERSION,
  createDefaultBudgets,
  createEmptyWorkspace,
  createSampleWorkspace,
} from '@/domain/defaults';
import { sortBudgets } from '@/domain/selectors';
import { createId } from '@/lib/id';

const now = () => new Date().toISOString();
const validCategoryIds = new Set<CategoryId>([
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
]);

const isCategoryId = (value: unknown): value is CategoryId =>
  typeof value === 'string' && validCategoryIds.has(value as CategoryId);

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeTheme = (value: unknown): ThemeMode =>
  value === 'dark' ? 'dark' : 'light';

const normalizeCurrency = (value: unknown): Profile['currency'] =>
  value === 'EUR' || value === 'GBP' || value === 'ZAR' ? value : 'USD';

const legacyCategoryMap: Record<string, CategoryId> = {
  Food: 'food',
  Housing: 'housing',
  Rent: 'housing',
  Transport: 'transport',
  Utilities: 'utilities',
  Healthcare: 'healthcare',
  Debt: 'debt',
  Entertainment: 'entertainment',
  Savings: 'savings',
  Education: 'education',
  Other: 'other',
};

const normalizeCategory = (value: unknown): CategoryId => {
  if (isCategoryId(value)) {
    return value;
  }

  if (typeof value === 'string' && legacyCategoryMap[value]) {
    return legacyCategoryMap[value];
  }

  return 'other';
};

const normalizeProfile = (value: unknown): Profile => {
  const base = createEmptyWorkspace().profile;

  if (!value || typeof value !== 'object') {
    return base;
  }

  const candidate = value as Partial<Profile>;

  return {
    fullName:
      typeof candidate.fullName === 'string'
        ? candidate.fullName
        : base.fullName,
    email: typeof candidate.email === 'string' ? candidate.email : base.email,
    currency: normalizeCurrency(candidate.currency),
    monthlyIncome: toNumber(candidate.monthlyIncome, base.monthlyIncome),
    theme: normalizeTheme(candidate.theme),
    startedAt:
      typeof candidate.startedAt === 'string' ? candidate.startedAt : base.startedAt,
  };
};

const normalizeBudgets = (value: unknown): Budget[] => {
  if (!Array.isArray(value)) {
    return createDefaultBudgets();
  }

  const budgets = value.map((budget) => {
    const candidate = budget as Partial<Budget> & { category?: unknown };
    const timestamp = now();

    return {
      id: typeof candidate.id === 'string' ? candidate.id : createId('budget'),
      categoryId: normalizeCategory(candidate.categoryId ?? candidate.category),
      limit: toNumber(candidate.limit, 0),
      createdAt:
        typeof candidate.createdAt === 'string' ? candidate.createdAt : timestamp,
      updatedAt:
        typeof candidate.updatedAt === 'string' ? candidate.updatedAt : timestamp,
    };
  });

  return sortBudgets(
    budgets.filter(
      (budget, index, collection) =>
        collection.findIndex(
          (candidate) => candidate.categoryId === budget.categoryId,
        ) === index,
    ),
  );
};

const normalizeTransactions = (value: unknown): Transaction[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((transaction) => {
      const candidate = transaction as Partial<Transaction> & {
        category?: unknown;
        date?: unknown;
        expenseDate?: unknown;
      };
      const timestamp = now();
      const occurredOn = String(
        candidate.occurredOn ?? candidate.date ?? candidate.expenseDate ?? timestamp,
      );

      return {
        id:
          typeof candidate.id === 'string' ? candidate.id : createId('transaction'),
        description:
          typeof candidate.description === 'string'
            ? candidate.description
            : 'Untitled transaction',
        amount: toNumber(candidate.amount, 0),
        categoryId: normalizeCategory(
          candidate.categoryId ?? candidate.category ?? 'other',
        ),
        occurredOn,
        notes: typeof candidate.notes === 'string' ? candidate.notes : '',
        createdAt:
          typeof candidate.createdAt === 'string' ? candidate.createdAt : occurredOn,
      };
    })
    .sort(
      (left, right) =>
        new Date(right.occurredOn).getTime() - new Date(left.occurredOn).getTime(),
    );
};

const normalizeGoals = (value: unknown): Goal[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((goal) => {
    const candidate = goal as Partial<Goal> & { category?: unknown };
    const timestamp = now();

    return {
      id: typeof candidate.id === 'string' ? candidate.id : createId('goal'),
      name: typeof candidate.name === 'string' ? candidate.name : 'Untitled goal',
      categoryId: normalizeCategory(candidate.categoryId ?? candidate.category),
      targetAmount: toNumber(candidate.targetAmount, 0),
      currentAmount: toNumber(candidate.currentAmount, 0),
      targetDate:
        typeof candidate.targetDate === 'string' ? candidate.targetDate : '',
      notes: typeof candidate.notes === 'string' ? candidate.notes : '',
      createdAt:
        typeof candidate.createdAt === 'string' ? candidate.createdAt : timestamp,
      updatedAt:
        typeof candidate.updatedAt === 'string' ? candidate.updatedAt : timestamp,
    };
  });
};

const normalizeReminderKind = (value: unknown): ReminderKind => {
  if (value === 'goal' || value === 'budget' || value === 'bill') {
    return value;
  }

  if (value === 'budget_threshold') {
    return 'budget';
  }

  return 'bill';
};

const normalizeReminders = (value: unknown): Reminder[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((reminder) => {
    const candidate = reminder as Partial<Reminder> & {
      category?: unknown;
      type?: unknown;
      isActive?: unknown;
    };
    const timestamp = now();

    return {
      id:
        typeof candidate.id === 'string' ? candidate.id : createId('reminder'),
      title:
        typeof candidate.title === 'string'
          ? candidate.title
          : 'Untitled reminder',
      kind: normalizeReminderKind(candidate.kind ?? candidate.type),
      categoryId: candidate.categoryId || candidate.category
        ? normalizeCategory(candidate.categoryId ?? candidate.category)
        : undefined,
      dueDate:
        typeof candidate.dueDate === 'string' ? candidate.dueDate : undefined,
      threshold:
        typeof candidate.threshold === 'number'
          ? candidate.threshold
          : undefined,
      amount:
        typeof candidate.amount === 'number' ? candidate.amount : undefined,
      note: typeof candidate.note === 'string' ? candidate.note : '',
      active:
        typeof candidate.active === 'boolean'
          ? candidate.active
          : Boolean(candidate.isActive ?? true),
      createdAt:
        typeof candidate.createdAt === 'string' ? candidate.createdAt : timestamp,
      updatedAt:
        typeof candidate.updatedAt === 'string' ? candidate.updatedAt : timestamp,
    };
  });
};

export const normalizeWorkspace = (value: unknown): WorkspaceState => {
  const fallback = createEmptyWorkspace();

  if (!value || typeof value !== 'object') {
    return fallback;
  }

  const candidate = value as Partial<WorkspaceState>;

  return {
    version: WORKSPACE_SCHEMA_VERSION,
    setupComplete: Boolean(candidate.setupComplete),
    profile: normalizeProfile(candidate.profile),
    budgets: normalizeBudgets(candidate.budgets),
    transactions: normalizeTransactions(candidate.transactions),
    goals: normalizeGoals(candidate.goals),
    reminders: normalizeReminders(candidate.reminders),
  };
};

export const serializeWorkspace = (state: WorkspaceState) =>
  JSON.stringify(state, null, 2);

export const deserializeWorkspace = (raw: string) =>
  normalizeWorkspace(JSON.parse(raw));

export const createWorkspaceFromSetup = (
  payload: SetupPayload,
  seedSample: boolean,
) => {
  if (seedSample) {
    return createSampleWorkspace(payload);
  }

  const base = createEmptyWorkspace();

  return {
    ...base,
    setupComplete: true,
    profile: {
      ...base.profile,
      ...payload,
      startedAt: now(),
    },
  };
};
