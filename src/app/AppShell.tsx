import React from 'react';
import {
  BarChart3,
  BellRing,
  BrainCircuit,
  CircleDollarSign,
  Flag,
  Home,
  LayoutGrid,
  Settings,
  Sparkle,
} from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { useWorkspace } from '@/app/WorkspaceProvider';
import { getUpcomingReminders } from '@/domain/selectors';
import { getMonthLabel } from '@/lib/format';
import { Button, NoticeBanner, Tag } from '@/ui/components';

interface NavigationItem {
  to: string;
  label: string;
  icon: typeof Home;
  end?: boolean;
}

const navigation: readonly NavigationItem[] = [
  { to: '/', label: 'Overview', icon: Home, end: true },
  { to: '/transactions', label: 'Transactions', icon: CircleDollarSign },
  { to: '/budgets', label: 'Budgets', icon: LayoutGrid },
  { to: '/goals', label: 'Goals', icon: Flag },
  { to: '/reminders', label: 'Reminders', icon: BellRing },
  { to: '/insights', label: 'Insights', icon: Sparkle },
  { to: '/advisor', label: 'Economist', icon: BrainCircuit },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export const AppShell = () => {
  const {
    auth,
    state: { profile, reminders },
    actions,
  } = useWorkspace();

  const upcomingCount = getUpcomingReminders(reminders).length;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar__brand">
          <span className="eyebrow">Smart Budgets</span>
          <strong>Finance workspace</strong>
          <p>Built for calm control, clearer spending, and better planning.</p>
        </div>

        <nav className="sidebar__nav" aria-label="Primary">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  isActive ? 'nav-link nav-link--active' : 'nav-link'
                }
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar__profile">
          <span className="sidebar__profile-badge">
            {profile.fullName.slice(0, 1) || 'S'}
          </span>
          <div className="stack-xs">
            <strong>{profile.fullName || 'New workspace'}</strong>
            <span>{getMonthLabel(new Date().toISOString().slice(0, 7))}</span>
          </div>
        </div>
      </aside>

      <div className="app-frame">
        <header className="topbar">
          <div className="stack-xs">
            <span className="eyebrow">Supabase workspace</span>
            <h1>Workspace</h1>
          </div>
          <div className="topbar__meta">
            <Tag tone={auth.syncError ? 'rose' : auth.isSaving ? 'amber' : 'teal'}>
              {auth.syncError ? 'Sync issue' : auth.isSaving ? 'Syncing' : 'Synced'}
            </Tag>
            <span>{profile.currency}</span>
            <span>{upcomingCount} upcoming reminders</span>
            <span>{auth.user?.email || profile.email}</span>
            <Button tone="ghost" onClick={() => void actions.signOut()}>
              Sign out
            </Button>
            <BarChart3 size={18} />
          </div>
        </header>

        <main className="app-main">
          {auth.syncError ? (
            <NoticeBanner tone="danger">{auth.syncError}</NoticeBanner>
          ) : null}
          <Outlet />
        </main>

        <nav className="mobile-nav" aria-label="Mobile">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  isActive ? 'mobile-nav__link mobile-nav__link--active' : 'mobile-nav__link'
                }
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
