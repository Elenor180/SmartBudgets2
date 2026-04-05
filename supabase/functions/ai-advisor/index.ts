import { corsHeaders } from '../_shared/cors.ts';

type CategoryId =
  | 'housing'
  | 'food'
  | 'transport'
  | 'utilities'
  | 'healthcare'
  | 'debt'
  | 'entertainment'
  | 'savings'
  | 'education'
  | 'other';

type ReminderKind = 'bill' | 'budget' | 'goal';

type AdvisorTone = 'teal' | 'amber' | 'rose' | 'sky';

type AdvisorActionKind =
  | 'upsert_budget'
  | 'create_goal'
  | 'create_reminder'
  | 'update_monthly_income'
  | 'log_transaction';

interface WorkspaceState {
  version: number;
  setupComplete: boolean;
  profile: {
    fullName: string;
    email: string;
    currency: 'USD' | 'EUR' | 'GBP' | 'ZAR';
    monthlyIncome: number;
    theme: 'light' | 'dark';
    startedAt: string;
  };
  budgets: Array<{
    id: string;
    categoryId: CategoryId;
    limit: number;
    createdAt: string;
    updatedAt: string;
  }>;
  transactions: Array<{
    id: string;
    description: string;
    amount: number;
    categoryId: CategoryId;
    occurredOn: string;
    notes: string;
    createdAt: string;
  }>;
  goals: Array<{
    id: string;
    name: string;
    categoryId: CategoryId;
    targetAmount: number;
    currentAmount: number;
    targetDate: string;
    notes: string;
    createdAt: string;
    updatedAt: string;
  }>;
  reminders: Array<{
    id: string;
    title: string;
    kind: ReminderKind;
    categoryId?: CategoryId;
    dueDate?: string;
    threshold?: number;
    amount?: number;
    note: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
}

interface AdvisorInsight {
  title: string;
  detail: string;
  tone: AdvisorTone;
}

interface AdvisorNotice {
  title: string;
  detail: string;
  urgency: 'low' | 'medium' | 'high';
}

interface AdvisorAction {
  id: string;
  kind: AdvisorActionKind;
  title: string;
  rationale: string;
  categoryId?: CategoryId;
  amount?: number;
  limit?: number;
  name?: string;
  targetAmount?: number;
  currentAmount?: number;
  targetDate?: string;
  dueDate?: string;
  threshold?: number;
  reminderTitle?: string;
  description?: string;
  notes?: string;
  reminderKind?: ReminderKind;
}

interface AdvisorResponse {
  headline: string;
  message: string;
  insights: AdvisorInsight[];
  notices: AdvisorNotice[];
  actions: AdvisorAction[];
}

const categoryIds = [
  'housing',
  'food',
  'transport',
  'utilities',
  'healthcare',
  'debt',
  'entertainment',
  'savings',
  'education',
  'other',
] as const satisfies readonly CategoryId[];

const actionKinds = [
  'upsert_budget',
  'create_goal',
  'create_reminder',
  'update_monthly_income',
  'log_transaction',
] as const satisfies readonly AdvisorActionKind[];

const reminderKinds = ['bill', 'budget', 'goal'] as const satisfies readonly ReminderKind[];

const advisorTones = ['teal', 'amber', 'rose', 'sky'] as const satisfies readonly AdvisorTone[];

const fallbackResponse: AdvisorResponse = {
  headline: 'Economist temporarily unavailable',
  message:
    'I could not complete a workspace review just now. Please try again in a moment.',
  insights: [],
  notices: [],
  actions: [],
};

const advisorResponseSchema = {
  type: 'object',
  properties: {
    headline: {
      type: 'string',
      description:
        'A short, confident headline summarizing the most important financial takeaway.',
    },
    message: {
      type: 'string',
      description:
        'A warm, practical message for the user in plain language. Keep it concise but actionable.',
    },
    insights: {
      type: 'array',
      maxItems: 5,
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          detail: { type: 'string' },
          tone: { type: 'string', enum: [...advisorTones] },
        },
        required: ['title', 'detail', 'tone'],
      },
    },
    notices: {
      type: 'array',
      maxItems: 3,
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          detail: { type: 'string' },
          urgency: {
            type: 'string',
            enum: ['low', 'medium', 'high'],
          },
        },
        required: ['title', 'detail', 'urgency'],
      },
    },
    actions: {
      type: 'array',
      maxItems: 4,
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          kind: { type: 'string', enum: [...actionKinds] },
          title: { type: 'string' },
          rationale: { type: 'string' },
          categoryId: { type: 'string', enum: [...categoryIds] },
          amount: { type: 'number' },
          limit: { type: 'number' },
          name: { type: 'string' },
          targetAmount: { type: 'number' },
          currentAmount: { type: 'number' },
          targetDate: { type: 'string' },
          dueDate: { type: 'string' },
          threshold: { type: 'number' },
          reminderTitle: { type: 'string' },
          description: { type: 'string' },
          notes: { type: 'string' },
          reminderKind: { type: 'string', enum: [...reminderKinds] },
        },
        required: ['id', 'kind', 'title', 'rationale'],
      },
    },
  },
  required: ['headline', 'message', 'insights', 'notices', 'actions'],
} as const;

