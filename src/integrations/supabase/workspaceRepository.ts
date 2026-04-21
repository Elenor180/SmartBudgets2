import type {
  AuthChangeEvent,
  Session,
  Subscription,
  User,
} from '@supabase/supabase-js';
import { createEmptyWorkspace, WORKSPACE_SCHEMA_VERSION } from '@/domain/defaults';
import type {
  AuthUser,
  Budget,
  CategoryId,
  Currency,
  Goal,
  Profile,
  Reminder,
  ReminderKind,
  ThemeMode,
  Transaction,
  WorkspaceState,
} from '@/domain/models';
import { sortBudgets } from '@/domain/selectors';
import { getSupabaseClient, isSupabaseConfigured } from '@/integrations/supabase/client';
import type { Database, Json } from '@/integrations/supabase/database.types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type BudgetRow = Database['public']['Tables']['budgets']['Row'];
type TransactionRow = Database['public']['Tables']['transactions']['Row'];
type GoalRow = Database['public']['Tables']['goals']['Row'];
type ReminderRow = Database['public']['Tables']['reminders']['Row'];
type WorkspaceSnapshotPayload = {
  profile: ProfileRow | null;
  setup_complete: boolean | null;
  budgets: BudgetRow[];
  transactions: TransactionRow[];
  goals: GoalRow[];
  reminders: ReminderRow[];
};

const now = () => new Date().toISOString();

