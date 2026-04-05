import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useWorkspace } from '@/app/WorkspaceProvider';
import { categoryDefinitions, type CategoryId } from '@/domain/models';
import { formatCurrency, formatLongDate, getCategoryLabel } from '@/lib/format';
import {
  Button,
  Card,
  EmptyState,
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

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!name.trim() || Number(targetAmount) <= 0) {
      return;
    }

    actions.addGoal({
      name: name.trim(),
      categoryId,
      targetAmount: Number(targetAmount),
      currentAmount: Number(currentAmount) || 0,
      targetDate,
      notes: notes.trim(),
    });

    setName('');
    setTargetAmount('');
    setCurrentAmount('');
    setTargetDate('');
    setNotes('');
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
                className="input"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Emergency fund, annual insurance, course"
              />
            </label>

            <div className="form-grid form-grid--tight">
              <label className="field">
                <span>Target amount</span>
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={targetAmount}
                  onChange={(event) => setTargetAmount(event.target.value)}
                />
              </label>

              <label className="field">
                <span>Current amount</span>
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={currentAmount}
                  onChange={(event) => setCurrentAmount(event.target.value)}
                />
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

            <Button type="submit">Save goal</Button>
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
                      {goal.targetDate ? (
                        <Tag tone="sky">{formatLongDate(goal.targetDate)}</Tag>
                      ) : null}
                    </div>

                    <ProgressBar value={progress} tone="sky" />

                    <div className="split-actions">
                      <input
                        className="input"
                        type="number"
                        min="0"
                        step="0.01"
                        value={contributions[goal.id] ?? ''}
                        onChange={(event) =>
                          setContributions((current) => ({
                            ...current,
                            [goal.id]: event.target.value,
                          }))
                        }
                        placeholder="Contribution amount"
                      />
                      <Button
                        tone="secondary"
                        onClick={() => {
                          const value = Number(contributions[goal.id] ?? 0);
                          if (value <= 0) {
                            return;
                          }

                          actions.contributeToGoal(goal.id, value);
                          setContributions((current) => ({
                            ...current,
                            [goal.id]: '',
                          }));
                        }}
                      >
                        Add contribution
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No goals yet"
              description="Add a savings or purchase target so the workspace can show progress over time."
            />
          )}
        </Card>
      </section>
    </div>
  );
};

export default GoalsPage;
