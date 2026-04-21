import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  ChartColumnBig,
  CircleDollarSign,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useWorkspace } from '@/app/WorkspaceProvider';
import type {
  CategoryId,
  Currency,
  ThemeMode,
  WorkspaceState,
} from '@/domain/models';
import { currencies, themeModes } from '@/domain/models';
import { formatCurrency } from '@/lib/format';
import { createId } from '@/lib/id';
import {
  Button,
  Card,
  FieldMessage,
  MetricCard,
  NoticeBanner,
  SectionHeader,
} from '@/ui/components';

interface SetupExpenseDescriptor {
  categoryId: CategoryId;
  label: string;
  description: string;
  placeholder: string;
}

interface IncomeStreamFormState {
  id: string;
  name: string;
  monthlyAmount: string;
}

interface SetupFormState {
  fullName: string;
  currency: Currency;
  monthlyIncome: string;
  monthlySavingsTarget: string;
  theme: ThemeMode;
  expenseTargets: Partial<Record<CategoryId, string>>;
  incomeStreams: IncomeStreamFormState[];
}

const essentialExpenseDescriptors: readonly SetupExpenseDescriptor[] = [
  {
    categoryId: 'food',
    label: 'Groceries and basics',
    description: 'Food, toiletries, and the essential household shop.',
    placeholder: '420',
  },
  {
    categoryId: 'housing',
    label: 'Rent or mortgage',
    description: 'Housing, rates, and the core monthly home payment.',
    placeholder: '1250',
  },
  {
    categoryId: 'transport',
    label: 'Transport and fuel',
    description: 'Fuel, commuting, ride costs, and car instalments.',
    placeholder: '320',
  },
  {
    categoryId: 'utilities',
    label: 'Utilities and internet',
    description: 'Electricity, water, mobile, connectivity, and services.',
    placeholder: '180',
  },
  {
    categoryId: 'education',
    label: 'Education',
    description: 'School fees, books, training, and study costs.',
    placeholder: '150',
  },
  {
    categoryId: 'healthcare',
    label: 'Healthcare',
    description: 'Medical cover, medication, and recurring health costs.',
    placeholder: '120',
  },
  {
    categoryId: 'debt',
    label: 'Debt repayments',
    description: 'Loans, store cards, and minimum credit repayments.',
    placeholder: '260',
  },
];

const flexibleExpenseDescriptors: readonly SetupExpenseDescriptor[] = [
  {
    categoryId: 'entertainment',
    label: 'Dining out and subscriptions',
    description: 'Eating out, streaming, events, and lifestyle subscriptions.',
    placeholder: '160',
  },
  {
    categoryId: 'other',
    label: 'Clothing and personal spending',
    description: 'Clothing, personal items, gifting, and other non-essential spend.',
    placeholder: '140',
  },
];

const allExpenseDescriptors = [
  ...essentialExpenseDescriptors,
  ...flexibleExpenseDescriptors,
] as const;

const createBlankIncomeStream = (id = 'setup-income-1'): IncomeStreamFormState => ({
  id,
  name: '',
  monthlyAmount: '',
});

const createEmptyExpenseTargets = () =>
  Object.fromEntries(
    allExpenseDescriptors.map((descriptor) => [descriptor.categoryId, '']),
  ) as Partial<Record<CategoryId, string>>;

const createSetupFormState = (state: WorkspaceState): SetupFormState => {
  const expenseTargets = createEmptyExpenseTargets();

  for (const descriptor of allExpenseDescriptors) {
    const matchingBudget = state.budgets.find(
      (budget) => budget.categoryId === descriptor.categoryId,
    );

    expenseTargets[descriptor.categoryId] =
      matchingBudget && matchingBudget.limit > 0 ? String(matchingBudget.limit) : '';
  }

  const savingsBudget = state.budgets.find(
    (budget) => budget.categoryId === 'savings',
  );

  return {
    fullName: state.profile.fullName,
    currency: state.profile.currency,
    monthlyIncome: String(state.profile.monthlyIncome),
    monthlySavingsTarget:
      savingsBudget && savingsBudget.limit > 0 ? String(savingsBudget.limit) : '',
    theme: state.profile.theme,
    expenseTargets,
    incomeStreams: [createBlankIncomeStream()],
  };
};

