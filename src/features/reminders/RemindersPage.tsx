import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useWorkspace } from '@/app/WorkspaceProvider';
import {
  categoryDefinitions,
  reminderKinds,
  type CategoryId,
  type ReminderKind,
} from '@/domain/models';
import { formatLongDate, getCategoryLabel } from '@/lib/format';
import {
  Button,
  Card,
  EmptyState,
  PageHeader,
  SectionHeader,
  Tag,
} from '@/ui/components';

const RemindersPage = () => {
  const { state, actions } = useWorkspace();
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<ReminderKind>('bill');
  const [categoryId, setCategoryId] = useState<CategoryId>('food');
  const [dueDate, setDueDate] = useState('');
  const [threshold, setThreshold] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!title.trim()) {
      return;
    }

    actions.addReminder({
      title: title.trim(),
      kind,
      categoryId: kind === 'budget' ? categoryId : undefined,
      dueDate: dueDate || undefined,
      threshold: kind === 'budget' ? Number(threshold) || undefined : undefined,
      amount: kind === 'bill' ? Number(amount) || undefined : undefined,
      note: note.trim(),
      active: true,
    });

    setTitle('');
    setDueDate('');
    setThreshold('');
    setAmount('');
    setNote('');
  };

  return (
    <div className="page">
      <PageHeader
        eyebrow="Reminders"
        title="Keep the important dates and thresholds visible"
        description="Bills, budget thresholds, and goal nudges should surface before they become surprises."
      />

      <section className="two-column">
        <Card>
          <SectionHeader
            title="Create reminder"
            description="Use reminders for bills, budget checkpoints, and goal momentum."
          />
          <form className="stack-md" onSubmit={handleSubmit}>
            <label className="field">
              <span>Title</span>
              <input
                className="input"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Electricity bill, food budget check, savings review"
              />
            </label>

            <label className="field">
              <span>Type</span>
              <select
                className="select"
                value={kind}
                onChange={(event) => setKind(event.target.value as ReminderKind)}
              >
                {reminderKinds.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            {kind === 'budget' ? (
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
                  <span>Threshold (%)</span>
                  <input
                    className="input"
                    type="number"
                    min="1"
                    max="100"
                    value={threshold}
                    onChange={(event) => setThreshold(event.target.value)}
                  />
                </label>
              </div>
            ) : (
              <div className="form-grid form-grid--tight">
                <label className="field">
                  <span>Due date</span>
                  <input
                    className="input"
                    type="date"
                    value={dueDate}
                    onChange={(event) => setDueDate(event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Amount</span>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                  />
                </label>
              </div>
            )}

            <label className="field">
              <span>Note</span>
              <textarea
                className="textarea"
                rows={4}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Optional context for the reminder"
              />
            </label>

            <Button type="submit">Save reminder</Button>
          </form>
        </Card>

        <Card>
          <SectionHeader
            title="Reminder list"
            description="Pause, remove, or review reminders as your routines change."
          />

          {state.reminders.length > 0 ? (
            <div className="stack-md">
              {state.reminders.map((reminder) => (
                <div className="list-row" key={reminder.id}>
                  <div className="stack-xs">
                    <div className="list-row__meta">
                      <strong>{reminder.title}</strong>
                      <Tag tone={reminder.active ? 'teal' : 'slate'}>
                        {reminder.active ? 'Active' : 'Paused'}
                      </Tag>
                    </div>
                    <span>
                      {reminder.kind === 'budget' && reminder.categoryId
                        ? `${getCategoryLabel(reminder.categoryId)} at ${reminder.threshold ?? 0}%`
                        : reminder.dueDate
                          ? formatLongDate(reminder.dueDate)
                          : 'No date set'}
                    </span>
                  </div>

                  <div className="list-row__value">
                    <Button
                      tone="ghost"
                      onClick={() => actions.toggleReminder(reminder.id)}
                    >
                      {reminder.active ? 'Pause' : 'Resume'}
                    </Button>
                    <button
                      className="icon-button"
                      type="button"
                      onClick={() => actions.deleteReminder(reminder.id)}
                      aria-label={`Delete ${reminder.title}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No reminders yet"
              description="Create reminders for key bills or budget thresholds so they appear here."
            />
          )}
        </Card>
      </section>
    </div>
  );
};

export default RemindersPage;