const categoryIds = new Set<CategoryId>([
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

const reminderKinds = new Set<ReminderKind>(['bill', 'budget', 'goal']);

const normalizeCurrency = (value: string | null | undefined): Currency => {
  if (value === 'EUR' || value === 'GBP' || value === 'ZAR') {
    return value;
  }

  return 'USD';
};

const normalizeTheme = (value: string | null | undefined): ThemeMode =>
  value === 'dark' ? 'dark' : 'light';

const normalizeCategory = (value: string | null | undefined): CategoryId => {
  if (value && categoryIds.has(value as CategoryId)) {
    return value as CategoryId;
  }

  return 'other';
};

const normalizeReminderKind = (value: string | null | undefined): ReminderKind =>
  value && reminderKinds.has(value as ReminderKind)
    ? (value as ReminderKind)
    : 'bill';

const toNumber = (value: number | string | null | undefined, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const asRows = <TRow>(value: Json | null | undefined): TRow[] =>
  Array.isArray(value) ? (value as TRow[]) : [];

const isJsonObject = (
  value: Json | null | undefined,
): value is Record<string, Json> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const createBaseWorkspaceForUser = (user: User): WorkspaceState => {
  const base = createEmptyWorkspace();

  return {
    ...base,
    profile: {
      ...base.profile,
      email: user.email ?? '',
      fullName:
        typeof user.user_metadata.full_name === 'string'
          ? user.user_metadata.full_name
          : base.profile.fullName,
    },
  };
};

const mapProfileRow = (row: ProfileRow, user: User): Profile => {
  const fallback = createBaseWorkspaceForUser(user).profile;

  return {
    fullName: row.full_name || fallback.fullName,
    email: row.email || user.email || fallback.email,
    currency: normalizeCurrency(row.currency),
    monthlyIncome: toNumber(row.monthly_income, fallback.monthlyIncome),
    theme: normalizeTheme(row.theme),
    startedAt: row.started_at || fallback.startedAt,
  };
};

const mapBudgetRow = (row: BudgetRow): Budget => ({
  id: row.id,
  categoryId: normalizeCategory(row.category_id),
  limit: toNumber(row.limit_amount),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapTransactionRow = (row: TransactionRow): Transaction => ({
  id: row.id,
  description: row.description,
  amount: toNumber(row.amount),
  categoryId: normalizeCategory(row.category_id),
  occurredOn: row.occurred_on,
  notes: row.notes,
  createdAt: row.created_at,
});

const mapGoalRow = (row: GoalRow): Goal => ({
  id: row.id,
  name: row.name,
  categoryId: normalizeCategory(row.category_id),
  targetAmount: toNumber(row.target_amount),
  currentAmount: toNumber(row.current_amount),
  targetDate: row.target_date ?? '',
  notes: row.notes,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapReminderRow = (row: ReminderRow): Reminder => ({
  id: row.id,
  title: row.title,
  kind: normalizeReminderKind(row.kind),
  categoryId: row.category_id ? normalizeCategory(row.category_id) : undefined,
  dueDate: row.due_date ?? undefined,
  threshold:
    row.threshold === null ? undefined : toNumber(row.threshold),
  amount: row.amount === null ? undefined : toNumber(row.amount),
  note: row.note,
  active: row.active,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapBudgetsForRpc = (budgets: Budget[]): Json =>
  budgets.map((budget) => ({
    id: budget.id,
    category_id: budget.categoryId,
    limit_amount: budget.limit,
    created_at: budget.createdAt,
    updated_at: budget.updatedAt,
  }));

const mapTransactionsForRpc = (transactions: Transaction[]): Json =>
  transactions.map((transaction) => ({
    id: transaction.id,
    description: transaction.description,
    amount: transaction.amount,
    category_id: transaction.categoryId,
    occurred_on: transaction.occurredOn,
    notes: transaction.notes,
    created_at: transaction.createdAt,
  }));

const mapGoalsForRpc = (goals: Goal[]): Json =>
  goals.map((goal) => ({
    id: goal.id,
    name: goal.name,
    category_id: goal.categoryId,
    target_amount: goal.targetAmount,
    current_amount: goal.currentAmount,
    target_date: goal.targetDate || null,
    notes: goal.notes,
    created_at: goal.createdAt,
    updated_at: goal.updatedAt,
  }));

const mapRemindersForRpc = (reminders: Reminder[]): Json =>
  reminders.map((reminder) => ({
    id: reminder.id,
    title: reminder.title,
    kind: reminder.kind,
    category_id: reminder.categoryId ?? null,
    due_date: reminder.dueDate ?? null,
    threshold: reminder.threshold ?? null,
    amount: reminder.amount ?? null,
    note: reminder.note,
    active: reminder.active,
    created_at: reminder.createdAt,
    updated_at: reminder.updatedAt,
  }));

export const getCurrentSession = async (): Promise<Session | null> => {
  if (!isSupabaseConfigured) {
    return null;
  }

  const { data, error } = await getSupabaseClient().auth.getSession();
  if (error) {
    throw error;
  }

  return data.session;
};

export const onAuthStateChange = (
  callback: (event: AuthChangeEvent, session: Session | null) => void,
): Subscription | null => {
  if (!isSupabaseConfigured) {
    return null;
  }

  const {
    data: { subscription },
  } = getSupabaseClient().auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });

  return subscription;
};

export const signInWithPassword = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}) => {
  const { error } = await getSupabaseClient().auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }
};

export const signUpWithPassword = async ({
  email,
  password,
  fullName,
}: {
  email: string;
  password: string;
  fullName: string;
}) => {
  const emailRedirectTo =
    typeof window === 'undefined' ? undefined : window.location.origin;

  const { data, error } = await getSupabaseClient().auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo,
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    throw error;
  }

  return {
    session: data.session,
    needsEmailConfirmation: Boolean(data.user && !data.session),
  };
};

export const resendSignUpConfirmation = async (email: string) => {
  const emailRedirectTo =
    typeof window === 'undefined' ? undefined : window.location.origin;

  const { error } = await getSupabaseClient().auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo,
    },
  });

  if (error) {
    throw error;
  }
};

export const signOutFromSupabase = async () => {
  const { error } = await getSupabaseClient().auth.signOut();

  if (error) {
    throw error;
  }
};

export const getAuthUser = (session: Session | null): AuthUser | null => {
  if (!session?.user) {
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email ?? '',
  };
};

