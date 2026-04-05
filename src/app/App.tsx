import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useWorkspace } from '@/app/WorkspaceProvider';
import { AppShell } from '@/app/AppShell';
import { AppLoader } from '@/ui/components';

const AuthPage = lazy(() => import('@/features/auth/AuthPage'));
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

export const App = () => {
  const { auth, state } = useWorkspace();

  if (auth.isLoading) {
    return <AppLoader />;
  }

  return (
    <AppErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<AppLoader />}>
          <Routes>
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
      </BrowserRouter>
    </AppErrorBoundary>
  );
};
