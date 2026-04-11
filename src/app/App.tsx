import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useWorkspace } from '@/app/WorkspaceProvider';
import { AppShell } from '@/app/AppShell';
import { AppLoader, Button, NoticeBanner } from '@/ui/components';

const AuthPage = lazy(() => import('@/features/auth/AuthPage'));
const ConfirmSignupPage = lazy(
  () => import('@/features/auth/ConfirmSignupPage'),
);
const SetupPage = lazy(() => import('@/features/setup/SetupPage'));
const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage'));
const TransactionsPage = lazy(
  () => import('@/features/transactions/TransactionsPage'),
);
const BudgetsPage = lazy(() => import('@/features/budgets/BudgetsPage'));
const GoalsPage = lazy(() => import('@/features/goals/GoalsPage'));
const RemindersPage = lazy(
  () => import('@/features/reminders/RemindersPage'),
);
const InsightsPage = lazy(() => import('@/features/insights/InsightsPage'));
const AdvisorPage = lazy(() => import('@/features/advisor/AdvisorPage'));
const SettingsPage = lazy(() => import('@/features/settings/SettingsPage'));

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="app-loader">
          <div className="app-loader__orb" />
          <p>
            The workspace hit an unexpected rendering issue. Refresh to continue.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

const WorkspaceRecovery = () => {
  const {
    auth,
    actions,
  } = useWorkspace();

  return (
    <div className="app-loader">
      <div className="stack-md">
        <div className="app-loader__orb" />
        <div className="stack-sm">
          <h1>Workspace recovery needed</h1>
          <p>
            We confirmed your session, but the workspace could not be loaded safely.
          </p>
          {auth.syncError ? (
            <NoticeBanner tone="danger">{auth.syncError}</NoticeBanner>
          ) : null}
        </div>
        <div className="split-actions">
          <Button onClick={() => void actions.reloadWorkspace()}>
            Retry workspace load
          </Button>
          <Button tone="ghost" onClick={() => void actions.signOut()}>
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
};

const RoutedBoundary = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { auth, state } = useWorkspace();

  return (
    <AppErrorBoundary
      key={`${location.pathname}:${auth.user?.id ?? 'guest'}:${
        state.setupComplete ? 'ready' : 'setup'
      }:${auth.isWorkspaceReady ? 'workspace' : 'blocked'}`}
    >
      {children}
    </AppErrorBoundary>
  );
};

export const App = () => {
  const { auth, state } = useWorkspace();

  if (auth.isLoading) {
    return <AppLoader />;
  }

  if (auth.isAuthenticated && !auth.isWorkspaceReady) {
    return <WorkspaceRecovery />;
  }

  return (
    <BrowserRouter>
      <RoutedBoundary>
        <Suspense fallback={<AppLoader />}>
          <Routes>
            <Route path="/auth/confirm" element={<ConfirmSignupPage />} />
            {!auth.isConfigured || !auth.isAuthenticated ? (
              <Route path="*" element={<AuthPage />} />
            ) : !state.setupComplete ? (
              <Route path="*" element={<SetupPage />} />
            ) : (
              <>
                <Route element={<AppShell />}>
                  <Route index element={<DashboardPage />} />
                  <Route path="/transactions" element={<TransactionsPage />} />
                  <Route path="/budgets" element={<BudgetsPage />} />
                  <Route path="/goals" element={<GoalsPage />} />
                  <Route path="/reminders" element={<RemindersPage />} />
                  <Route path="/insights" element={<InsightsPage />} />
                  <Route path="/advisor" element={<AdvisorPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </>
            )}
          </Routes>
        </Suspense>
      </RoutedBoundary>
    </BrowserRouter>
  );
};
