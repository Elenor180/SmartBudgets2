import {
  categoryDefinitions,
  type Budget,
  type CategoryId,
  type Reminder,
  type Transaction,
  type WorkspaceState,
} from '@/domain/models';
import { getMonthKey, getMonthLabel, toDateInputValue } from '@/lib/format';

const categoryOrder = new Map(
  categoryDefinitions.map((category, index) => [category.id, index] as const),
);

export const sortBudgets = (budgets: Budget[]) =>
  [...budgets].sort(
    (left, right) =>
      (categoryOrder.get(left.categoryId) ?? 0) -
      (categoryOrder.get(right.categoryId) ?? 0),
  );

export const getTotalBudget = (state: WorkspaceState) =>
  state.budgets.reduce((sum, budget) => sum + budget.limit, 0);

export const getTotalSpent = (
  transactions: Transaction[],
  monthKey = getMonthKey(new Date().toISOString()),
) =>
  transactions
    .filter((transaction) => getMonthKey(transaction.occurredOn) === monthKey)
    .reduce((sum, transaction) => sum + transaction.amount, 0);

export const getCategorySpend = (
  transactions: Transaction[],
  monthKey = getMonthKey(new Date().toISOString()),
) => {
  const spending = new Map<CategoryId, number>();

  for (const category of categoryDefinitions) {
    spending.set(category.id, 0);
  }

  for (const transaction of transactions) {
    if (getMonthKey(transaction.occurredOn) !== monthKey) {
      continue;
    }

    spending.set(
      transaction.categoryId,
      (spending.get(transaction.categoryId) ?? 0) + transaction.amount,
    );
  }

  return categoryDefinitions.map((category) => ({
    ...category,
    amount: spending.get(category.id) ?? 0,
  }));
};

export const getBudgetPerformance = (state: WorkspaceState) => {
  const spending = getCategorySpend(state.transactions);

  return sortBudgets(state.budgets).map((budget) => {
    const categorySpending =
      spending.find((entry) => entry.id === budget.categoryId)?.amount ?? 0;
    const remaining = budget.limit - categorySpending;
    const usage = budget.limit > 0 ? (categorySpending / budget.limit) * 100 : 0;

    return {
      budget,
      spent: categorySpending,
      remaining,
      usage,
    };
  });
};

export const getMonthlyTrend = (
  transactions: Transaction[],
  months = 6,
) => {
  const orderedKeys: string[] = [];
  const lookup = new Map<string, number>();

  for (let index = months - 1; index >= 0; index -= 1) {
    const current = new Date();
    current.setMonth(current.getMonth() - index);
    current.setDate(1);
    const key = getMonthKey(current.toISOString());
    orderedKeys.push(key);
    lookup.set(key, 0);
  }

  for (const transaction of transactions) {
    const key = getMonthKey(transaction.occurredOn);
    if (!lookup.has(key)) {
      continue;
    }

    lookup.set(key, (lookup.get(key) ?? 0) + transaction.amount);
  }

  return orderedKeys.map((key) => ({
    key,
    label: getMonthLabel(key),
    amount: lookup.get(key) ?? 0,
  }));
};

export const getUpcomingReminders = (
  reminders: Reminder[],
  lookAheadDays = 14,
) => {
  const now = new Date();
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + lookAheadDays);

  return reminders
    .filter((reminder) => reminder.active && reminder.dueDate)
    .filter((reminder) => {
      const due = new Date(reminder.dueDate as string);
      return due >= now && due <= maxDate;
    })
    .sort(
      (left, right) =>
        new Date(left.dueDate as string).getTime() -
        new Date(right.dueDate as string).getTime(),
    );
};

export const getRecentTransactions = (
  transactions: Transaction[],
  count = 6,
) =>
  [...transactions]
    .sort(
      (left, right) =>
        new Date(right.occurredOn).getTime() - new Date(left.occurredOn).getTime(),
    )
    .slice(0, count);

export const getSavingsRate = (state: WorkspaceState) => {
  const spent = getTotalSpent(state.transactions);

  if (state.profile.monthlyIncome <= 0) {
    return 0;
  }

  return ((state.profile.monthlyIncome - spent) / state.profile.monthlyIncome) * 100;
};

export const getInsightMessages = (state: WorkspaceState) => {
  const isCleanWorkspace =
    state.profile.monthlyIncome <= 0 &&
    state.budgets.length === 0 &&
    state.transactions.length === 0 &&
    state.goals.length === 0 &&
    state.reminders.length === 0;

  if (isCleanWorkspace) {
    return [
      {
        title: 'Clean start',
        body:
          'Your workspace is empty right now. Set your profile, add income, and create the first few budgets when you are ready.',
      },
      {
        title: 'First step',
        body:
          'Open settings or finish onboarding to update your name, currency, monthly income, and other account details.',
      },
      {
        title: 'Build your baseline',
        body:
          'Once you add a budget or transaction, the dashboard, insights, and economist will begin reflecting your real numbers.',
      },
    ];
  }

  const budgetPerformance = getBudgetPerformance(state);
  const topRisk = budgetPerformance
    .filter((entry) => entry.usage >= 80)
    .sort((left, right) => right.usage - left.usage)[0];
  const totalSpent = getTotalSpent(state.transactions);
  const savingsRate = getSavingsRate(state);
  const soonestReminder = getUpcomingReminders(state.reminders, 10)[0];

  const messages = [
    {
      title: 'Monthly posture',
      body:
        savingsRate >= 20
          ? 'Your current spending leaves healthy room for saving and goals.'
          : 'Your savings runway is tightening; review variable spending categories first.',
    },
  ];

  if (topRisk) {
    const category =
      categoryDefinitions.find(
        (definition) => definition.id === topRisk.budget.categoryId,
      )?.label ?? topRisk.budget.categoryId;

    messages.push({
      title: 'Category pressure',
      body: `${category} is already at ${Math.round(
        topRisk.usage,
      )}% of its limit for ${getMonthLabel(getMonthKey(new Date().toISOString()))}.`,
    });
  }

  if (soonestReminder?.dueDate) {
    messages.push({
      title: 'Upcoming reminder',
      body: `${soonestReminder.title} lands on ${toDateInputValue(
        soonestReminder.dueDate,
      )}.`,
    });
  }

  if (state.goals.length > 0) {
    const nextGoal = [...state.goals].sort(
      (left, right) =>
        left.currentAmount / left.targetAmount - right.currentAmount / right.targetAmount,
    )[0];

    if (nextGoal) {
      messages.push({
        title: 'Goal focus',
        body: `${nextGoal.name} is ${Math.round(
          (nextGoal.currentAmount / nextGoal.targetAmount) * 100,
        )}% funded. A small weekly contribution would move it forward quickly.`,
      });
    }
  }

  if (messages.length < 4) {
    messages.push({
      title: 'Observed spending',
      body: `You have logged ${state.transactions.length} expenses totaling ${totalSpent.toFixed(
        2,
      )} this month.`,
    });
  }

  return messages;
};
