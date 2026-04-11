import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useWorkspace } from '@/app/WorkspaceProvider';
import { categoryDefinitions, type CategoryId } from '@/domain/models';
import { getBudgetPerformance, getTotalBudget } from '@/domain/selectors';
import { formatCurrency, formatPercent, getCategoryLabel } from '@/lib/format';
import {
  Button,
  Card,
  EmptyState,
  PageHeader,
  ProgressBar,
  SectionHeader,
  Tag,
} from '@/ui/components';

const BudgetsPage = () => {
  const { state, actions } = useWorkspace();
  const [categoryId, setCategoryId] = useState<CategoryId>('food');
  const [limit, setLimit] = useState('');
  const budgetPerformance = getBudgetPerformance(state);
  const totalBudget = getTotalBudget(state);
  const incomeCoverage =
    state.profile.monthlyIncome > 0
      ? (totalBudget / state.profile.monthlyIncome) * 100
      : 0;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (Number(limit) <= 0) {
      return;
    }

    actions.upsertBudget({
      categoryId,
      limit: Number(limit),
    });
    setLimit('');
  };

  return (
    <div className="page">
      <PageHeader
        eyebrow="Budgets"
        title="Set deliberate spending guardrails"
        description="Make monthly limits explicit, then monitor where the pressure is building."
      />

      <section className="two-column">
        <Card>
          <SectionHeader
            title="Create or update a limit"
            description="Budgets can be tuned category by category without leaving the workspace."
          />

          <form className="stack-md" onSubmit={handleSubmit}>
            <label className="field">
              <span>Category</span>
              <select
                className="select"
                value={categoryId}
                onChange={(event) =>
                  setCategoryId(event.target.value as CategoryId)
                }
              >
                {categoryDefinitions.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Monthly limit</span>
              <input
                className="input"
                type="number"
                min="0"
                step="0.01"
                value={limit}
                onChange={(event) => setLimit(event.target.value)}
              />
            </label>

            <div className="stack-xs">
              <span className="meta-copy">
                Total allocated: {formatCurrency(totalBudget, state.profile.currency)}
              </span>
              <span className="meta-copy">
                Income coverage: {formatPercent(incomeCoverage)}
              </span>
            </div>

            <Button type="submit">Save budget</Button>
          </form>
        </Card>

        <Card>
          <SectionHeader
            title="Current performance"
            description="A month-by-month view of where your spending is landing."
          />

          {budgetPerformance.length > 0 ? (
            <div className="stack-md">
              {budgetPerformance.map((entry) => (
                <div className="budget-row" key={entry.budget.id}>
                  <div className="budget-row__head">
                    <div className="stack-xs">
                      <strong>{getCategoryLabel(entry.budget.categoryId)}</strong>
                      <span>
                        {formatCurrency(entry.spent, state.profile.currency)} spent of{' '}
                        {formatCurrency(entry.budget.limit, state.profile.currency)}
                      </span>
                    </div>
                    <div className="list-row__value">
                      <Tag
                        tone={
                          entry.usage >= 100 ? 'rose' : entry.usage >= 80 ? 'amber' : 'teal'
                        }
                      >
                        {Math.round(entry.usage)}%
                      </Tag>
                      <button
                        className="icon-button"
                        type="button"
                        onClick={() => actions.removeBudget(entry.budget.categoryId)}
                        aria-label={`Remove ${getCategoryLabel(entry.budget.categoryId)} budget`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
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
              title="No budgets configured"
              description="Save your first category limit and start tracking performance."
            />
          )}
        </Card>
      </section>
    </div>
  );
};

export default BudgetsPage;
