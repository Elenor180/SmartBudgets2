import React, { useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useWorkspace } from '@/app/WorkspaceProvider';
import {
  categoryDefinitions,
  reminderKinds,
  type Currency,
  type CategoryId,
  type ReminderKind,
} from '@/domain/models';
import {
  daysUntil,
  formatCurrency,
  formatLongDate,
  getCategoryLabel,
} from '@/lib/format';
import {
  Button,
  Card,
  EmptyState,
  FieldMessage,
  PageHeader,
  SectionHeader,
  Tag,
} from '@/ui/components';

const getReminderTone = (kind: ReminderKind) => {
  switch (kind) {
    case 'bill':
      return 'amber';
    case 'budget':
      return 'sky';
    case 'goal':
      return 'teal';
    default:
      return 'slate';
  }
};

const getReminderSummary = (
  reminder: {
    kind: ReminderKind;
    categoryId?: CategoryId;
    threshold?: number;
    dueDate?: string;
    amount?: number;
  },
  currency: Currency,
) => {
  switch (reminder.kind) {
    case 'budget':
      return reminder.categoryId
        ? `${getCategoryLabel(reminder.categoryId)} threshold at ${reminder.threshold ?? 0}% of budget`
        : `Threshold at ${reminder.threshold ?? 0}% of budget`;
    case 'bill': {
      const dueCopy = reminder.dueDate
        ? `Due ${formatLongDate(reminder.dueDate)}`
        : 'No due date set';

      return reminder.amount
        ? `${dueCopy} · ${formatCurrency(reminder.amount, currency)}`
        : dueCopy;
    }
    case 'goal':
      return reminder.dueDate
        ? `Goal check-in on ${formatLongDate(reminder.dueDate)}`
        : 'Goal check-in reminder';
    default:
      return 'Reminder';
  }
};

const getReminderTiming = (dueDate?: string) => {
  if (!dueDate) {
    return null;
  }

  const delta = daysUntil(dueDate);

  if (delta === 0) {
    return 'Due today';
  }

  if (delta === 1) {
    return 'Due tomorrow';
  }

  if (delta < 0) {
    const overdueBy = Math.abs(delta);
    return `Overdue by ${overdueBy} day${overdueBy === 1 ? '' : 's'}`;
  }

  return `Due in ${delta} days`;
};

