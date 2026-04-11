import React, { useEffect, useState } from 'react';
import { ArrowRight, ChartColumnBig, ShieldCheck, Sparkles } from 'lucide-react';
import { useWorkspace } from '@/app/WorkspaceProvider';
import { currencies, themeModes } from '@/domain/models';
import { Button, Card, NoticeBanner } from '@/ui/components';

const SetupPage = () => {
  const { state, auth, actions } = useWorkspace();
  const [fullName, setFullName] = useState(state.profile.fullName);
  const [currency, setCurrency] = useState(state.profile.currency);
  const [monthlyIncome, setMonthlyIncome] = useState(
    String(state.profile.monthlyIncome),
  );
  const [theme, setTheme] = useState(state.profile.theme);

  useEffect(() => {
    setFullName(state.profile.fullName);
    setCurrency(state.profile.currency);
    setMonthlyIncome(String(state.profile.monthlyIncome));
    setTheme(state.profile.theme);
  }, [state.profile]);

  const payload = {
    fullName: fullName.trim() || 'Workspace Owner',
    email: auth.user?.email || state.profile.email,
    currency,
    monthlyIncome: Number(monthlyIncome) || 0,
    theme,
  } as const;

  return (
    <div className="setup-page">
      <div className="setup-page__panel">
        <div className="stack-md">
          <span className="eyebrow">Production-grade redesign</span>
          <h1>Start with a clean finance workspace and shape it as you go.</h1>
          <p className="page-description">
            This onboarding is designed for both self-created accounts and users
            provisioned manually in Supabase. Start at zero, then update your
            profile, budgets, and goals when you are ready.
          </p>
        </div>

        <div className="setup-highlights">
          <Card className="setup-highlight">
            <Sparkles size={24} />
            <div className="stack-xs">
              <strong>Zero-state onboarding</strong>
              <p>Start clean at zero or load sample data for quick testing.</p>
            </div>
          </Card>
          <Card className="setup-highlight">
            <ShieldCheck size={24} />
            <div className="stack-xs">
              <strong>Editable later</strong>
              <p>Your profile and workspace values can still be updated after setup.</p>
            </div>
          </Card>
          <Card className="setup-highlight">
            <ChartColumnBig size={24} />
            <div className="stack-xs">
              <strong>Insight-ready design</strong>
              <p>Once real values are added, the dashboards and AI can reflect them.</p>
            </div>
          </Card>
        </div>
      </div>

      <Card className="setup-page__form">
        <div className="section-header">
          <div className="stack-xs">
            <h2>Configure your workspace</h2>
            <p>These settings complete the customer profile stored in Supabase.</p>
          </div>
        </div>

        {auth.notice ? <NoticeBanner tone="success">{auth.notice}</NoticeBanner> : null}
        {auth.syncError ? <NoticeBanner tone="danger">{auth.syncError}</NoticeBanner> : null}

        <div className="form-grid">
          <label className="field">
            <span>Full name</span>
            <input
              className="input"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Randy Coster"
            />
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
              value={currency}
              onChange={(event) => setCurrency(event.target.value as typeof currency)}
            >
              {currencies.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Monthly income</span>
            <input
              className="input"
              type="number"
              min="0"
              value={monthlyIncome}
              onChange={(event) => setMonthlyIncome(event.target.value)}
            />
          </label>
        </div>

        <div className="theme-picker">
          {themeModes.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={option === theme}
              className={
                option === theme
                  ? 'theme-chip theme-chip--active'
                  : 'theme-chip'
              }
              onClick={() => setTheme(option)}
            >
              {option === 'light' ? 'Light workspace' : 'Dark workspace'}
            </button>
          ))}
        </div>

        <div className="split-actions">
          <Button
            disabled={auth.isSaving}
            onClick={() => void actions.completeSetup(payload, false)}
          >
            Start clean workspace
            <ArrowRight size={16} />
          </Button>
          <Button
            tone="secondary"
            disabled={auth.isSaving}
            onClick={() => void actions.completeSetup(payload, true)}
          >
            Load example data
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default SetupPage;
