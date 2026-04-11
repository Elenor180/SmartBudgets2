import React, { useEffect, useRef, useState } from 'react';
import { Bot, Loader2, Send, Sparkles, WandSparkles } from 'lucide-react';
import { useWorkspace } from '@/app/WorkspaceProvider';
import type { AdvisorAction, AdvisorResponse } from '@/domain/models';
import { requestAdvisorResponse } from '@/integrations/ai/advisorService';
import { toErrorMessage } from '@/lib/errors';
import { formatCurrency, formatLongDate, getCategoryLabel } from '@/lib/format';
import {
  Button,
  Card,
  EmptyState,
  NoticeBanner,
  PageHeader,
  SectionHeader,
  Tag,
} from '@/ui/components';

interface AdvisorMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  payload?: AdvisorResponse;
}

const quickPrompts = [
  'Review my spending this month and tell me what needs attention first.',
  'Create two realistic savings goals based on my current finances.',
  'Suggest smarter reminders so I do not miss important payments.',
  'Find budget leaks and recommend new category limits.',
];

const noticeToneMap = {
  low: 'sky',
  medium: 'amber',
  high: 'rose',
} as const;

const AdvisorPage = () => {
  const { state, actions } = useWorkspace();
  const [messages, setMessages] = useState<AdvisorMessage[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedActions, setAppliedActions] = useState<Record<string, boolean>>({});
  const hasGeneratedBriefing = useRef(false);
  const latestAdvisorMessage = [...messages]
    .reverse()
    .find((message) => message.role === 'assistant');

  const runAdvisor = async (nextPrompt: string, mode: 'briefing' | 'chat') => {
    if (!nextPrompt.trim()) {
      return;
    }

    const userPrompt = nextPrompt.trim();
    setError(null);

    if (mode === 'chat') {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: 'user',
          text: userPrompt,
        },
      ]);
    }

    setIsLoading(true);

    try {
      const response = await requestAdvisorResponse({
        mode,
        prompt: userPrompt,
      });

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: response.message,
          payload: response,
        },
      ]);
    } catch (requestError) {
      setError(
        toErrorMessage(
          requestError,
          'The economist service is unavailable right now.',
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (hasGeneratedBriefing.current) {
      return;
    }

    hasGeneratedBriefing.current = true;
    void runAdvisor(
      'Generate a proactive financial briefing for this workspace. Focus on priorities, risks, and practical next actions.',
      'briefing',
    );
  }, [state]);

  const applyAction = async (action: AdvisorAction) => {
    try {
      switch (action.kind) {
        case 'upsert_budget':
          if (!action.categoryId || typeof action.limit !== 'number') {
            return;
          }
          await actions.upsertBudget({
            categoryId: action.categoryId,
            limit: action.limit,
          });
          break;
        case 'create_goal':
          if (!action.name || typeof action.targetAmount !== 'number') {
            return;
          }
          await actions.addGoal({
            name: action.name,
            categoryId: action.categoryId ?? 'savings',
            targetAmount: action.targetAmount,
            currentAmount: action.currentAmount ?? 0,
            targetDate: action.targetDate ?? '',
            notes: action.notes ?? action.rationale,
          });
          break;
        case 'create_reminder':
          if (!action.reminderTitle && !action.name) {
            return;
          }
          await actions.addReminder({
            title: action.reminderTitle || action.name || 'AI reminder',
            kind: action.reminderKind ?? 'bill',
            categoryId:
              action.reminderKind === 'budget' ? action.categoryId : undefined,
            dueDate: action.dueDate,
            threshold:
              action.reminderKind === 'budget' ? action.threshold : undefined,
            amount:
              action.reminderKind === 'bill' ? action.amount : undefined,
            note: action.notes ?? action.rationale,
            active: true,
          });
          break;
        case 'update_monthly_income':
          if (typeof action.amount !== 'number') {
            return;
          }
          await actions.updateProfile({ monthlyIncome: action.amount });
          break;
        case 'log_transaction':
          if (!action.description || typeof action.amount !== 'number') {
            return;
          }
          await actions.addTransaction({
            description: action.description,
            amount: action.amount,
            categoryId: action.categoryId ?? 'other',
            occurredOn: new Date().toISOString(),
            notes: action.notes ?? '',
          });
          break;
        default:
          return;
      }

      setAppliedActions((current) => ({
        ...current,
        [action.id]: true,
      }));
    } catch (applyError) {
      setError(
        toErrorMessage(
          applyError,
          'The app could not apply that recommendation.',
        ),
      );
    }
  };

  return (
    <div className="page">
      <PageHeader
        eyebrow="AI Advisor"
        title="Your economist inside the workspace"
        description="Ask for strategic guidance, let the assistant surface risks, and apply app-aware recommendations without leaving your finance dashboard."
      />

      {error ? <NoticeBanner tone="danger">{error}</NoticeBanner> : null}

      <section className="dashboard-grid">
        <Card className="hero-card">
          <SectionHeader
            title="Economist briefing"
            description="A workspace-aware advisor that can propose goals, reminders, budgets, and finance cleanups."
            action={
              <Tag tone={isLoading ? 'amber' : 'teal'}>
                {isLoading ? 'Thinking' : 'Ready'}
              </Tag>
            }
          />

          <div className="advisor-layout">
            <div className="advisor-thread">
              {messages.length > 0 ? (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={
                      message.role === 'assistant'
                        ? 'advisor-message advisor-message--assistant'
                        : 'advisor-message advisor-message--user'
                    }
                  >
                    <div className="advisor-message__icon">
                      {message.role === 'assistant' ? (
                        <Bot size={18} />
                      ) : (
                        <Sparkles size={18} />
                      )}
                    </div>
                    <div className="advisor-message__body">
                      <p>{message.text}</p>

                      {message.role === 'assistant' && message.payload?.headline ? (
                        <strong>{message.payload.headline}</strong>
                      ) : null}
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No advisor conversation yet"
                  description="Start with a quick prompt and the economist will review your workspace."
                />
              )}

              {isLoading ? (
                <div className="advisor-loading">
                  <Loader2 size={18} className="spin" />
                  <span>Analyzing your workspace...</span>
                </div>
              ) : null}
            </div>

            <div className="advisor-composer">
              <div className="advisor-quick-prompts">
                {quickPrompts.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className="theme-chip"
                    onClick={() => void runAdvisor(item, 'chat')}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <form
                className="advisor-composer__form"
                onSubmit={(event) => {
                  event.preventDefault();
                  const nextPrompt = prompt;
                  setPrompt('');
                  void runAdvisor(nextPrompt, 'chat');
                }}
              >
                <textarea
                  className="textarea"
                  rows={4}
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="Ask for a budget review, goal plan, reminder strategy, or a full finance diagnosis..."
                />
                <Button type="submit" disabled={isLoading || !prompt.trim()}>
                  Ask economist
                  <Send size={16} />
                </Button>
              </form>
            </div>
          </div>
        </Card>

        <Card>
          <SectionHeader
            title="Insight cards"
            description="The clearest takeaways from the latest advisor run."
          />
          {latestAdvisorMessage?.payload?.insights.length ? (
            <div className="stack-md">
              {latestAdvisorMessage.payload.insights.map((insight) => (
                <div className="budget-row" key={`${insight.title}-${insight.detail}`}>
                  <div className="budget-row__head">
                    <div className="stack-xs">
                      <strong>{insight.title}</strong>
                      <span>{insight.detail}</span>
                    </div>
                    <Tag tone={insight.tone}>{insight.tone}</Tag>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No AI insights yet"
              description="Run a briefing or ask a question to generate workspace-specific intelligence."
            />
          )}
        </Card>

        <Card>
          <SectionHeader
            title="Suggested actions"
            description="Recommendations you can apply directly to the app."
          />
          {latestAdvisorMessage?.payload?.actions.length ? (
            <div className="stack-md">
              {latestAdvisorMessage.payload.actions.map((action) => (
                <div className="goal-card" key={action.id}>
                  <div className="goal-card__header">
                    <div className="stack-xs">
                      <strong>{action.title}</strong>
                      <span>{action.rationale}</span>
                    </div>
                    <Tag tone="teal">{action.kind.replace(/_/g, ' ')}</Tag>
                  </div>

                  <div className="stack-xs">
                    {action.categoryId ? (
                      <span>Category: {getCategoryLabel(action.categoryId)}</span>
                    ) : null}
                    {typeof action.limit === 'number' ? (
                      <span>
                        Limit: {formatCurrency(action.limit, state.profile.currency)}
                      </span>
                    ) : null}
                    {typeof action.amount === 'number' ? (
                      <span>
                        Amount: {formatCurrency(action.amount, state.profile.currency)}
                      </span>
                    ) : null}
                    {typeof action.targetAmount === 'number' ? (
                      <span>
                        Target: {formatCurrency(
                          action.targetAmount,
                          state.profile.currency,
                        )}
                      </span>
                    ) : null}
                    {action.targetDate ? (
                      <span>Target date: {formatLongDate(action.targetDate)}</span>
                    ) : null}
                    {action.dueDate ? (
                      <span>Due date: {formatLongDate(action.dueDate)}</span>
                    ) : null}
                    {typeof action.threshold === 'number' ? (
                      <span>Threshold: {action.threshold}%</span>
                    ) : null}
                  </div>

                  <Button
                    tone={appliedActions[action.id] ? 'secondary' : 'primary'}
                    disabled={Boolean(appliedActions[action.id])}
                    onClick={() => void applyAction(action)}
                  >
                    {appliedActions[action.id] ? 'Applied' : 'Apply recommendation'}
                    <WandSparkles size={16} />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No actions proposed"
              description="Ask the economist to create goals, budgets, reminders, or cleanup steps."
            />
          )}
        </Card>

        <Card>
          <SectionHeader
            title="Priority notices"
            description="Friendly notifications the AI thinks you should see."
          />
          {latestAdvisorMessage?.payload?.notices.length ? (
            <div className="stack-md">
              {latestAdvisorMessage.payload.notices.map((notice) => (
                <div className="insight-item insight-item--block" key={`${notice.title}-${notice.detail}`}>
                  <div className="stack-xs">
                    <strong>{notice.title}</strong>
                    <p>{notice.detail}</p>
                  </div>
                  <Tag tone={noticeToneMap[notice.urgency]}>{notice.urgency}</Tag>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No notices yet"
              description="The advisor will surface user-friendly alerts as it learns from this workspace."
            />
          )}
        </Card>
      </section>
    </div>
  );
};

export default AdvisorPage;
