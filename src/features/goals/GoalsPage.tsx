import React, { useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useWorkspace } from '@/app/WorkspaceProvider';
import { categoryDefinitions, type CategoryId } from '@/domain/models';
import { formatCurrency, formatLongDate, getCategoryLabel } from '@/lib/format';
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

const GoalsPage = () => {
  const { state, actions } = useWorkspace();
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<CategoryId>('savings');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [notes, setNotes] = useState('');
  const [contributions, setContributions] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<{
    name?: string;
    targetAmount?: string;
    currentAmount?: string;
    submit?: string;
  }>({});
  const [contributionErrors, setContributionErrors] = useState<
    Record<string, string | undefined>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contributionGoalId, setContributionGoalId] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const trimmedName = name.trim();
  const parsedTargetAmount = Number(targetAmount);
  const parsedCurrentAmount =
    currentAmount.trim().length === 0 ? 0 : Number(currentAmount);
  const isNameValid = trimmedName.length >= 2;
  const isTargetAmountValid =
    targetAmount.trim().length > 0 &&
    Number.isFinite(parsedTargetAmount) &&
    parsedTargetAmount > 0;
  const isCurrentAmountValid =
    Number.isFinite(parsedCurrentAmount) &&
    parsedCurrentAmount >= 0 &&
    (!isTargetAmountValid || parsedCurrentAmount <= parsedTargetAmount);
  const canSubmit =
    isNameValid && isTargetAmountValid && isCurrentAmountValid && !isSubmitting;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const nextErrors: {
      name?: string;
      targetAmount?: string;
      currentAmount?: string;
    } = {};

    if (!isNameValid) {
      nextErrors.name = 'Name this goal so it is easy to recognize.';
    }
    if (!isTargetAmountValid) {
      nextErrors.targetAmount = 'Set a target amount greater than 0.';
    }
    if (!isCurrentAmountValid) {
      nextErrors.currentAmount =
        'Current amount must be 0 or higher and not exceed the target.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      await actions.addGoal({
        name: trimmedName,
        categoryId,
        targetAmount: parsedTargetAmount,
        currentAmount: parsedCurrentAmount,
        targetDate,
        notes: notes.trim(),
      });

      setName('');
      setTargetAmount('');
      setCurrentAmount('');
      setTargetDate('');
      setNotes('');
    } catch {
      setErrors({
        submit: 'Goal could not be saved. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContribution = async (goalId: string) => {
    const rawValue = contributions[goalId] ?? '';
    const amount = Number(rawValue);
    const isValid = rawValue.trim().length > 0 && Number.isFinite(amount) && amount > 0;

    if (!isValid) {
      setContributionErrors((current) => ({
        ...current,
        [goalId]: 'Enter a contribution greater than 0.',
      }));
      return;
    }

    setContributionErrors((current) => ({
      ...current,
      [goalId]: undefined,
    }));
    setContributionGoalId(goalId);

    try {
      await actions.contributeToGoal(goalId, amount);
      setContributions((current) => ({
        ...current,
        [goalId]: '',
      }));
    } catch {
      setContributionErrors((current) => ({
        ...current,
        [goalId]: 'Contribution failed. Please retry.',
      }));
    } finally {
      setContributionGoalId(null);
    }
  };

  return (
    <div className="page">
      <PageHeader
        eyebrow="Goals"
        title="Turn financial intent into visible progress"
        description="Track target amounts, contribute incrementally, and keep important objectives alive."
      />

      <section className="two-column">
        <Card>
          <SectionHeader
            title="Create a goal"
            description="Capture the next milestone you want the workspace to support."
          />
          <form className="stack-md" onSubmit={handleSubmit}>
            <label className="field">
              <span>Goal name</span>
              <input
                ref={nameInputRef}
                className={errors.name ? 'input input--invalid' : 'input'}
                value={name}
                aria-invalid={errors.name ? 'true' : 'false'}
                aria-describedby={errors.name ? 'goal-name-error' : undefined}
                onChange={(event) => {
                  setName(event.target.value);
                  if (errors.name || errors.submit) {
                    setErrors((current) => ({
                      ...current,
                      name: undefined,
                      submit: undefined,
                    }));
                  }
                }}
                placeholder="Emergency fund, annual insurance, course"
              />
              {errors.name ? (
                <FieldMessage id="goal-name-error" tone="danger">
                  {errors.name}
                </FieldMessage>
              ) : null}
            </label>

            <div className="form-grid form-grid--tight">
              <label className="field">
                <span>Target amount</span>
                <input
                  className={errors.targetAmount ? 'input input--invalid' : 'input'}
                  type="number"
                  min="0"
                  step="0.01"
                  value={targetAmount}
                  aria-invalid={errors.targetAmount ? 'true' : 'false'}
                  aria-describedby={errors.targetAmount ? 'goal-target-error' : undefined}
                  onChange={(event) => {
                    setTargetAmount(event.target.value);
                    if (errors.targetAmount || errors.submit) {
                      setErrors((current) => ({
                        ...current,
                        targetAmount: undefined,
                        submit: undefined,
                      }));
                    }
                  }}
                />
                {errors.targetAmount ? (
                  <FieldMessage id="goal-target-error" tone="danger">
                    {errors.targetAmount}
                  </FieldMessage>
                ) : null}
              </label>

              <label className="field">
                <span>Current amount</span>
                <input
                  className={errors.currentAmount ? 'input input--invalid' : 'input'}
                  type="number"
                  min="0"
                  step="0.01"
                  value={currentAmount}
                  aria-invalid={errors.currentAmount ? 'true' : 'false'}
                  aria-describedby={errors.currentAmount ? 'goal-current-error' : undefined}
                  onChange={(event) => {
                    setCurrentAmount(event.target.value);
                    if (errors.currentAmount || errors.submit) {
                      setErrors((current) => ({
                        ...current,
                        currentAmount: undefined,
                        submit: undefined,
                      }));
                    }
                  }}
                />
                {errors.currentAmount ? (
                  <FieldMessage id="goal-current-error" tone="danger">
                    {errors.currentAmount}
                  </FieldMessage>
                ) : null}
              </label>
            </div>

            <div className="form-grid form-grid--tight">
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
                <span>Target date</span>
                <input
                  className="input"
                  type="date"
                  value={targetDate}
                  onChange={(event) => setTargetDate(event.target.value)}
                />
              </label>
            </div>

            <label className="field">
              <span>Notes</span>
              <textarea
                className="textarea"
                rows={4}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Optional context for the goal"
              />
            </label>

            {errors.submit ? <FieldMessage tone="danger">{errors.submit}</FieldMessage> : null}

            <Button type="submit" disabled={!canSubmit}>
              {isSubmitting ? 'Saving goal...' : 'Save goal'}
            </Button>
          </form>
        </Card>

        <Card>
          <SectionHeader
            title="Active goals"
            description="Contribute to goals without losing context on the bigger target."
          />

          {state.goals.length > 0 ? (
            <div className="stack-md">
              {state.goals.map((goal) => {
                const progress =
                  goal.targetAmount > 0
                    ? (goal.currentAmount / goal.targetAmount) * 100
                    : 0;

                return (
                  <div className="goal-card" key={goal.id}>
                    <div className="goal-card__header">
                      <div className="stack-xs">
                        <strong>{goal.name}</strong>
                        <span>{getCategoryLabel(goal.categoryId)}</span>
                      </div>
                      <button
                        className="icon-button"
                        type="button"
                        onClick={() => actions.deleteGoal(goal.id)}
                        aria-label={`Delete ${goal.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="goal-card__metrics">
                      <div className="stack-xs">
                        <span>Progress</span>
                        <strong>
                          {formatCurrency(goal.currentAmount, state.profile.currency)} /{' '}
                          {formatCurrency(goal.targetAmount, state.profile.currency)}
                        </strong>
                      </div>
                      <Tag tone={progress >= 100 ? 'teal' : progress >= 70 ? 'amber' : 'sky'}>
                        {Math.round(progress)}% funded
                      </Tag>
                      {goal.targetDate ? (
                        <Tag tone="sky">{formatLongDate(goal.targetDate)}</Tag>
                      ) : null}
                    </div>

                    <ProgressBar value={progress} tone="sky" />

                    <div className="split-actions">
                      <input
                        className={
                          contributionErrors[goal.id] ? 'input input--invalid' : 'input'
                        }
                        type="number"
                        min="0"
                        step="0.01"
                        value={contributions[goal.id] ?? ''}
                        aria-invalid={contributionErrors[goal.id] ? 'true' : 'false'}
                        onChange={(event) =>
                          setContributions((current) => {
                            if (contributionErrors[goal.id]) {
                              setContributionErrors((errorsState) => ({
                                ...errorsState,
                                [goal.id]: undefined,
                              }));
                            }

                            return {
                              ...current,
                              [goal.id]: event.target.value,
                            };
                          })
                        }
                        placeholder="Contribution amount"
                      />
                      <Button
                        tone="secondary"
                        disabled={contributionGoalId === goal.id}
                        onClick={() => void handleContribution(goal.id)}
                      >
                        {contributionGoalId === goal.id
                          ? 'Saving...'
                          : 'Add contribution'}
                      </Button>
                    </div>
                    {contributionErrors[goal.id] ? (
                      <FieldMessage tone="danger">
                        {contributionErrors[goal.id]}
                      </FieldMessage>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No goals yet"
              description="Add a savings or purchase target so the workspace can show progress over time."
              action={
                <Button
                  tone="secondary"
                  type="button"
                  onClick={() => nameInputRef.current?.focus()}
                >
                  Add first goal
                </Button>
              }
            />
          )}
        </Card>
      </section>
    </div>
  );
};

export default GoalsPage;