const RemindersPage = () => {
  const { state, actions } = useWorkspace();
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<ReminderKind>('bill');
  const [categoryId, setCategoryId] = useState<CategoryId>('food');
  const [dueDate, setDueDate] = useState('');
  const [threshold, setThreshold] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<{
    title?: string;
    threshold?: string;
    dueDate?: string;
    amount?: string;
    submit?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingReminderId, setPendingReminderId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<'toggle' | 'delete' | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);

  const trimmedTitle = title.trim();
  const parsedThreshold = Number(threshold);
  const parsedAmount = Number(amount);
  const isTitleValid = trimmedTitle.length >= 2;
  const isThresholdValid =
    kind !== 'budget' ||
    (threshold.trim().length > 0 &&
      Number.isFinite(parsedThreshold) &&
      parsedThreshold > 0 &&
      parsedThreshold <= 100);
  const isDueDateValid =
    (kind !== 'bill' && kind !== 'goal') || Boolean(dueDate);
  const isAmountValid =
    kind !== 'bill' ||
    (amount.trim().length > 0 && Number.isFinite(parsedAmount) && parsedAmount > 0);
  const canSubmit =
    isTitleValid &&
    isThresholdValid &&
    isDueDateValid &&
    isAmountValid &&
    !isSubmitting;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const nextErrors: {
      title?: string;
      threshold?: string;
      dueDate?: string;
      amount?: string;
    } = {};

    if (!isTitleValid) {
      nextErrors.title = 'Add a reminder title with at least two characters.';
    }

    if (!isThresholdValid) {
      nextErrors.threshold = 'Enter a threshold between 1 and 100 percent.';
    }

    if (!isDueDateValid) {
      nextErrors.dueDate = 'Choose the date this reminder should surface.';
    }

    if (!isAmountValid) {
      nextErrors.amount = 'Enter a bill amount greater than 0.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      await actions.addReminder({
        title: trimmedTitle,
        kind,
        categoryId: kind === 'budget' ? categoryId : undefined,
        dueDate: kind === 'budget' ? undefined : dueDate || undefined,
        threshold: kind === 'budget' ? parsedThreshold : undefined,
        amount: kind === 'bill' ? parsedAmount : undefined,
        note: note.trim(),
        active: true,
      });

      setTitle('');
      setDueDate('');
      setThreshold('');
      setAmount('');
      setNote('');
    } catch {
      setErrors({
        submit: 'Reminder could not be saved. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleReminder = async (reminderId: string) => {
    setPendingReminderId(reminderId);
    setPendingAction('toggle');

    try {
      await actions.toggleReminder(reminderId);
    } finally {
      setPendingReminderId(null);
      setPendingAction(null);
    }
  };

  const handleDeleteReminder = async (reminderId: string) => {
    setPendingReminderId(reminderId);
    setPendingAction('delete');

    try {
      await actions.deleteReminder(reminderId);
    } finally {
      setPendingReminderId(null);
      setPendingAction(null);
    }
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
                ref={titleInputRef}
                className={errors.title ? 'input input--invalid' : 'input'}
                value={title}
                aria-invalid={errors.title ? 'true' : 'false'}
                aria-describedby={errors.title ? 'reminder-title-error' : undefined}
                onChange={(event) => {
                  setTitle(event.target.value);
                  if (errors.title || errors.submit) {
                    setErrors((current) => ({
                      ...current,
                      title: undefined,
                      submit: undefined,
                    }));
                  }
                }}
                placeholder="Electricity bill, food budget check, savings review"
              />
              {errors.title ? (
                <FieldMessage id="reminder-title-error" tone="danger">
                  {errors.title}
                </FieldMessage>
              ) : null}
            </label>

            <label className="field">
              <span>Type</span>
              <select
                className="select"
                value={kind}
                onChange={(event) => {
                  const nextKind = event.target.value as ReminderKind;

                  setKind(nextKind);
                  setErrors({});

                  if (nextKind === 'budget') {
                    setDueDate('');
                    setAmount('');
                    return;
                  }

                  setThreshold('');
                }}
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
                    className={errors.threshold ? 'input input--invalid' : 'input'}
                    type="number"
                    min="1"
                    max="100"
                    value={threshold}
                    aria-invalid={errors.threshold ? 'true' : 'false'}
                    aria-describedby={errors.threshold ? 'reminder-threshold-error' : undefined}
                    onChange={(event) => {
                      setThreshold(event.target.value);
                      if (errors.threshold || errors.submit) {
                        setErrors((current) => ({
                          ...current,
                          threshold: undefined,
                          submit: undefined,
                        }));
                      }
                    }}
                  />
                  {errors.threshold ? (
                    <FieldMessage id="reminder-threshold-error" tone="danger">
                      {errors.threshold}
                    </FieldMessage>
                  ) : (
                    <FieldMessage>
                      Trigger this reminder when spending reaches the selected budget percentage.
                    </FieldMessage>
                  )}
                </label>
              </div>
            ) : kind === 'bill' ? (
              <div className="form-grid form-grid--tight">
                <label className="field">
                  <span>Due date</span>
                  <input
                    className={errors.dueDate ? 'input input--invalid' : 'input'}
                    type="date"
                    value={dueDate}
                    aria-invalid={errors.dueDate ? 'true' : 'false'}
                    aria-describedby={errors.dueDate ? 'reminder-date-error' : undefined}
                    onChange={(event) => {
                      setDueDate(event.target.value);
                      if (errors.dueDate || errors.submit) {
                        setErrors((current) => ({
                          ...current,
                          dueDate: undefined,
                          submit: undefined,
                        }));
                      }
                    }}
                  />
                  {errors.dueDate ? (
                    <FieldMessage id="reminder-date-error" tone="danger">
                      {errors.dueDate}
                    </FieldMessage>
                  ) : null}
                </label>
                <label className="field">
                  <span>Amount</span>
                  <input
                    className={errors.amount ? 'input input--invalid' : 'input'}
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount}
                    aria-invalid={errors.amount ? 'true' : 'false'}
                    aria-describedby={errors.amount ? 'reminder-amount-error' : undefined}
                    onChange={(event) => {
                      setAmount(event.target.value);
                      if (errors.amount || errors.submit) {
                        setErrors((current) => ({
                          ...current,
                          amount: undefined,
                          submit: undefined,
                        }));
                      }
                    }}
                  />
                  {errors.amount ? (
                    <FieldMessage id="reminder-amount-error" tone="danger">
                      {errors.amount}
                    </FieldMessage>
                  ) : null}
                </label>
              </div>
            ) : (
              <label className="field">
                <span>Check-in date</span>
                <input
                  className={errors.dueDate ? 'input input--invalid' : 'input'}
                  type="date"
                  value={dueDate}
                  aria-invalid={errors.dueDate ? 'true' : 'false'}
                  aria-describedby={errors.dueDate ? 'reminder-goal-date-error' : undefined}
                  onChange={(event) => {
                    setDueDate(event.target.value);
                    if (errors.dueDate || errors.submit) {
                      setErrors((current) => ({
                        ...current,
                        dueDate: undefined,
                        submit: undefined,
                      }));
                    }
                  }}
                />
                {errors.dueDate ? (
                  <FieldMessage id="reminder-goal-date-error" tone="danger">
                    {errors.dueDate}
                  </FieldMessage>
                ) : (
                  <FieldMessage>
                    Set a review date so goal follow-ups surface on time.
                  </FieldMessage>
                )}
              </label>
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

            {errors.submit ? <FieldMessage tone="danger">{errors.submit}</FieldMessage> : null}

            <Button type="submit" disabled={!canSubmit}>
              {isSubmitting ? 'Saving reminder...' : 'Save reminder'}
            </Button>
          </form>
        </Card>

        <Card>
          <SectionHeader
            title="Reminder list"
            description="Pause, remove, or review reminders as your routines change."
          />

          {state.reminders.length > 0 ? (
            <div className="stack-md">
              {state.reminders.map((reminder) => {
                const reminderTiming = getReminderTiming(reminder.dueDate);
                const isBusy = pendingReminderId === reminder.id;

                return (
                  <div className="list-row" key={reminder.id}>
                    <div className="stack-xs">
                      <div className="list-row__meta">
                        <strong>{reminder.title}</strong>
                        <Tag tone={getReminderTone(reminder.kind)}>{reminder.kind}</Tag>
                        <Tag tone={reminder.active ? 'teal' : 'slate'}>
                          {reminder.active ? 'Active' : 'Paused'}
                        </Tag>
                      </div>
                      <span>
                        {getReminderSummary(reminder, state.profile.currency)}
                      </span>
                      {reminderTiming ? (
                        <span className="list-row__subtle">{reminderTiming}</span>
                      ) : null}
                      {reminder.note ? (
                        <span className="list-row__subtle">{reminder.note}</span>
                      ) : null}
                    </div>

                    <div className="list-row__value">
                      <Button
                        tone="ghost"
                        type="button"
                        disabled={isBusy}
                        onClick={() => void handleToggleReminder(reminder.id)}
                      >
                        {isBusy && pendingAction === 'toggle'
                          ? 'Saving...'
                          : reminder.active
                            ? 'Pause'
                            : 'Resume'}
                      </Button>
                      <button
                        className="icon-button"
                        type="button"
                        disabled={isBusy}
                        onClick={() => void handleDeleteReminder(reminder.id)}
                        aria-label={`Delete ${reminder.title}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No reminders yet"
              description="Create reminders for key bills or budget thresholds so they appear here."
              action={
                <Button
                  tone="secondary"
                  type="button"
                  onClick={() => titleInputRef.current?.focus()}
                >
                  Add first reminder
                </Button>
              }
            />
          )}
        </Card>
      </section>
    </div>
  );
};

export default RemindersPage;