const serializeSetupFormState = (form: SetupFormState) => JSON.stringify(form);

const parseAmountInput = (value: string) => {
  if (!value.trim()) {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const getPreviewAmount = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const SetupPage = () => {
  const { state, auth, actions } = useWorkspace();
  const [form, setForm] = useState(() => createSetupFormState(state));
  const [fieldErrors, setFieldErrors] = useState<{
    fullName?: string;
    monthlyIncome?: string;
    monthlySavingsTarget?: string;
    expenseTargets?: string;
    incomeStreams?: string;
  }>({});
  const syncedFormRef = useRef(serializeSetupFormState(createSetupFormState(state)));

  useEffect(() => {
    const nextForm = createSetupFormState(state);
    const nextSerialized = serializeSetupFormState(nextForm);

    setForm((current) =>
      serializeSetupFormState(current) === syncedFormRef.current ? nextForm : current,
    );

    syncedFormRef.current = nextSerialized;
  }, [
    state.budgets,
    state.profile.currency,
    state.profile.fullName,
    state.profile.monthlyIncome,
    state.profile.theme,
  ]);

  const essentialBaseline = essentialExpenseDescriptors.reduce(
    (sum, descriptor) =>
      sum + getPreviewAmount(form.expenseTargets[descriptor.categoryId] ?? ''),
    0,
  );
  const flexibleBaseline = flexibleExpenseDescriptors.reduce(
    (sum, descriptor) =>
      sum + getPreviewAmount(form.expenseTargets[descriptor.categoryId] ?? ''),
    0,
  );
  const totalExpenseBaseline = essentialBaseline + flexibleBaseline;
  const incomeFromStreams = form.incomeStreams.reduce(
    (sum, stream) => sum + getPreviewAmount(stream.monthlyAmount),
    0,
  );
  const savingsTarget = getPreviewAmount(form.monthlySavingsTarget);
  const usesIncomeStreams = incomeFromStreams > 0;
  const effectiveMonthlyIncome = usesIncomeStreams
    ? incomeFromStreams
    : getPreviewAmount(form.monthlyIncome);
  const availableAfterExpenses = effectiveMonthlyIncome - totalExpenseBaseline;
  const availableAfterSavings = availableAfterExpenses - savingsTarget;

  const handleCompleteSetup = (seedSample: boolean) => {
    if (seedSample) {
      setFieldErrors({});
      void actions.completeSetup(
        {
          fullName:
            form.fullName.trim().length >= 2
              ? form.fullName.trim()
              : 'Workspace Owner',
          email: auth.user?.email || state.profile.email,
          currency: form.currency,
          monthlyIncome: getPreviewAmount(form.monthlyIncome),
          theme: form.theme,
          budgetTargets: [],
          monthlySavingsTarget: 0,
        },
        true,
      );
      return;
    }

    const nextFieldErrors: {
      fullName?: string;
      monthlyIncome?: string;
      monthlySavingsTarget?: string;
      expenseTargets?: string;
      incomeStreams?: string;
    } = {};
    const parsedMonthlyIncome = parseAmountInput(form.monthlyIncome);
    const parsedSavingsTarget = parseAmountInput(form.monthlySavingsTarget);
    let incomeStreamTotal = 0;
    let hasPositiveIncomeStream = false;

    if (form.fullName.trim() && form.fullName.trim().length < 2) {
      nextFieldErrors.fullName =
        'Use at least 2 characters or leave this blank to use Workspace Owner.';
    }

    for (const stream of form.incomeStreams) {
      if (!stream.monthlyAmount.trim()) {
        continue;
      }

      const parsedStreamAmount = parseAmountInput(stream.monthlyAmount);
      if (parsedStreamAmount === null || parsedStreamAmount < 0) {
        nextFieldErrors.incomeStreams =
          'Use 0 or a positive monthly amount for every income stream.';
        break;
      }

      incomeStreamTotal += parsedStreamAmount;
      if (parsedStreamAmount > 0) {
        hasPositiveIncomeStream = true;
      }
    }

    if (!hasPositiveIncomeStream) {
      if (parsedMonthlyIncome === null) {
        nextFieldErrors.monthlyIncome = 'Enter a valid monthly income amount.';
      } else if (parsedMonthlyIncome < 0) {
        nextFieldErrors.monthlyIncome = 'Monthly income cannot be negative.';
      }
    }

    if (parsedSavingsTarget === null) {
      nextFieldErrors.monthlySavingsTarget =
        'Enter a valid monthly savings target.';
    } else if (parsedSavingsTarget < 0) {
      nextFieldErrors.monthlySavingsTarget =
        'Monthly savings target cannot be negative.';
    }

    for (const descriptor of allExpenseDescriptors) {
      const parsedExpense = parseAmountInput(
        form.expenseTargets[descriptor.categoryId] ?? '',
      );

      if (parsedExpense === null || parsedExpense < 0) {
        nextFieldErrors.expenseTargets =
          'Use 0 or a positive monthly amount for each expense field.';
        break;
      }
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    setFieldErrors({});

    const budgetTargets = allExpenseDescriptors
      .map((descriptor) => ({
        categoryId: descriptor.categoryId,
        monthlyAmount:
          parseAmountInput(form.expenseTargets[descriptor.categoryId] ?? '') ?? 0,
      }))
      .filter((target) => target.monthlyAmount > 0);

    void actions.completeSetup(
      {
        fullName: form.fullName.trim() || 'Workspace Owner',
        email: auth.user?.email || state.profile.email,
        currency: form.currency,
        monthlyIncome: hasPositiveIncomeStream
          ? incomeStreamTotal
          : (parsedMonthlyIncome ?? 0),
        theme: form.theme,
        budgetTargets,
        monthlySavingsTarget: parsedSavingsTarget ?? 0,
      },
      seedSample,
    );
  };

  const planHealthMessage =
    effectiveMonthlyIncome <= 0 && (totalExpenseBaseline > 0 || savingsTarget > 0)
      ? {
          tone: 'info' as const,
          message:
            'You have planned spending before adding income. That is okay for now, but the dashboard will become more useful once income is set.',
        }
      : effectiveMonthlyIncome > 0 && availableAfterExpenses < 0
        ? {
            tone: 'danger' as const,
            message:
              'Planned expenses are higher than the monthly income total. Reduce some category baselines or raise income before continuing.',
          }
        : effectiveMonthlyIncome > 0 && availableAfterSavings < 0
          ? {
              tone: 'danger' as const,
              message:
                'The savings target pushes the plan below zero. Consider lowering the savings amount or trimming flexible spending.',
            }
          : effectiveMonthlyIncome > 0 && savingsTarget > 0
            ? {
                tone: 'success' as const,
                message:
                  'This plan leaves room for the savings target. The app will start with a working monthly baseline on first login.',
              }
            : null;

  return (
    <div className="setup-page">
      <div className="setup-page__panel">
        <div className="stack-md">
          <span className="eyebrow">Guided financial onboarding</span>
          <h1>Build a real monthly baseline before the workspace opens up.</h1>
          <p className="page-description">
            This questionnaire turns first login into a working financial plan.
            Add essential expenses, flexible spending, optional income streams,
            and a savings target now, then refine everything later from budgets,
            transactions, and settings.
          </p>
        </div>

        <div className="setup-highlights">
          <Card className="setup-highlight">
            <CircleDollarSign size={24} />
            <div className="stack-xs">
              <strong>Guided planning baseline</strong>
              <p>
                The amounts you enter here become your starting monthly budgets,
                so the app can evaluate future transactions immediately.
              </p>
            </div>
          </Card>
          <Card className="setup-highlight">
            <ShieldCheck size={24} />
            <div className="stack-xs">
              <strong>Editable after onboarding</strong>
              <p>
                Income totals, budgets, savings targets, and reminders can still
                be updated after setup without rebuilding the workspace.
              </p>
            </div>
          </Card>
          <Card className="setup-highlight">
            <ChartColumnBig size={24} />
            <div className="stack-xs">
              <strong>Insight-ready from day one</strong>
              <p>
                A stronger starting baseline gives the dashboard, alerts, and AI
                far better context than a completely empty account.
              </p>
            </div>
          </Card>
          <Card className="setup-highlight">
            <Sparkles size={24} />
            <div className="stack-xs">
              <strong>Productivity-focused flow</strong>
              <p>
                Essential costs are separated from non-essential spending so the
                app can guide smarter prioritisation early.
              </p>
            </div>
          </Card>
        </div>
      </div>

      <Card className="setup-page__form">
        <div className="section-header">
          <div className="stack-xs">
            <h2>Build your starting workspace</h2>
            <p>
              Start with a realistic monthly plan. Unknown values can stay at 0
              and be refined later.
            </p>
          </div>
        </div>

        {auth.notice ? <NoticeBanner tone="success">{auth.notice}</NoticeBanner> : null}
        {auth.syncError ? <NoticeBanner tone="danger">{auth.syncError}</NoticeBanner> : null}

        <section className="setup-section">
          <SectionHeader
            title="Customer profile"
            description="These values complete the base profile stored in Supabase."
          />

          <div className="form-grid">
            <label className="field">
              <span>Full name</span>
              <input
                className={fieldErrors.fullName ? 'input input--invalid' : 'input'}
                value={form.fullName}
                onChange={(event) => {
                  setForm((current) => ({
                    ...current,
                    fullName: event.target.value,
                  }));
                  setFieldErrors((current) => ({
                    ...current,
                    fullName: undefined,
                  }));
                }}
                placeholder="Randy Coster"
                aria-invalid={Boolean(fieldErrors.fullName)}
                aria-describedby={
                  fieldErrors.fullName ? 'setup-full-name-error' : 'setup-full-name-help'
                }
              />
              {fieldErrors.fullName ? (
                <FieldMessage id="setup-full-name-error" tone="danger">
                  {fieldErrors.fullName}
                </FieldMessage>
              ) : (
                <FieldMessage id="setup-full-name-help">
                  Optional. Leave this blank to use Workspace Owner.
                </FieldMessage>
              )}
            </label>

            <label className="field">
              <span>Email</span>
              <input
                className="input"
                type="email"
                value={auth.user?.email || state.profile.email}
                disabled
              />
            </label>

            <label className="field">
              <span>Currency</span>
              <select
                className="select"
                value={form.currency}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    currency: event.target.value as Currency,
                  }))
                }
              >
                {currencies.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <div className="field">
              <span>Theme</span>
              <div className="theme-picker">
                {themeModes.map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={option === form.theme}
                    className={
                      option === form.theme
                        ? 'theme-chip theme-chip--active'
                        : 'theme-chip'
                    }
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        theme: option,
                      }))
                    }
                  >
                    {option === 'light' ? 'Light workspace' : 'Dark workspace'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="setup-section">
          <SectionHeader
            title="Income streams"
            description="Optional. Add recurring income sources or enter a single monthly total."
            action={
              <Button
                tone="ghost"
                type="button"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    incomeStreams: current.incomeStreams.concat(
                      createBlankIncomeStream(createId('setup-income')),
                    ),
                  }))
                }
              >
                Add income stream
              </Button>
            }
          />

          <div className="setup-income-list">
            {form.incomeStreams.map((stream, index) => (
              <div className="setup-income-row" key={stream.id}>
                <label className="field">
                  <span>Income source</span>
                  <input
                    className="input"
                    value={stream.name}
                    onChange={(event) => {
                      setForm((current) => ({
                        ...current,
                        incomeStreams: current.incomeStreams.map((entry) =>
                          entry.id === stream.id
                            ? {
                                ...entry,
                                name: event.target.value,
                              }
                            : entry,
                        ),
                      }));
                    }}
                    placeholder={index === 0 ? 'Salary' : 'Freelance, grants, side income'}
                  />
                </label>

                <label className="field">
                  <span>Monthly amount</span>
                  <input
                    className={fieldErrors.incomeStreams ? 'input input--invalid' : 'input'}
                    type="number"
                    min="0"
                    step="0.01"
                    value={stream.monthlyAmount}
                    onChange={(event) => {
                      setForm((current) => ({
                        ...current,
                        incomeStreams: current.incomeStreams.map((entry) =>
                          entry.id === stream.id
                            ? {
                                ...entry,
                                monthlyAmount: event.target.value,
                              }
                            : entry,
                        ),
                      }));
                      setFieldErrors((current) => ({
                        ...current,
                        incomeStreams: undefined,
                        monthlyIncome: undefined,
                      }));
                    }}
                  />
                </label>

                <Button
                  tone="ghost"
                  type="button"
                  disabled={form.incomeStreams.length === 1}
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      incomeStreams:
                        current.incomeStreams.length === 1
                          ? [createBlankIncomeStream()]
                          : current.incomeStreams.filter(
                              (entry) => entry.id !== stream.id,
                            ),
                    }))
                  }
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>

          {fieldErrors.incomeStreams ? (
            <FieldMessage tone="danger">{fieldErrors.incomeStreams}</FieldMessage>
          ) : (
            <FieldMessage>
              If income streams are added, their total becomes the starting
              monthly income automatically.
            </FieldMessage>
          )}

          <label className="field">
            <span>Monthly income total</span>
            <input
              className={fieldErrors.monthlyIncome ? 'input input--invalid' : 'input'}
              type="number"
              min="0"
              step="0.01"
              value={usesIncomeStreams ? String(incomeFromStreams) : form.monthlyIncome}
              onChange={(event) => {
                setForm((current) => ({
                  ...current,
                  monthlyIncome: event.target.value,
                }));
                setFieldErrors((current) => ({
                  ...current,
                  monthlyIncome: undefined,
                }));
              }}
              disabled={usesIncomeStreams}
              aria-invalid={Boolean(fieldErrors.monthlyIncome)}
              aria-describedby={
                fieldErrors.monthlyIncome
                  ? 'setup-monthly-income-error'
                  : 'setup-monthly-income-help'
              }
            />
            {fieldErrors.monthlyIncome ? (
              <FieldMessage id="setup-monthly-income-error" tone="danger">
                {fieldErrors.monthlyIncome}
              </FieldMessage>
            ) : (
              <FieldMessage id="setup-monthly-income-help">
                {usesIncomeStreams
                  ? 'This total is being calculated from the income streams above.'
                  : 'Leave this at 0 if you want to complete the workspace before entering income.'}
              </FieldMessage>
            )}
          </label>
        </section>

        <section className="setup-section">
          <SectionHeader
            title="Expense baseline"
            description="These answers seed the starting monthly budgets that future transactions will be measured against."
          />

          <div className="stack-md">
            <div className="stack-sm">
              <div className="stack-xs">
                <strong>Essentials</strong>
                <p className="page-description">
                  Start with the core costs that keep everyday life running.
                </p>
              </div>

              <div className="setup-expense-grid">
                {essentialExpenseDescriptors.map((descriptor) => (
                  <label className="field" key={descriptor.categoryId}>
                    <span>{descriptor.label}</span>
                    <input
                      className={fieldErrors.expenseTargets ? 'input input--invalid' : 'input'}
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.expenseTargets[descriptor.categoryId] ?? ''}
                      onChange={(event) => {
                        setForm((current) => ({
                          ...current,
                          expenseTargets: {
                            ...current.expenseTargets,
                            [descriptor.categoryId]: event.target.value,
                          },
                        }));
                        setFieldErrors((current) => ({
                          ...current,
                          expenseTargets: undefined,
                        }));
                      }}
                      placeholder={descriptor.placeholder}
                    />
                    <FieldMessage>{descriptor.description}</FieldMessage>
                  </label>
                ))}
              </div>
            </div>

            <div className="stack-sm">
              <div className="stack-xs">
                <strong>Non-essential spending</strong>
                <p className="page-description">
                  Capture the lifestyle costs that usually flex up and down first.
                </p>
              </div>

              <div className="setup-expense-grid">
                {flexibleExpenseDescriptors.map((descriptor) => (
                  <label className="field" key={descriptor.categoryId}>
                    <span>{descriptor.label}</span>
                    <input
                      className={fieldErrors.expenseTargets ? 'input input--invalid' : 'input'}
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.expenseTargets[descriptor.categoryId] ?? ''}
                      onChange={(event) => {
                        setForm((current) => ({
                          ...current,
                          expenseTargets: {
                            ...current.expenseTargets,
                            [descriptor.categoryId]: event.target.value,
                          },
                        }));
                        setFieldErrors((current) => ({
                          ...current,
                          expenseTargets: undefined,
                        }));
                      }}
                      placeholder={descriptor.placeholder}
                    />
                    <FieldMessage>{descriptor.description}</FieldMessage>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {fieldErrors.expenseTargets ? (
            <FieldMessage tone="danger">{fieldErrors.expenseTargets}</FieldMessage>
          ) : (
            <FieldMessage>
              These values become starting category budgets. Actual cash movement
              is still captured later from the Transactions screen.
            </FieldMessage>
          )}
        </section>

        <section className="setup-section">
          <SectionHeader
            title="Savings target"
            description="Add the monthly amount you want the app to protect for saving."
          />

          <label className="field">
            <span>Monthly savings target</span>
            <input
              className={
                fieldErrors.monthlySavingsTarget ? 'input input--invalid' : 'input'
              }
              type="number"
              min="0"
              step="0.01"
              value={form.monthlySavingsTarget}
              onChange={(event) => {
                setForm((current) => ({
                  ...current,
                  monthlySavingsTarget: event.target.value,
                }));
                setFieldErrors((current) => ({
                  ...current,
                  monthlySavingsTarget: undefined,
                }));
              }}
              aria-invalid={Boolean(fieldErrors.monthlySavingsTarget)}
              aria-describedby={
                fieldErrors.monthlySavingsTarget
                  ? 'setup-savings-target-error'
                  : 'setup-savings-target-help'
              }
            />
            {fieldErrors.monthlySavingsTarget ? (
              <FieldMessage id="setup-savings-target-error" tone="danger">
                {fieldErrors.monthlySavingsTarget}
              </FieldMessage>
            ) : (
              <FieldMessage id="setup-savings-target-help">
                This will seed the Savings budget so the workspace protects it from
                day one.
              </FieldMessage>
            )}
          </label>
        </section>

        <section className="setup-section">
          <SectionHeader
            title="Monthly plan summary"
            description="A quick read on whether the baseline is workable before you finish setup."
          />

          <div className="metric-grid">
            <MetricCard
              label="Income"
              value={formatCurrency(effectiveMonthlyIncome, form.currency)}
              detail={
                usesIncomeStreams ? 'Summed from income streams' : 'Manual monthly total'
              }
              tone="teal"
            />
            <MetricCard
              label="Essentials"
              value={formatCurrency(essentialBaseline, form.currency)}
              detail="Core costs"
              tone="amber"
            />
            <MetricCard
              label="Flexible Spend"
              value={formatCurrency(flexibleBaseline, form.currency)}
              detail="Non-essential baseline"
              tone="sky"
            />
            <MetricCard
              label="After Savings"
              value={formatCurrency(availableAfterSavings, form.currency)}
              detail="Income minus expenses and savings"
              tone={availableAfterSavings >= 0 ? 'teal' : 'rose'}
            />
          </div>

          {planHealthMessage ? (
            <FieldMessage tone={planHealthMessage.tone}>
              {planHealthMessage.message}
            </FieldMessage>
          ) : null}
        </section>

        <div className="split-actions">
          <Button
            disabled={auth.isSaving}
            onClick={() => handleCompleteSetup(false)}
          >
            {auth.isSaving ? 'Creating workspace...' : 'Create workspace from answers'}
            <ArrowRight size={16} />
          </Button>
          <Button
            tone="secondary"
            disabled={auth.isSaving}
            onClick={() => handleCompleteSetup(true)}
          >
            Load example data
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default SetupPage;