const json = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
      ...(init?.headers ?? {}),
    },
  });

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const toFiniteNumber = (value: unknown) => {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value)
        : NaN;

  return Number.isFinite(parsed) ? parsed : 0;
};

const isCategoryId = (value: unknown): value is CategoryId =>
  typeof value === 'string' && categoryIds.includes(value as CategoryId);

const isReminderKind = (value: unknown): value is ReminderKind =>
  typeof value === 'string' && reminderKinds.includes(value as ReminderKind);

const parseWorkspace = (input: unknown): WorkspaceState | null => {
  if (!isRecord(input) || !isRecord(input.profile)) {
    return null;
  }

  const profile = input.profile;
  const monthlyIncome = Math.max(0, toFiniteNumber(profile.monthlyIncome));
  const currency =
    profile.currency === 'USD' ||
    profile.currency === 'EUR' ||
    profile.currency === 'GBP' ||
    profile.currency === 'ZAR'
      ? profile.currency
      : 'USD';
  const theme = profile.theme === 'dark' ? 'dark' : 'light';

  const budgets = Array.isArray(input.budgets)
    ? input.budgets
        .filter(isRecord)
        .map((budget) => ({
          id: typeof budget.id === 'string' ? budget.id : crypto.randomUUID(),
          categoryId: isCategoryId(budget.categoryId)
            ? budget.categoryId
            : 'other',
          limit: Math.max(0, toFiniteNumber(budget.limit)),
          createdAt:
            typeof budget.createdAt === 'string'
              ? budget.createdAt
              : new Date().toISOString(),
          updatedAt:
            typeof budget.updatedAt === 'string'
              ? budget.updatedAt
              : new Date().toISOString(),
        }))
    : [];

  const transactions = Array.isArray(input.transactions)
    ? input.transactions
        .filter(isRecord)
        .map((transaction) => ({
          id:
            typeof transaction.id === 'string'
              ? transaction.id
              : crypto.randomUUID(),
          description:
            typeof transaction.description === 'string'
              ? transaction.description
              : 'Transaction',
          amount: Math.max(0, toFiniteNumber(transaction.amount)),
          categoryId: isCategoryId(transaction.categoryId)
            ? transaction.categoryId
            : 'other',
          occurredOn:
            typeof transaction.occurredOn === 'string'
              ? transaction.occurredOn
              : new Date().toISOString(),
          notes: typeof transaction.notes === 'string' ? transaction.notes : '',
          createdAt:
            typeof transaction.createdAt === 'string'
              ? transaction.createdAt
              : new Date().toISOString(),
        }))
    : [];

  const goals = Array.isArray(input.goals)
    ? input.goals
        .filter(isRecord)
        .map((goal) => ({
          id: typeof goal.id === 'string' ? goal.id : crypto.randomUUID(),
          name: typeof goal.name === 'string' ? goal.name : 'Goal',
          categoryId: isCategoryId(goal.categoryId) ? goal.categoryId : 'savings',
          targetAmount: Math.max(0, toFiniteNumber(goal.targetAmount)),
          currentAmount: Math.max(0, toFiniteNumber(goal.currentAmount)),
          targetDate:
            typeof goal.targetDate === 'string' ? goal.targetDate : '',
          notes: typeof goal.notes === 'string' ? goal.notes : '',
          createdAt:
            typeof goal.createdAt === 'string'
              ? goal.createdAt
              : new Date().toISOString(),
          updatedAt:
            typeof goal.updatedAt === 'string'
              ? goal.updatedAt
              : new Date().toISOString(),
        }))
    : [];

  const reminders = Array.isArray(input.reminders)
    ? input.reminders
        .filter(isRecord)
        .map((reminder) => ({
          id:
            typeof reminder.id === 'string'
              ? reminder.id
              : crypto.randomUUID(),
          title:
            typeof reminder.title === 'string' ? reminder.title : 'Reminder',
          kind: isReminderKind(reminder.kind) ? reminder.kind : 'bill',
          categoryId: isCategoryId(reminder.categoryId)
            ? reminder.categoryId
            : undefined,
          dueDate:
            typeof reminder.dueDate === 'string' ? reminder.dueDate : undefined,
          threshold:
            reminder.threshold === undefined
              ? undefined
              : Math.max(0, toFiniteNumber(reminder.threshold)),
          amount:
            reminder.amount === undefined
              ? undefined
              : Math.max(0, toFiniteNumber(reminder.amount)),
          note: typeof reminder.note === 'string' ? reminder.note : '',
          active: reminder.active !== false,
          createdAt:
            typeof reminder.createdAt === 'string'
              ? reminder.createdAt
              : new Date().toISOString(),
          updatedAt:
            typeof reminder.updatedAt === 'string'
              ? reminder.updatedAt
              : new Date().toISOString(),
        }))
    : [];

  return {
    version: Math.max(1, Math.trunc(toFiniteNumber(input.version))),
    setupComplete: input.setupComplete !== false,
    profile: {
      fullName:
        typeof profile.fullName === 'string' ? profile.fullName : 'Workspace owner',
      email: typeof profile.email === 'string' ? profile.email : '',
      currency,
      monthlyIncome,
      theme,
      startedAt:
        typeof profile.startedAt === 'string'
          ? profile.startedAt
          : new Date().toISOString(),
    },
    budgets,
    transactions,
    goals,
    reminders,
  };
};

