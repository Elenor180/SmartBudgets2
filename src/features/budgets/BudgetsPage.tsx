import React, { useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useWorkspace } from '@/app/WorkspaceProvider';
import { categoryDefinitions, type CategoryId } from '@/domain/models';
import { getBudgetPerformance, getTotalBudget } from '@/domain/selectors';
import { formatCurrency, formatPercent, getCategoryLabel } from '@/lib/format';
import {
  Button,
  Card,
  EmptyState,
  FieldMessage,
  PageHeader,
  ProgressBar,
  SectionHeader,
  Tag,
} from '@/ui/components';

const BudgetsPage = () => {
  const { state, actions } = useWorkspace();
  const [categoryId, setCategoryId] = useState<CategoryId>('food');
  const [limit, setLimit] = useState('');
  const [limitError, setLimitError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const limitInputRef = useRef<HTMLInputElement | null>(null);
  const budgetPerformance = getBudgetPerformance(state);
  const totalBudget = getTotalBudget(state);
  const incomeCoverage =
    state.profile.monthlyIncome > 0
      ? (totalBudget / state.profile.monthlyIncome) * 100
      : 0;
  const parsedLimit = Number(limit);
  const isLimitValid =
    limit.trim().length > 0 && Number.isFinite(parsedLimit) && parsedLimit > 0;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!isLimitValid) {
      setLimitError('Enter a monthly limit greater than 0.');
      return;
    }

    setLimitError(null);
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      await actions.upsertBudget({
        categoryId,
        limit: parsedLimit,
      });
      setLimit('');
    } catch {
      setSubmitError('Budget could not be saved. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
                ref={limitInputRef}
                className={limitError ? 'input input--invalid' : 'input'}
                type="number"
                min="0"
                step="0.01"
                value={limit}
                aria-invalid={limitError ? 'true' : 'false'}
                aria-describedby={limitError ? 'budget-limit-error' : undefined}
                onChange={(event) => {
                  setLimit(event.target.value);
                  if (limitError) {
                    setLimitError(null);
                  }
                }}
              />
              {limitError ? (
                <FieldMessage id="budget-limit-error" tone="danger">
                  {limitError}
                </FieldMessage>
              ) : null}
            </label>

            <div className="stack-xs">
              <span className="meta-copy">
                Total allocated: {formatCurrency(totalBudget, state.profile.currency)}
              </span>
              <span className="meta-copy">
                Income coverage: {formatPercent(incomeCoverage)}
              </span>
            </div>

            {submitError ? <FieldMessage tone="danger">{submitError}</FieldMessage> : null}

            <Button type="submit" disabled={isSubmitting || !isLimitValid}>
              {isSubmitting ? 'Saving budget...' : 'Save budget'}
            </Button>
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
              action={
                <Button
                  tone="secondary"
                  type="button"
                  onClick={() => {
                    setCategoryId('food');
                    setLimit('');
                    setLimitError(null);
                    limitInputRef.current?.focus();
                  }}
                >
                  Add first budget
                </Button>
              }
            />
          )}
        </Card>
      </section>
    </div>
  );
};

export default BudgetsPage;
