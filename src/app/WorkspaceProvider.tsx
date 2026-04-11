import React, {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useEffectEvent,
  useReducer,
  useRef,
  useState,
} from 'react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import {
  createEmptyWorkspace,
  createSampleWorkspace,
  WORKSPACE_SCHEMA_VERSION,
} from '@/domain/defaults';
import type {
  CategoryId,
  Goal,
  Profile,
  Reminder,
  SetupPayload,
  ThemeMode,
  Transaction,
  WorkspaceAuthState,
  WorkspaceContextValue,
  WorkspaceState,
} from '@/domain/models';
import { isSupabaseConfigured } from '@/integrations/supabase/client';
import {
  getAuthUser,
  getCurrentSession,
  loadWorkspaceForUser,
  onAuthStateChange,
  replaceWorkspaceSnapshot,
  resendSignUpConfirmation,
  signInWithPassword,
  signOutFromSupabase,
  signUpWithPassword,
} from '@/integrations/supabase/workspaceRepository';
import { createWorkspaceFromSetup, normalizeWorkspace } from '@/lib/storage';
import { toErrorMessage } from '@/lib/errors';

type WorkspaceAction =
  | { type: 'hydrateWorkspace'; payload: WorkspaceState }
  | {
      type: 'completeSetup';
      payload: { profile: SetupPayload; seedSample: boolean };
    }
  | { type: 'updateProfile'; payload: Partial<Profile> }
  | { type: 'setTheme'; payload: ThemeMode }
  | { type: 'upsertBudget'; payload: { categoryId: CategoryId; limit: number } }
  | {
      type: 'addTransaction';
      payload: Omit<Transaction, 'id' | 'createdAt'>;
    }
  | { type: 'removeBudget'; payload: { categoryId: CategoryId } }
  | { type: 'deleteTransaction'; payload: { transactionId: string } }
  | {
      type: 'addGoal';
      payload: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>;
    }
  | { type: 'contributeToGoal'; payload: { goalId: string; contribution: number } }
  | { type: 'deleteGoal'; payload: { goalId: string } }
  | {
      type: 'addReminder';
      payload: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>;
    }
  | { type: 'toggleReminder'; payload: { reminderId: string } }
  | { type: 'deleteReminder'; payload: { reminderId: string } };

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

const now = () => new Date().toISOString();

const isEmailNotConfirmedError = (error: unknown) => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code =
    'code' in error && typeof error.code === 'string' ? error.code : null;
  const message =
    'message' in error && typeof error.message === 'string'
      ? error.message
      : null;

  return (
    code === 'email_not_confirmed' ||
    Boolean(message && /email not confirmed/i.test(message))
  );
};

const createId = (prefix: string) => {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return `${prefix}-${random}`;
};

const reduceWorkspaceState = (
  state: WorkspaceState,
  action: WorkspaceAction,
): WorkspaceState => {
  switch (action.type) {
    case 'hydrateWorkspace':
      return normalizeWorkspace({
        ...action.payload,
        version: WORKSPACE_SCHEMA_VERSION,
      });
    case 'completeSetup':
      return createWorkspaceFromSetup(
        action.payload.profile,
        action.payload.seedSample,
      );
    case 'updateProfile':
      return {
        ...state,
        profile: {
          ...state.profile,
          ...action.payload,
        },
      };
    case 'setTheme':
      return {
        ...state,
        profile: {
          ...state.profile,
          theme: action.payload,
        },
      };
    case 'upsertBudget': {
      const timestamp = now();
      const existing = state.budgets.find(
        (budget) => budget.categoryId === action.payload.categoryId,
      );

      if (existing) {
        return {
          ...state,
          budgets: state.budgets.map((budget) =>
            budget.categoryId === action.payload.categoryId
              ? {
                  ...budget,
                  limit: action.payload.limit,
                  updatedAt: timestamp,
                }
              : budget,
          ),
        };
      }

      return {
        ...state,
        budgets: [
          ...state.budgets,
          {
            id: createId('budget'),
            categoryId: action.payload.categoryId,
            limit: action.payload.limit,
            createdAt: timestamp,
            updatedAt: timestamp,
          },
        ],
      };
    }
    case 'removeBudget':
      return {
        ...state,
        budgets: state.budgets.filter(
          (budget) => budget.categoryId !== action.payload.categoryId,
        ),
      };
    case 'addTransaction':
      return {
        ...state,
        transactions: [
          {
            ...action.payload,
            id: createId('transaction'),
            createdAt: now(),
          },
          ...state.transactions,
        ],
      };
    case 'deleteTransaction':
      return {
        ...state,
        transactions: state.transactions.filter(
          (transaction) => transaction.id !== action.payload.transactionId,
        ),
      };
    case 'addGoal': {
      const timestamp = now();
      return {
        ...state,
        goals: [
          {
            ...action.payload,
            id: createId('goal'),
            createdAt: timestamp,
            updatedAt: timestamp,
          },
          ...state.goals,
        ],
      };
    }
    case 'contributeToGoal':
      return {
        ...state,
        goals: state.goals.map((goal) =>
          goal.id === action.payload.goalId
            ? {
                ...goal,
                currentAmount: Math.min(
                  goal.targetAmount,
                  Math.max(0, goal.currentAmount + action.payload.contribution),
                ),
                updatedAt: now(),
              }
            : goal,
        ),
      };
    case 'deleteGoal':
      return {
        ...state,
        goals: state.goals.filter((goal) => goal.id !== action.payload.goalId),
      };
    case 'addReminder': {
      const timestamp = now();
      return {
        ...state,
        reminders: [
          {
            ...action.payload,
            id: createId('reminder'),
            createdAt: timestamp,
            updatedAt: timestamp,
          },
          ...state.reminders,
        ],
      };
    }
    case 'toggleReminder':
      return {
        ...state,
        reminders: state.reminders.map((reminder) =>
          reminder.id === action.payload.reminderId
            ? {
                ...reminder,
                active: !reminder.active,
                updatedAt: now(),
              }
            : reminder,
        ),
      };
    case 'deleteReminder':
      return {
        ...state,
        reminders: state.reminders.filter(
          (reminder) => reminder.id !== action.payload.reminderId,
        ),
      };
    default:
      return state;
  }
};