const getMonthKey = (value: string) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? new Date().toISOString().slice(0, 7)
    : parsed.toISOString().slice(0, 7);
};

const summarizeWorkspace = (workspace: WorkspaceState) => {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const transactionsThisMonth = workspace.transactions.filter(
    (transaction) => getMonthKey(transaction.occurredOn) === currentMonth,
  );
  const totalSpent = transactionsThisMonth.reduce(
    (sum, transaction) => sum + transaction.amount,
    0,
  );
  const totalBudget = workspace.budgets.reduce(
    (sum, budget) => sum + budget.limit,
    0,
  );
  const remainingIncome = workspace.profile.monthlyIncome - totalSpent;
  const savingsRate =
    workspace.profile.monthlyIncome > 0
      ? ((workspace.profile.monthlyIncome - totalSpent) /
          workspace.profile.monthlyIncome) *
        100
      : 0;

  const categorySpend = Object.fromEntries(
    categoryIds.map((categoryId) => [categoryId, 0]),
  ) as Record<CategoryId, number>;

  for (const transaction of transactionsThisMonth) {
    categorySpend[transaction.categoryId] += transaction.amount;
  }

  const budgetPressure = workspace.budgets
    .map((budget) => {
      const spent = categorySpend[budget.categoryId];
      const usage = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
      return {
        categoryId: budget.categoryId,
        limit: budget.limit,
        spent,
        remaining: budget.limit - spent,
        usage: Number(usage.toFixed(1)),
      };
    })
    .sort((left, right) => right.usage - left.usage)
    .slice(0, 6);

  const recentTransactions = [...workspace.transactions]
    .sort(
      (left, right) =>
        new Date(right.occurredOn).getTime() - new Date(left.occurredOn).getTime(),
    )
    .slice(0, 12)
    .map((transaction) => ({
      description: transaction.description,
      amount: transaction.amount,
      categoryId: transaction.categoryId,
      occurredOn: transaction.occurredOn,
      notes: transaction.notes,
    }));

  const goals = workspace.goals.map((goal) => ({
    name: goal.name,
    categoryId: goal.categoryId,
    targetAmount: goal.targetAmount,
    currentAmount: goal.currentAmount,
    targetDate: goal.targetDate,
    progress:
      goal.targetAmount > 0
        ? Number(((goal.currentAmount / goal.targetAmount) * 100).toFixed(1))
        : 0,
    notes: goal.notes,
  }));

  const reminders = workspace.reminders
    .filter((reminder) => reminder.active)
    .sort((left, right) => {
      const leftTime = left.dueDate ? new Date(left.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      const rightTime = right.dueDate ? new Date(right.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      return leftTime - rightTime;
    })
    .slice(0, 10)
    .map((reminder) => ({
      title: reminder.title,
      kind: reminder.kind,
      categoryId: reminder.categoryId,
      dueDate: reminder.dueDate,
      threshold: reminder.threshold,
      amount: reminder.amount,
      note: reminder.note,
    }));

  return {
    profile: {
      fullName: workspace.profile.fullName,
      currency: workspace.profile.currency,
      monthlyIncome: workspace.profile.monthlyIncome,
      startedAt: workspace.profile.startedAt,
    },
    metrics: {
      month: currentMonth,
      totalSpent,
      totalBudget,
      remainingIncome,
      savingsRate: Number(savingsRate.toFixed(1)),
      transactionCount: workspace.transactions.length,
      goalCount: workspace.goals.length,
      reminderCount: workspace.reminders.length,
    },
    budgetPressure,
    categorySpend,
    recentTransactions,
    goals,
    reminders,
  };
};

const buildPrompt = (mode: 'briefing' | 'chat', prompt: string, workspace: WorkspaceState) => {
  const summary = summarizeWorkspace(workspace);

  return `
You are "Smart Budgets Economist", an embedded AI financial advisor inside a personal finance workspace.

Your responsibilities:
- explain finances clearly and warmly
- act like a practical financial advisor, financial analyst, and budgeting assistant
- create helpful, user-friendly notices and app actions
- stay grounded in the supplied workspace data only

Rules:
- never claim to have fetched bank data, credit scores, taxes, or external records
- do not invent transactions, salaries, debts, bills, or account balances
- keep the tone trustworthy, calm, and empowering
- if data is thin, say what is missing
- propose at most 4 actions and only when they are clearly useful
- avoid duplicate goals or reminders that already exist
- use only these categories: ${categoryIds.join(', ')}
- use only these action kinds: ${actionKinds.join(', ')}
- use reminder kinds only from: ${reminderKinds.join(', ')}
- for create_goal include name, targetAmount, categoryId, currentAmount if useful, targetDate if known
- for create_reminder include reminderTitle, reminderKind, dueDate or threshold when applicable
- for upsert_budget include categoryId and limit
- for update_monthly_income include amount only if income truly needs correction
- for log_transaction include description, amount, categoryId, and notes only if the user explicitly asks to log or capture an item
- all money values must be non-negative numbers
- headline should be short and sharp
- message should feel like a concise executive briefing for one person
- notices should be phrased like friendly in-app alerts

Interaction mode: ${mode}
User request:
${prompt}

Workspace summary:
${JSON.stringify(summary, null, 2)}
`.trim();
};

const parseGeminiPayload = async (apiKey: string, prompt: string) => {
  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          responseMimeType: 'application/json',
          responseJsonSchema: advisorResponseSchema,
        },
      }),
    },
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Gemini request failed: ${response.status} ${detail}`);
  }

  const payload = await response.json();
  const text =
    payload?.candidates?.[0]?.content?.parts?.find(
      (part: { text?: string }) => typeof part?.text === 'string',
    )?.text ?? '';

  if (!text) {
    throw new Error('Gemini did not return structured advisor content.');
  }

  return JSON.parse(text) as Partial<AdvisorResponse>;
};

const sanitizeResponse = (input: Partial<AdvisorResponse>): AdvisorResponse => ({
  headline:
    typeof input.headline === 'string' && input.headline.trim()
      ? input.headline.trim()
      : fallbackResponse.headline,
  message:
    typeof input.message === 'string' && input.message.trim()
      ? input.message.trim()
      : fallbackResponse.message,
  insights: Array.isArray(input.insights)
    ? input.insights
        .filter(isRecord)
        .slice(0, 5)
        .map((insight) => ({
          title:
            typeof insight.title === 'string' && insight.title.trim()
              ? insight.title.trim()
              : 'Insight',
          detail:
            typeof insight.detail === 'string' && insight.detail.trim()
              ? insight.detail.trim()
              : 'No additional detail was returned.',
          tone:
            typeof insight.tone === 'string' &&
            advisorTones.includes(insight.tone as AdvisorTone)
              ? (insight.tone as AdvisorTone)
              : 'teal',
        }))
    : [],
  notices: Array.isArray(input.notices)
    ? input.notices
        .filter(isRecord)
        .slice(0, 3)
        .map((notice) => ({
          title:
            typeof notice.title === 'string' && notice.title.trim()
              ? notice.title.trim()
              : 'Notice',
          detail:
            typeof notice.detail === 'string' && notice.detail.trim()
              ? notice.detail.trim()
              : 'No additional detail was returned.',
          urgency:
            notice.urgency === 'high' ||
            notice.urgency === 'medium' ||
            notice.urgency === 'low'
              ? notice.urgency
              : 'low',
        }))
    : [],
  actions: Array.isArray(input.actions)
    ? input.actions
        .filter(isRecord)
        .slice(0, 4)
        .map((action) => ({
          id:
            typeof action.id === 'string' && action.id.trim()
              ? action.id.trim()
              : crypto.randomUUID(),
          kind:
            typeof action.kind === 'string' &&
            actionKinds.includes(action.kind as AdvisorActionKind)
              ? (action.kind as AdvisorActionKind)
              : 'create_goal',
          title:
            typeof action.title === 'string' && action.title.trim()
              ? action.title.trim()
              : 'Suggested action',
          rationale:
            typeof action.rationale === 'string' && action.rationale.trim()
              ? action.rationale.trim()
              : 'This recommendation supports the current workspace.',
          categoryId: isCategoryId(action.categoryId) ? action.categoryId : undefined,
          amount:
            action.amount === undefined
              ? undefined
              : Math.max(0, toFiniteNumber(action.amount)),
          limit:
            action.limit === undefined
              ? undefined
              : Math.max(0, toFiniteNumber(action.limit)),
          name: typeof action.name === 'string' ? action.name.trim() : undefined,
          targetAmount:
            action.targetAmount === undefined
              ? undefined
              : Math.max(0, toFiniteNumber(action.targetAmount)),
          currentAmount:
            action.currentAmount === undefined
              ? undefined
              : Math.max(0, toFiniteNumber(action.currentAmount)),
          targetDate:
            typeof action.targetDate === 'string' ? action.targetDate : undefined,
          dueDate: typeof action.dueDate === 'string' ? action.dueDate : undefined,
          threshold:
            action.threshold === undefined
              ? undefined
              : Math.max(0, toFiniteNumber(action.threshold)),
          reminderTitle:
            typeof action.reminderTitle === 'string'
              ? action.reminderTitle.trim()
              : undefined,
          description:
            typeof action.description === 'string'
              ? action.description.trim()
              : undefined,
          notes:
            typeof action.notes === 'string' ? action.notes.trim() : undefined,
          reminderKind: isReminderKind(action.reminderKind)
            ? action.reminderKind
            : undefined,
        }))
    : [],
});

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders,
    });
  }

  if (request.method !== 'POST') {
    return json(
      { error: 'Method not allowed.' },
      {
        status: 405,
      },
    );
  }

  const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

  if (!geminiApiKey) {
    return json(
      { error: 'GEMINI_API_KEY is not configured.' },
      {
        status: 500,
      },
    );
  }

  try {
    const body = await request.json();
    const mode = body?.mode === 'briefing' ? 'briefing' : 'chat';
    const prompt =
      typeof body?.prompt === 'string' && body.prompt.trim()
        ? body.prompt.trim().slice(0, 4000)
        : 'Review this workspace and suggest the highest-impact next steps.';
    const workspace = parseWorkspace(body?.workspace);

    if (!workspace) {
      return json(
        { error: 'A valid workspace payload is required.' },
        {
          status: 400,
        },
      );
    }

    const advisorPrompt = buildPrompt(mode, prompt, workspace);
    const response = await parseGeminiPayload(geminiApiKey, advisorPrompt);

    return json(sanitizeResponse(response));
  } catch (error) {
    console.error('ai-advisor failed', error);
    return json(fallbackResponse, { status: 200 });
  }
});