export const loadWorkspaceForUser = async (user: User): Promise<WorkspaceState> => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('get_workspace_snapshot');

  if (error) {
    throw error;
  }

  const fallback = createBaseWorkspaceForUser(user);
  const snapshot = isJsonObject(data)
    ? (data as unknown as Partial<WorkspaceSnapshotPayload>)
    : null;
  const profileRow =
    snapshot?.profile && isJsonObject(snapshot.profile as Json)
      ? (snapshot.profile as ProfileRow)
      : null;
  const profile = profileRow
    ? mapProfileRow(profileRow, user)
    : fallback.profile;
  const budgets = asRows<BudgetRow>(snapshot?.budgets as Json).map(mapBudgetRow);
  const transactions = asRows<TransactionRow>(
    snapshot?.transactions as Json,
  ).map(mapTransactionRow);
  const goals = asRows<GoalRow>(snapshot?.goals as Json).map(mapGoalRow);
  const reminders = asRows<ReminderRow>(
    snapshot?.reminders as Json,
  ).map(mapReminderRow);

  return {
    version: WORKSPACE_SCHEMA_VERSION,
    setupComplete: Boolean(snapshot?.setup_complete ?? profileRow?.setup_complete),
    profile,
    budgets: budgets.length > 0 ? sortBudgets(budgets) : fallback.budgets,
    transactions,
    goals,
    reminders,
  };
};

export const updateProfileSettings = async ({
  fullName,
  currency,
  monthlyIncome,
  theme,
  startedAt,
  setupComplete,
}: Partial<
  Pick<Profile, 'fullName' | 'currency' | 'monthlyIncome' | 'theme' | 'startedAt'>
> & {
  setupComplete?: boolean;
}) => {
  const { error } = await getSupabaseClient().rpc('upsert_profile_settings', {
    p_setup_complete: setupComplete ?? null,
    p_full_name: fullName ?? null,
    p_currency: currency ?? null,
    p_monthly_income: monthlyIncome ?? null,
    p_theme: theme ?? null,
    p_started_at: startedAt ?? null,
  });

  if (error) {
    throw error;
  }
};

const createMutationConflictError = (resource: string) =>
  new Error(`Conflict: ${resource} changed in another session. Reload and try again.`);

export const upsertBudgetRecord = async ({
  userId,
  categoryId,
  limit,
  currentBudgetId,
  currentBudgetUpdatedAt,
}: {
  userId: string;
  categoryId: CategoryId;
  limit: number;
  currentBudgetId?: string;
  currentBudgetUpdatedAt?: string;
}) => {
  if (currentBudgetId) {
    const { data, error } = await getSupabaseClient()
      .from('budgets')
      .update({
        limit_amount: limit,
      })
      .eq('id', currentBudgetId)
      .eq('user_id', userId)
      .eq('updated_at', currentBudgetUpdatedAt ?? '')
      .select('*')
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      throw createMutationConflictError('budget');
    }

    return mapBudgetRow(data);
  }

  const { data, error } = await getSupabaseClient()
    .from('budgets')
    .insert({
      user_id: userId,
      category_id: categoryId,
      limit_amount: limit,
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return mapBudgetRow(data);
};

export const deleteBudgetRecord = async ({
  userId,
  budgetId,
  updatedAt,
}: {
  userId: string;
  budgetId: string;
  updatedAt: string;
}) => {
  const { data, error } = await getSupabaseClient()
    .from('budgets')
    .delete()
    .eq('id', budgetId)
    .eq('user_id', userId)
    .eq('updated_at', updatedAt)
    .select('id')
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw createMutationConflictError('budget');
  }
};