const initialAuthState: WorkspaceAuthState = {
  user: null,
  isAuthenticated: false,
  isConfigured: isSupabaseConfigured,
  isLoading: isSupabaseConfigured,
  isWorkspaceReady: false,
  isSaving: false,
  syncError: null,
  notice: null,
};

export const WorkspaceProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [state, dispatch] = useReducer(
    reduceWorkspaceState,
    undefined,
    createEmptyWorkspace,
  );
  const [auth, setAuth] = useState(initialAuthState);
  const stateRef = useRef(state);
  const authRef = useRef(auth);
  const saveQueueRef = useRef(Promise.resolve());
  const authEventTimeoutsRef = useRef(new Set<number>());
  const workspaceLoadIdRef = useRef(0);
  const loadedWorkspaceUserIdRef = useRef<string | null>(null);
  const inFlightWorkspaceUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    authRef.current = auth;
  }, [auth]);

  const applyTheme = useEffectEvent((theme: ThemeMode) => {
    document.documentElement.dataset.theme = theme;
  });

  useEffect(() => {
    applyTheme(state.profile.theme);
  }, [applyTheme, state.profile.theme]);

  const syncWorkspace = useEffectEvent((nextState: WorkspaceState) => {
    if (!authRef.current.isAuthenticated) {
      return Promise.resolve();
    }

    setAuth((current) => ({
      ...current,
      isSaving: true,
      syncError: null,
    }));

    saveQueueRef.current = saveQueueRef.current
      .catch(() => undefined)
      .then(() => replaceWorkspaceSnapshot(nextState))
      .then(() => {
        setAuth((current) => ({
          ...current,
          isSaving: false,
        }));
      })
      .catch((error) => {
        setAuth((current) => ({
          ...current,
          isSaving: false,
          syncError: toErrorMessage(
            error,
            'Unable to sync your workspace to Supabase.',
          ),
        }));
      });

    return saveQueueRef.current;
  });

  const commit = (action: WorkspaceAction) => {
    const nextState = reduceWorkspaceState(stateRef.current, action);
    stateRef.current = nextState;
    dispatch(action);
    return syncWorkspace(nextState);
  };

  const applyWorkspace = (nextState: WorkspaceState) => {
    const normalized = normalizeWorkspace({
      ...nextState,
      version: WORKSPACE_SCHEMA_VERSION,
      profile: {
        ...nextState.profile,
        email: authRef.current.user?.email ?? nextState.profile.email,
      },
    });

    stateRef.current = normalized;
    dispatch({ type: 'hydrateWorkspace', payload: normalized });
    return syncWorkspace(normalized);
  };

  const buildResetWorkspace = () => {
    const base = createEmptyWorkspace();

    return {
      ...base,
      profile: {
        ...base.profile,
        fullName: stateRef.current.profile.fullName,
        email: authRef.current.user?.email ?? stateRef.current.profile.email,
        theme: stateRef.current.profile.theme,
      },
    };
  };

  const hydrateWorkspaceFromSession = useEffectEvent(
    async (
      session: Session | null,
      options?: {
        force?: boolean;
        source?: 'initial' | 'manual' | AuthChangeEvent;
      },
    ) => {
      const loadId = workspaceLoadIdRef.current + 1;
      workspaceLoadIdRef.current = loadId;

      const isCurrentLoad = () => workspaceLoadIdRef.current === loadId;

      const applySignedOutState = () => {
        loadedWorkspaceUserIdRef.current = null;
        inFlightWorkspaceUserIdRef.current = null;
        const emptyWorkspace = createEmptyWorkspace();
        stateRef.current = emptyWorkspace;
        dispatch({ type: 'hydrateWorkspace', payload: emptyWorkspace });
        setAuth((current) => ({
          ...current,
          user: null,
          isAuthenticated: false,
          isConfigured: true,
          isLoading: false,
          isWorkspaceReady: false,
          isSaving: false,
          syncError: null,
        }));
      };

      if (!isSupabaseConfigured) {
        setAuth((current) => ({
          ...current,
          isConfigured: false,
          isLoading: false,
        }));
        return;
      }

      const user = getAuthUser(session);

      if (!session?.user || !user) {
        if (isCurrentLoad()) {
          applySignedOutState();
        }
        return;
      }

      const shouldReuseCurrentWorkspace =
        options?.force !== true &&
        authRef.current.isWorkspaceReady &&
        loadedWorkspaceUserIdRef.current === user.id;

      if (shouldReuseCurrentWorkspace) {
        setAuth((current) => ({
          ...current,
          user,
          isAuthenticated: true,
          isConfigured: true,
          isLoading: false,
          isWorkspaceReady: true,
          syncError: null,
        }));
        return;
      }

      const duplicateLoadAlreadyInFlight =
        options?.force !== true && inFlightWorkspaceUserIdRef.current === user.id;

      if (duplicateLoadAlreadyInFlight) {
        return;
      }

      setAuth((current) => ({
        ...current,
        user,
        isAuthenticated: true,
        isConfigured: true,
        isLoading: true,
        isWorkspaceReady: false,
        syncError: null,
      }));
      inFlightWorkspaceUserIdRef.current = user.id;

      try {
        const workspace = await loadWorkspaceForUser(session.user);

        if (!isCurrentLoad()) {
          return;
        }

        stateRef.current = workspace;
        dispatch({ type: 'hydrateWorkspace', payload: workspace });
        loadedWorkspaceUserIdRef.current = user.id;
        inFlightWorkspaceUserIdRef.current = null;
        setAuth((current) => ({
          ...current,
          user,
          isAuthenticated: true,
          isConfigured: true,
          isLoading: false,
          isWorkspaceReady: true,
          syncError: null,
        }));
      } catch (error) {
        if (!isCurrentLoad()) {
          return;
        }

        loadedWorkspaceUserIdRef.current = null;
        inFlightWorkspaceUserIdRef.current = null;
        const message = toErrorMessage(
          error,
          'Unable to load your workspace from Supabase.',
        );

        setAuth((current) => ({
          ...current,
          user,
          isAuthenticated: true,
          isConfigured: true,
          isLoading: false,
          isWorkspaceReady: false,
          syncError: message,
        }));
      }
    },
  );

  const loadInitialSession = useEffectEvent(async () => {
    const force = false;

    if (!isSupabaseConfigured) {
      setAuth((current) => ({
        ...current,
        isConfigured: false,
        isLoading: false,
      }));
      return;
    }

    try {
      const session = await getCurrentSession();
      await hydrateWorkspaceFromSession(session, {
        force,
        source: 'initial',
      });
    } catch (error) {
      const message = toErrorMessage(
        error,
        'Unable to load your workspace from Supabase.',
      );

      setAuth((current) => ({
        ...current,
        isLoading: false,
        isWorkspaceReady: false,
        syncError: message,
      }));
    }
  });

  useEffect(() => {
    void loadInitialSession();

    const subscription = onAuthStateChange((event, session) => {
      const timeoutId = window.setTimeout(() => {
        authEventTimeoutsRef.current.delete(timeoutId);
        const shouldForce =
          event === 'SIGNED_OUT' || event === 'USER_UPDATED';

        void hydrateWorkspaceFromSession(session, {
          force: shouldForce,
          source: event,
        });
      }, 0);

      authEventTimeoutsRef.current.add(timeoutId);
    });

    return () => {
      workspaceLoadIdRef.current += 1;
      authEventTimeoutsRef.current.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
      authEventTimeoutsRef.current.clear();
      subscription?.unsubscribe();
    };
  }, []);

  const value: WorkspaceContextValue = {
    state,
    auth,
    actions: {
      signIn: async (payload) => {
        setAuth((current) => ({
          ...current,
          isLoading: true,
          isWorkspaceReady: false,
          notice: null,
          syncError: null,
        }));

        try {
          await signInWithPassword(payload);
        } catch (error) {
          const message = isEmailNotConfirmedError(error)
            ? 'This account exists, but the email address has not been confirmed yet. Check your inbox for the verification link, or resend the confirmation email below.'
            : toErrorMessage(
                error,
                'Unable to sign in with those credentials.',
              );

          setAuth((current) => ({
            ...current,
            isLoading: false,
            isWorkspaceReady: false,
            syncError: message,
          }));
        }
      },
      signUp: async (payload) => {
        setAuth((current) => ({
          ...current,
          isLoading: true,
          isWorkspaceReady: false,
          notice: null,
          syncError: null,
        }));

        try {
          const result = await signUpWithPassword(payload);

          setAuth((current) => ({
            ...current,
            isLoading: false,
            isWorkspaceReady: false,
            notice: result.needsEmailConfirmation
              ? 'Account created. Check your inbox to confirm your email, then sign in.'
              : 'Account created. Finish your workspace setup below.',
          }));
        } catch (error) {
          setAuth((current) => ({
            ...current,
            isLoading: false,
            isWorkspaceReady: false,
            syncError: toErrorMessage(
              error,
              'Unable to create your account right now.',
            ),
          }));
        }
      },
      resendConfirmation: async (email) => {
        setAuth((current) => ({
          ...current,
          isLoading: true,
          syncError: null,
          notice: null,
        }));

        try {
          await resendSignUpConfirmation(email);
          setAuth((current) => ({
            ...current,
            isLoading: false,
            notice:
              'Confirmation email sent again. Open the message in your inbox, verify the account, then sign in.',
          }));
        } catch (error) {
          setAuth((current) => ({
            ...current,
            isLoading: false,
            syncError: toErrorMessage(
              error,
              'Unable to resend the confirmation email right now.',
            ),
          }));
        }
      },
      reloadWorkspace: async () => {
        setAuth((current) => ({
          ...current,
          isLoading: true,
          syncError: null,
        }));

        const session = await getCurrentSession();
        await hydrateWorkspaceFromSession(session, {
          force: true,
          source: 'manual',
        });
      },
      signOut: async () => {
        setAuth((current) => ({
          ...current,
          isLoading: true,
          isWorkspaceReady: false,
          syncError: null,
        }));

        try {
          await signOutFromSupabase();
        } catch (error) {
          setAuth((current) => ({
            ...current,
            isLoading: false,
            isWorkspaceReady: false,
            syncError: toErrorMessage(
              error,
              'Unable to sign out right now.',
            ),
          }));
        }
      },
      clearNotice: () => {
        setAuth((current) => ({
          ...current,
          notice: null,
        }));
      },
      completeSetup: async (payload, seedSample) => {
        const nextState = createWorkspaceFromSetup(
          {
            ...payload,
            email: authRef.current.user?.email ?? payload.email,
          },
          seedSample,
        );

        startTransition(() => {
          void applyWorkspace(nextState);
        });
      },
      updateProfile: async (payload) => {
        await commit({
          type: 'updateProfile',
          payload: {
            ...payload,
            email: authRef.current.user?.email ?? stateRef.current.profile.email,
          },
        });
      },
      setTheme: async (theme) => {
        await commit({ type: 'setTheme', payload: theme });
      },
      upsertBudget: async (payload) => {
        await commit({ type: 'upsertBudget', payload });
      },
      removeBudget: async (categoryId) => {
        await commit({ type: 'removeBudget', payload: { categoryId } });
      },
      addTransaction: async (payload) => {
        await commit({ type: 'addTransaction', payload });
      },
      deleteTransaction: async (transactionId) => {
        await commit({ type: 'deleteTransaction', payload: { transactionId } });
      },
      addGoal: async (payload) => {
        await commit({ type: 'addGoal', payload });
      },
      contributeToGoal: async (goalId, contribution) => {
        await commit({
          type: 'contributeToGoal',
          payload: { goalId, contribution },
        });
      },
      deleteGoal: async (goalId) => {
        await commit({ type: 'deleteGoal', payload: { goalId } });
      },
      addReminder: async (payload) => {
        await commit({ type: 'addReminder', payload });
      },
      toggleReminder: async (reminderId) => {
        await commit({ type: 'toggleReminder', payload: { reminderId } });
      },
      deleteReminder: async (reminderId) => {
        await commit({ type: 'deleteReminder', payload: { reminderId } });
      },
      replaceWorkspace: async (payload) => {
        await applyWorkspace(payload);
      },
      resetWorkspace: async () => {
        await applyWorkspace(buildResetWorkspace());
      },
      loadSampleWorkspace: async () => {
        await applyWorkspace(
          createSampleWorkspace({
            fullName: stateRef.current.profile.fullName || 'Workspace Owner',
            email: authRef.current.user?.email ?? stateRef.current.profile.email,
            currency: stateRef.current.profile.currency,
            monthlyIncome: stateRef.current.profile.monthlyIncome,
            theme: stateRef.current.profile.theme,
          }),
        );
      },
    },
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);

  if (!context) {
    throw new Error('useWorkspace must be used within WorkspaceProvider.');
  }

  return context;
};
