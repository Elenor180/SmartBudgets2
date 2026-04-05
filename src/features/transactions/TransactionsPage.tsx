import React, { startTransition, useDeferredValue, useState } from 'react';
import { Search, Trash2 } from 'lucide-react';
import { useWorkspace } from '@/app/WorkspaceProvider';
import { categoryDefinitions, type CategoryId } from '@/domain/models';
import { getCategoryLabel, formatCurrency, formatLongDate } from '@/lib/format';
import {
  Button,
  Card,
  EmptyState,
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

  const deferredQuery = useDeferredValue(query);
  const deferredFilter = useDeferredValue(categoryFilter);
  const filteredTransactions = state.transactions.filter((transaction) => {
    const matchesQuery =
      deferredQuery.trim().length === 0 ||
      transaction.description.toLowerCase().includes(deferredQuery.toLowerCase()) ||
      transaction.notes.toLowerCase().includes(deferredQuery.toLowerCase());
    const matchesCategory =
      deferredFilter === 'all' || transaction.categoryId === deferredFilter;

    return matchesQuery && matchesCategory;
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!description.trim() || Number(amount) <= 0) {
      return;
    }

    actions.addTransaction({
      description: description.trim(),
      amount: Number(amount),
      categoryId,
      occurredOn: `${occurredOn}T00:00:00.000Z`,
      notes: notes.trim(),
    });

    setDescription('');
    setAmount('');
    setNotes('');
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
                className="input"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Groceries, fuel, internet, rent..."
              />
            </label>

            <div className="form-grid form-grid--tight">
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

              <label className="field">
                <span>Date</span>
                <input
                  className="input"
                  type="date"
                  value={occurredOn}
                  onChange={(event) => setOccurredOn(event.target.value)}
                />
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

            <Button type="submit">Save transaction</Button>
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
                className="input input--bare"
                value={query}
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
              title="No matching transactions"
              description="Add your first expense or adjust the search and filters."
            />
          )}
        </Card>
      </section>
    </div>
  );
};

export default TransactionsPage;