export const createTransactionRecord = async ({
  userId,
  description,
  amount,
  categoryId,
  occurredOn,
  notes,
}: {
  userId: string;
  description: string;
  amount: number;
  categoryId: CategoryId;
  occurredOn: string;
  notes: string;
}) => {
  const { data, error } = await getSupabaseClient()
    .from('transactions')
    .insert({
      user_id: userId,
      description,
      amount,
      category_id: categoryId,
      occurred_on: occurredOn,
      notes,
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return mapTransactionRow(data);
};

export const deleteTransactionRecord = async ({
  userId,
  transactionId,
  createdAt,
}: {
  userId: string;
  transactionId: string;
  createdAt: string;
}) => {
  const { data, error } = await getSupabaseClient()
    .from('transactions')
    .delete()
    .eq('id', transactionId)
    .eq('user_id', userId)
    .eq('created_at', createdAt)
    .select('id')
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw createMutationConflictError('transaction');
  }
};

export const createGoalRecord = async ({
  userId,
  name,
  categoryId,
  targetAmount,
  currentAmount,
  targetDate,
  notes,
}: {
  userId: string;
  name: string;
  categoryId: CategoryId;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  notes: string;
}) => {
  const { data, error } = await getSupabaseClient()
    .from('goals')
    .insert({
      user_id: userId,
      name,
      category_id: categoryId,
      target_amount: targetAmount,
      current_amount: currentAmount,
      target_date: targetDate || null,
      notes,
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return mapGoalRow(data);
};

export const contributeToGoalRecord = async ({
  userId,
  goalId,
  updatedAt,
  currentAmount,
  targetAmount,
  contribution,
}: {
  userId: string;
  goalId: string;
  updatedAt: string;
  currentAmount: number;
  targetAmount: number;
  contribution: number;
}) => {
  const nextAmount = Math.min(
    targetAmount,
    Math.max(0, currentAmount + contribution),
  );

  const { data, error } = await getSupabaseClient()
    .from('goals')
    .update({
      current_amount: nextAmount,
    })
    .eq('id', goalId)
    .eq('user_id', userId)
    .eq('updated_at', updatedAt)
    .select('*')
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw createMutationConflictError('goal');
  }

  return mapGoalRow(data);
};

export const deleteGoalRecord = async ({
  userId,
  goalId,
  updatedAt,
}: {
  userId: string;
  goalId: string;
  updatedAt: string;
}) => {
  const { data, error } = await getSupabaseClient()
    .from('goals')
    .delete()
    .eq('id', goalId)
    .eq('user_id', userId)
    .eq('updated_at', updatedAt)
    .select('id')
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw createMutationConflictError('goal');
  }
};

export const createReminderRecord = async ({
  userId,
  title,
  kind,
  categoryId,
  dueDate,
  threshold,
  amount,
  note,
  active,
}: {
  userId: string;
  title: string;
  kind: ReminderKind;
  categoryId?: CategoryId;
  dueDate?: string;
  threshold?: number;
  amount?: number;
  note: string;
  active: boolean;
}) => {
  const { data, error } = await getSupabaseClient()
    .from('reminders')
    .insert({
      user_id: userId,
      title,
      kind,
      category_id: categoryId ?? null,
      due_date: dueDate ?? null,
      threshold: threshold ?? null,
      amount: amount ?? null,
      note,
      active,
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return mapReminderRow(data);
};

export const toggleReminderRecord = async ({
  userId,
  reminderId,
  updatedAt,
  active,
}: {
  userId: string;
  reminderId: string;
  updatedAt: string;
  active: boolean;
}) => {
  const { data, error } = await getSupabaseClient()
    .from('reminders')
    .update({
      active: !active,
    })
    .eq('id', reminderId)
    .eq('user_id', userId)
    .eq('updated_at', updatedAt)
    .select('*')
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw createMutationConflictError('reminder');
  }

  return mapReminderRow(data);
};

export const deleteReminderRecord = async ({
  userId,
  reminderId,
  updatedAt,
}: {
  userId: string;
  reminderId: string;
  updatedAt: string;
}) => {
  const { data, error } = await getSupabaseClient()
    .from('reminders')
    .delete()
    .eq('id', reminderId)
    .eq('user_id', userId)
    .eq('updated_at', updatedAt)
    .select('id')
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw createMutationConflictError('reminder');
  }
};

export const replaceWorkspaceSnapshot = async (
  workspace: WorkspaceState,
) => {
  const { error } = await getSupabaseClient().rpc('replace_workspace_snapshot', {
    p_setup_complete: workspace.setupComplete,
    p_full_name: workspace.profile.fullName,
    p_email: workspace.profile.email,
    p_currency: workspace.profile.currency,
    p_monthly_income: workspace.profile.monthlyIncome,
    p_theme: workspace.profile.theme,
    p_started_at: workspace.profile.startedAt || now(),
    p_budgets: mapBudgetsForRpc(workspace.budgets),
    p_transactions: mapTransactionsForRpc(workspace.transactions),
    p_goals: mapGoalsForRpc(workspace.goals),
    p_reminders: mapRemindersForRpc(workspace.reminders),
  });

  if (error) {
    throw error;
  }
};
