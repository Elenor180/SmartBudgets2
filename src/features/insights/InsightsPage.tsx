import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  type TooltipValueType,
  XAxis,
  YAxis,
} from 'recharts';
import { useWorkspace } from '@/app/WorkspaceProvider';
import {
  getBudgetPerformance,
  getInsightMessages,
  getMonthlyTrend,
} from '@/domain/selectors';
import { formatCurrency, formatPercent, getCategoryLabel } from '@/lib/format';
import {
  Card,
  EmptyState,
  PageHeader,
  ProgressBar,
  SectionHeader,
  Tag,
} from '@/ui/components';

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

const InsightsPage = () => {
  const { state } = useWorkspace();
  const insightMessages = getInsightMessages(state);
  const budgetPerformance = getBudgetPerformance(state);
  const trend = getMonthlyTrend(state.transactions);

  return (
    <div className="page">
      <PageHeader
        eyebrow="Insights"
        title="Translate data into actions"
        description="This page is intentionally practical: it highlights where the money is moving and what deserves attention next."
      />

      <section className="dashboard-grid">
        <Card className="hero-card">
          <SectionHeader
            title="Monthly spend trend"
            description="A simple read on how tracked expenses are changing over time."
          />
          <div className="chart-shell chart-shell--lg">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} />
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
                <Bar dataKey="amount" fill="#0f766e" radius={[12, 12, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <SectionHeader
            title="Priority notes"
            description="Rule-based guidance generated from the current workspace data."
          />
          <div className="stack-md">
            {insightMessages.map((insight) => (
              <div className="insight-item insight-item--block" key={insight.title}>
                <div className="stack-xs">
                  <strong>{insight.title}</strong>
                  <p>{insight.body}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionHeader
            title="Budget pressure map"
            description="The categories that are approaching their limits fastest."
          />
          {budgetPerformance.length > 0 ? (
            <div className="stack-md">
              {budgetPerformance.map((entry) => (
                <div className="budget-row" key={entry.budget.id}>
                  <div className="budget-row__head">
                    <div className="stack-xs">
                      <strong>{getCategoryLabel(entry.budget.categoryId)}</strong>
                      <span>
                        Remaining {formatCurrency(entry.remaining, state.profile.currency)}
                      </span>
                    </div>
                    <Tag
                      tone={
                        entry.usage >= 100 ? 'rose' : entry.usage >= 80 ? 'amber' : 'teal'
                      }
                    >
                      {formatPercent(entry.usage)}
                    </Tag>
                  </div>
                  <ProgressBar
                    value={entry.usage}
                    tone={
                      entry.usage >= 100 ? 'rose' : entry.usage >= 80 ? 'amber' : 'teal'
                    }
                  />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No budget pressure yet"
              description="Once you create budgets, this view will show which categories need attention first."
            />
          )}
        </Card>
      </section>
    </div>
  );
};

export default InsightsPage;
