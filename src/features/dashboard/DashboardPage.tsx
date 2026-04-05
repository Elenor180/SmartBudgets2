import React from 'react';
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  type TooltipValueType,
  XAxis,
  YAxis,
} from 'recharts';
import { BellDot, Flag, Wallet } from 'lucide-react';
import { useWorkspace } from '@/app/WorkspaceProvider';
import {
  getBudgetPerformance,
  getMonthlyTrend,
  getRecentTransactions,
  getSavingsRate,
  getTotalSpent,
  getUpcomingReminders,
} from '@/domain/selectors';
import {
  daysUntil,
  formatCompactCurrency,
  formatCurrency,
  formatLongDate,
  formatPercent,
  getCategoryLabel,
  getCategoryTone,
} from '@/lib/format';
import {
  Card,
  EmptyState,
  MetricCard,
  PageHeader,
  ProgressBar,
  SectionHeader,
  Tag,
} from '@/ui/components';

const toneColorMap = {
  teal: '#0f766e',
  amber: '#b45309',
  rose: '#be123c',
  sky: '#0369a1',
  mint: '#15803d',
  slate: '#475569',
} as const;

const toTooltipAmount = (value: TooltipValueType | undefined) => {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  if (Array.isArray(value)) {
    const parsed = Number(value[0] ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const DashboardPage = () => {
  const { state } = useWorkspace();
  const totalSpent = getTotalSpent(state.transactions);
  const remaining = state.profile.monthlyIncome - totalSpent;
  const savingsRate = getSavingsRate(state);
  const budgetPerformance = getBudgetPerformance(state);
  const recentTransactions = getRecentTransactions(state.transactions);
  const monthlyTrend = getMonthlyTrend(state.transactions);
  const upcomingReminders = getUpcomingReminders(state.reminders, 21);
  const chartData = budgetPerformance
    .filter((entry) => entry.spent > 0)
    .map((entry) => ({
      name: getCategoryLabel(entry.budget.categoryId),
      value: entry.spent,
      tone: getCategoryTone(entry.budget.categoryId),
    }));

  return (
    <div className="page">
      <PageHeader
        eyebrow="Overview"
        title={`Welcome back, ${state.profile.fullName || 'there'}`}
        description="Monitor monthly health, spending momentum, and the categories that need attention first."
      />

      <section className="metric-grid">
        <MetricCard
          label="Monthly income"
          value={formatCurrency(state.profile.monthlyIncome, state.profile.currency)}
          detail="Configured recurring income"
          tone="teal"
        />
        <MetricCard
          label="Spent this month"
          value={formatCurrency(totalSpent, state.profile.currency)}
          detail="Tracked expense outflow"
          tone="amber"
        />
        <MetricCard
          label="Remaining runway"
          value={formatCurrency(remaining, state.profile.currency)}
          detail="Income minus tracked expenses"
          tone={remaining >= 0 ? 'sky' : 'rose'}
        />
        <MetricCard
          label="Savings rate"
          value={formatPercent(savingsRate)}
          detail="Current month efficiency"
          tone={savingsRate >= 20 ? 'teal' : 'rose'}
        />
      </section>

      <section className="dashboard-grid">
        <Card className="hero-card">
          <SectionHeader
            title="Spending momentum"
            description="Six-month expense trend based on tracked transactions."
          />
          <div className="chart-shell chart-shell--lg">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrend}>
                <defs>
                  <linearGradient id="spendArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0f766e" stopOpacity={0.32} />
                    <stop offset="100%" stopColor="#0f766e" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip
                  formatter={(value) =>
                    formatCurrency(
                      toTooltipAmount(value),
                      state.profile.currency,
                    )
                  }
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#0f766e"
                  strokeWidth={3}
                  fill="url(#spendArea)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <SectionHeader
            title="Spending mix"
            description="The categories driving this month’s outflow."
          />
          {chartData.length > 0 ? (
            <div className="chart-shell">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={54}
                    outerRadius={88}
                    paddingAngle={4}
                  >
                    {chartData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={toneColorMap[entry.tone as keyof typeof toneColorMap]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) =>
                      formatCurrency(
                        toTooltipAmount(value),
                        state.profile.currency,
                      )
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              title="No spending data yet"
              description="Add a few transactions and this breakdown will begin to tell a story."
            />
          )}
        </Card>

        <Card>
          <SectionHeader
            title="Budget health"
            description="How each budget is performing this month."
          />
          <div className="stack-md">
            {budgetPerformance.slice(0, 5).map((entry) => (
              <div className="budget-row" key={entry.budget.id}>
                <div className="budget-row__head">
                  <div className="stack-xs">
                    <strong>{getCategoryLabel(entry.budget.categoryId)}</strong>
                    <span>
                      {formatCurrency(entry.spent, state.profile.currency)} spent of{' '}
                      {formatCurrency(entry.budget.limit, state.profile.currency)}
                    </span>
                  </div>
                  <Tag tone={entry.usage >= 100 ? 'rose' : entry.usage >= 80 ? 'amber' : 'teal'}>
                    {Math.round(entry.usage)}%
                  </Tag>
                </div>
                <ProgressBar
                  value={entry.usage}
                  tone={entry.usage >= 100 ? 'rose' : entry.usage >= 80 ? 'amber' : 'teal'}
                />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionHeader
            title="Upcoming reminders"
            description="What needs attention over the next three weeks."
          />
          {upcomingReminders.length > 0 ? (
            <div className="stack-md">
              {upcomingReminders.slice(0, 4).map((reminder) => (
                <div className="insight-item" key={reminder.id}>
                  <div className="insight-item__icon">
                    <BellDot size={18} />
                  </div>
                  <div className="stack-xs">
                    <strong>{reminder.title}</strong>
                    <span>
                      {reminder.dueDate ? formatLongDate(reminder.dueDate) : 'No date set'}
                    </span>
                  </div>
                  {reminder.dueDate ? (
                    <Tag tone={daysUntil(reminder.dueDate) <= 3 ? 'rose' : 'sky'}>
                      {daysUntil(reminder.dueDate)} days
                    </Tag>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No reminders in view"
              description="Add bills, thresholds, or goal prompts to surface them here."
            />
          )}
        </Card>

        <Card>
          <SectionHeader
            title="Recent activity"
            description="The latest tracked transactions in your workspace."
          />
          {recentTransactions.length > 0 ? (
            <div className="stack-md">
              {recentTransactions.map((transaction) => (
                <div className="list-row" key={transaction.id}>
                  <div className="list-row__meta">
                    <div className="list-row__icon">
                      <Wallet size={18} />
                    </div>
                    <div className="stack-xs">
                      <strong>{transaction.description}</strong>
                      <span>{getCategoryLabel(transaction.categoryId)}</span>
                    </div>
                  </div>
                  <div className="stack-xs list-row__value">
                    <strong>
                      {formatCompactCurrency(
                        transaction.amount,
                        state.profile.currency,
                      )}
                    </strong>
                    <span>{formatLongDate(transaction.occurredOn)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No transactions yet"
              description="Track your first expense to begin populating the dashboard."
            />
          )}
        </Card>

        <Card>
          <SectionHeader
            title="Goal progress"
            description="A quick look at what you are funding right now."
          />
          {state.goals.length > 0 ? (
            <div className="stack-md">
              {state.goals.slice(0, 3).map((goal) => {
                const progress =
                  goal.targetAmount > 0
                    ? (goal.currentAmount / goal.targetAmount) * 100
                    : 0;

                return (
                  <div className="budget-row" key={goal.id}>
                    <div className="budget-row__head">
                      <div className="stack-xs">
                        <strong>{goal.name}</strong>
                        <span>
                          {formatCurrency(goal.currentAmount, state.profile.currency)} of{' '}
                          {formatCurrency(goal.targetAmount, state.profile.currency)}
                        </span>
                      </div>
                      <div className="list-row__meta">
                        <Flag size={16} />
                        <Tag tone="sky">{Math.round(progress)}%</Tag>
                      </div>
                    </div>
                    <ProgressBar value={progress} tone="sky" />
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="Goals are still empty"
              description="Set a savings or spending goal to track progress over time."
            />
          )}
        </Card>
      </section>
    </div>
  );
};

export default DashboardPage;
