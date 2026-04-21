import React, { startTransition, useDeferredValue, useRef, useState } from 'react';
import { Search, Trash2 } from 'lucide-react';
import { useWorkspace } from '@/app/WorkspaceProvider';
import { categoryDefinitions, type CategoryId } from '@/domain/models';
import { getCategoryLabel, formatCurrency, formatLongDate } from '@/lib/format';
import {
  Button,
  Card,
  EmptyState,
  FieldMessage,
  PageHeader,
  SectionHeader,
  Tag,
} from '@/ui/components';

const today = new Date().toISOString().slice(0, 10);

const TransactionsPage = () => {
  const { state, actions } = useWorkspace();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<CategoryId>('food');
  const [occurredOn, setOccurredOn] = useState(today);
  const [notes, setNotes] = useState('');
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | CategoryId>('all');
  const [errors, setErrors] = useState<{
    description?: string;
    amount?: string;
    occurredOn?: string;
    submit?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const descriptionInputRef = useRef<HTMLInputElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const deferredQuery = useDeferredValue(query);
  const deferredFilter = useDeferredValue(categoryFilter);
  const trimmedDescription = description.trim();
  const parsedAmount = Number(amount);
  const isDescriptionValid = trimmedDescription.length >= 2;
  const isAmountValid =
    amount.trim().length > 0 && Number.isFinite(parsedAmount) && parsedAmount > 0;
  const isDateValid = Boolean(occurredOn);
  const canSubmit = isDescriptionValid && isAmountValid && isDateValid && !isSubmitting;
  const filteredTransactions = state.transactions.filter((transaction) => {
    const matchesQuery =
      deferredQuery.trim().length === 0 ||
      transaction.description.toLowerCase().includes(deferredQuery.toLowerCase()) ||
      transaction.notes.toLowerCase().includes(deferredQuery.toLowerCase());
    const matchesCategory =
      deferredFilter === 'all' || transaction.categoryId === deferredFilter;

    return matchesQuery && matchesCategory;
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const nextErrors: {
      description?: string;
      amount?: string;
      occurredOn?: string;
    } = {};

    if (!isDescriptionValid) {
      nextErrors.description = 'Add a clear description so this entry is easy to find.';
    }
    if (!isAmountValid) {
      nextErrors.amount = 'Enter an amount greater than 0.';
    }
    if (!isDateValid) {
      nextErrors.occurredOn = 'Choose the transaction date.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      await actions.addTransaction({
        description: trimmedDescription,
        amount: parsedAmount,
        categoryId,
        occurredOn: `${occurredOn}T00:00:00.000Z`,
        notes: notes.trim(),
      });

      setDescription('');
      setAmount('');
      setNotes('');
    } catch {
      setErrors({
        submit: 'Transaction could not be saved. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page">
      <PageHeader
        eyebrow="Transactions"
        title="Track every expense with context"
        description="Capture the detail that makes budgets, alerts, and insights trustworthy."
      />

      <section className="two-column">
        <Card>
          <SectionHeader
            title="Add transaction"
            description="Keep entries lightweight, but structured enough for reporting."
          />
          <form className="stack-md" onSubmit={handleSubmit}>
            <label className="field">
              <span>Description</span>
              <input
                ref={descriptionInputRef}
                className={errors.description ? 'input input--invalid' : 'input'}
                value={description}
                aria-invalid={errors.description ? 'true' : 'false'}
                aria-describedby={errors.description ? 'transaction-description-error' : undefined}
                onChange={(event) => {
                  setDescription(event.target.value);
                  if (errors.description || errors.submit) {
                    setErrors((current) => ({
                      ...current,
                      description: undefined,
                      submit: undefined,
                    }));
                  }
                }}
                placeholder="Groceries, fuel, internet, rent..."
              />
              {errors.description ? (
                <FieldMessage id="transaction-description-error" tone="danger">
                  {errors.description}
                </FieldMessage>
              ) : null}
            </label>

            <div className="form-grid form-grid--tight">
              <label className="field">
                <span>Amount</span>
                <input
                  className={errors.amount ? 'input input--invalid' : 'input'}
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  aria-invalid={errors.amount ? 'true' : 'false'}
                  aria-describedby={errors.amount ? 'transaction-amount-error' : undefined}
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
                  <FieldMessage id="transaction-amount-error" tone="danger">
                    {errors.amount}
                  </FieldMessage>
                ) : null}
              </label>

              <label className="field">
                <span>Date</span>
                <input
                  className={errors.occurredOn ? 'input input--invalid' : 'input'}
                  type="date"
                  value={occurredOn}
                  aria-invalid={errors.occurredOn ? 'true' : 'false'}
                  aria-describedby={errors.occurredOn ? 'transaction-date-error' : undefined}
                  onChange={(event) => {
                    setOccurredOn(event.target.value);
                    if (errors.occurredOn || errors.submit) {
                      setErrors((current) => ({
                        ...current,
                        occurredOn: undefined,
                        submit: undefined,
                      }));
                    }
                  }}
                />
                {errors.occurredOn ? (
                  <FieldMessage id="transaction-date-error" tone="danger">
                    {errors.occurredOn}
                  </FieldMessage>
                ) : null}
              </label>
            </div>

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
              <span>Notes</span>
              <textarea
                className="textarea"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={4}
                placeholder="Optional details for later context"
              />
            </label>

            {errors.submit ? <FieldMessage tone="danger">{errors.submit}</FieldMessage> : null}

            <Button type="submit" disabled={!canSubmit}>
              {isSubmitting ? 'Saving transaction...' : 'Save transaction'}
            </Button>
          </form>
        </Card>

        <Card>
          <SectionHeader
            title="History"
            description="Search and trim transactions without leaving the page."
          />

          <div className="toolbar">
            <label className="search-field">
              <Search size={16} />
              <input
                ref={searchInputRef}
                className="input input--bare"
                value={query}
                aria-label="Search transactions"
                onChange={(event) => {
                  const next = event.target.value;
                  startTransition(() => setQuery(next));
                }}
                placeholder="Search description or notes"
              />
            </label>

            <select
              className="select"
              value={categoryFilter}
              aria-label="Filter transactions by category"
              onChange={(event) => {
                const next = event.target.value as 'all' | CategoryId;
                startTransition(() => setCategoryFilter(next));
              }}
            >
              <option value="all">All categories</option>
              {categoryDefinitions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          {filteredTransactions.length > 0 ? (
            <div className="stack-md">
              {filteredTransactions.map((transaction) => (
                <div className="list-row" key={transaction.id}>
                  <div className="list-row__meta">
                    <div className="stack-xs">
                      <strong>{transaction.description}</strong>
                      <span>{formatLongDate(transaction.occurredOn)}</span>
                      {transaction.notes ? (
                        <span className="list-row__subtle">{transaction.notes}</span>
                      ) : null}
                    </div>
                    <Tag tone="sky">{getCategoryLabel(transaction.categoryId)}</Tag>
                  </div>
                  <div className="list-row__value">
                    <strong>
                      {formatCurrency(transaction.amount, state.profile.currency)}
                    </strong>
                    <button
                      className="icon-button"
                      type="button"
                      onClick={() => actions.deleteTransaction(transaction.id)}
                      aria-label={`Delete ${transaction.description}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title={
                state.transactions.length === 0
                  ? 'No transactions yet'
                  : 'No matching transactions'
              }
              description={
                state.transactions.length === 0
                  ? 'Capture your first expense so reports and budget tracking become meaningful.'
                  : 'Adjust search terms or clear current filters to show more results.'
              }
              action={
                state.transactions.length === 0 ? (
                  <Button
                    tone="secondary"
                    type="button"
                    onClick={() => descriptionInputRef.current?.focus()}
                  >
                    Add first transaction
                  </Button>
                ) : (
                  <Button
                    tone="secondary"
                    type="button"
                    onClick={() => {
                      startTransition(() => {
                        setQuery('');
                        setCategoryFilter('all');
                      });
                      searchInputRef.current?.focus();
                    }}
                  >
                    Clear filters
                  </Button>
                )
              }
            />
          )}
        </Card>
      </section>
    </div>
  );
};

export default TransactionsPage;
