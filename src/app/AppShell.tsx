import React, { useEffect, useState } from 'react';
import {
  BellRing,
  BrainCircuit,
  CircleDollarSign,
  Flag,
  Home,
  LayoutGrid,
  Menu,
  Settings,
  Sparkle,
  X,
} from 'lucide-react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
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

const mobilePrimaryRoutes = new Set(['/', '/transactions', '/budgets', '/goals']);

const getIsRouteActive = (item: NavigationItem, pathname: string) =>
  item.end ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`);

const getActiveDescription = (label: string) => {
  switch (label) {
    case 'Overview':
      return 'A quick read on your spending rhythm and where to act first.';
    case 'Transactions':
      return 'Capture expenses cleanly so insights and budgets stay accurate.';
    case 'Budgets':
      return 'Set category limits and monitor pressure before overspending.';
    case 'Goals':
      return 'Move your savings targets forward with consistent contributions.';
    case 'Reminders':
      return 'Keep upcoming dates and thresholds visible at the right time.';
    case 'Insights':
      return 'Review actionable financial signals generated from your workspace.';
    case 'Economist':
      return 'Ask your AI advisor for focused next-step recommendations.';
    case 'Settings':
      return 'Tune profile, theme, and workspace behavior for your workflow.';
    default:
      return 'Track finances with less friction and clearer decisions.';
  }
};

export const AppShell = () => {
  const location = useLocation();
  const {
    auth,
    state: { profile, reminders },
    actions,
  } = useWorkspace();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const upcomingCount = getUpcomingReminders(reminders).length;
  const activeNavigation =
    navigation.find((item) => getIsRouteActive(item, location.pathname)) ?? navigation[0]!;
  const mobilePrimaryNavigation = navigation.filter((item) =>
    mobilePrimaryRoutes.has(item.to),
  );
  const mobileOverflowNavigation = navigation.filter(
    (item) => !mobilePrimaryRoutes.has(item.to),
  );

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

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
          <div className="topbar__heading stack-xs">
            <span className="eyebrow">Supabase workspace</span>
            <h1>{activeNavigation.label}</h1>
            <p className="topbar__description">
              {getActiveDescription(activeNavigation.label)}
            </p>
          </div>
          <div className="topbar__actions">
            <Tag tone={auth.syncError ? 'rose' : auth.isSaving ? 'amber' : 'teal'}>
              {auth.syncError ? 'Sync issue' : auth.isSaving ? 'Syncing' : 'Synced'}
            </Tag>
            <Tag tone="sky">{profile.currency}</Tag>
            <Tag tone={upcomingCount > 0 ? 'amber' : 'slate'}>
              {upcomingCount} reminders
            </Tag>
            <span className="topbar__email">{auth.user?.email || profile.email}</span>
            <Button className="topbar__signout" tone="ghost" onClick={() => void actions.signOut()}>
              Sign out
            </Button>
            <Button
              className="topbar__mobile-toggle"
              tone="ghost"
              type="button"
              aria-controls="mobile-overflow-nav"
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen((current) => !current)}
            >
              {isMobileMenuOpen ? 'Close' : 'More'}
              {isMobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
            </Button>
          </div>
        </header>

        <main className="app-main">
          {auth.syncError ? (
            <NoticeBanner tone="danger">{auth.syncError}</NoticeBanner>
          ) : null}
          <Outlet />
        </main>

        <nav
          id="mobile-overflow-nav"
          className={
            isMobileMenuOpen
              ? 'mobile-overflow-nav mobile-overflow-nav--open'
              : 'mobile-overflow-nav'
          }
          aria-label="More pages"
        >
          {mobileOverflowNavigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  isActive
                    ? 'mobile-overflow-nav__link mobile-overflow-nav__link--active'
                    : 'mobile-overflow-nav__link'
                }
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
          <Button tone="ghost" type="button" onClick={() => void actions.signOut()}>
            Sign out
          </Button>
        </nav>

        <nav className="mobile-nav" aria-label="Mobile">
          {mobilePrimaryNavigation.map((item) => {
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
