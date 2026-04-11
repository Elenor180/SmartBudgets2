import React, { useEffect, useRef, useState } from 'react';
import { useWorkspace } from '@/app/WorkspaceProvider';
import { currencies, themeModes } from '@/domain/models';
import { deserializeWorkspace, serializeWorkspace } from '@/lib/storage';
import { Button, Card, NoticeBanner, PageHeader, SectionHeader } from '@/ui/components';

const SettingsPage = () => {
  const { state, auth, actions } = useWorkspace();
  const [fullName, setFullName] = useState(state.profile.fullName);
  const [currency, setCurrency] = useState(state.profile.currency);
  const [monthlyIncome, setMonthlyIncome] = useState(
    String(state.profile.monthlyIncome),
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setFullName(state.profile.fullName);
    setCurrency(state.profile.currency);
    setMonthlyIncome(String(state.profile.monthlyIncome));
  }, [state.profile]);

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    void actions.updateProfile({
      fullName: fullName.trim(),
      currency,
      monthlyIncome: Number(monthlyIncome) || 0,
    });
  };

  const handleExport = () => {
    const blob = new Blob([serializeWorkspace(state)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'smart-budgets-workspace.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const raw = await file.text();
    const imported = deserializeWorkspace(raw);
    await actions.replaceWorkspace(imported);
    event.target.value = '';
  };

  return (
    <div className="page">
      <PageHeader
        eyebrow="Settings"
        title="Control the workspace contract"
        description="Profile, onboarding values, theme, account access, and import/export all map back to the Supabase workspace contract."
      />

      {auth.notice ? <NoticeBanner tone="success">{auth.notice}</NoticeBanner> : null}
      {auth.syncError ? <NoticeBanner tone="danger">{auth.syncError}</NoticeBanner> : null}

      <section className="two-column">
        <Card>
          <SectionHeader
            title="Profile and onboarding"
            description="Update the same core values that shape the customer workspace after login."
          />
          <form className="stack-md" onSubmit={handleSave}>
            <label className="field">
              <span>Full name</span>
              <input
                className="input"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
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

            <div className="form-grid form-grid--tight">
              <label className="field">
                <span>Currency</span>
                <select
                  className="select"
                  value={currency}
                  onChange={(event) =>
                    setCurrency(event.target.value as typeof currency)
                  }
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
                  step="0.01"
                  value={monthlyIncome}
                  onChange={(event) => setMonthlyIncome(event.target.value)}
                />
              </label>
            </div>

            <Button type="submit" disabled={auth.isSaving}>
              Save profile
            </Button>
          </form>
        </Card>

        <Card>
          <SectionHeader
            title="Theme"
            description="Theme is persisted with the workspace and applied globally."
          />
          <div className="theme-picker">
            {themeModes.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={option === state.profile.theme}
                className={
                  option === state.profile.theme
                    ? 'theme-chip theme-chip--active'
                    : 'theme-chip'
                }
                onClick={() => actions.setTheme(option)}
              >
                {option === 'light' ? 'Light workspace' : 'Dark workspace'}
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <SectionHeader
            title="Account"
            description="This workspace is tied to your authenticated Supabase user."
          />
          <div className="stack-md">
            <div className="stack-xs">
              <strong>{auth.user?.email || 'No signed-in user'}</strong>
              <span className="meta-copy">
                {auth.isSaving ? 'Syncing your latest changes...' : 'Remote sync is active.'}
              </span>
            </div>
            <Button tone="ghost" onClick={() => void actions.signOut()}>
              Sign out
            </Button>
          </div>
        </Card>

        <Card>
          <SectionHeader
            title="Workspace data"
            description="Export and import the full workspace contract as JSON."
          />
          <div className="split-actions">
            <Button tone="secondary" onClick={handleExport}>
              Export data
            </Button>
            <Button tone="ghost" onClick={() => fileInputRef.current?.click()}>
              Import data
            </Button>
            <input
              ref={fileInputRef}
              hidden
              type="file"
              accept="application/json"
              onChange={handleImport}
            />
          </div>
        </Card>

        <Card className="danger-zone">
          <SectionHeader
            title="Workspace reset"
            description="Use these actions carefully. They replace the current local state."
          />
          <div className="split-actions">
            <Button tone="secondary" onClick={() => void actions.loadSampleWorkspace()}>
              Load sample data
            </Button>
            <Button
              tone="danger"
              onClick={() => {
                if (!window.confirm('Reset the workspace and clear current data?')) {
                  return;
                }

                void actions.resetWorkspace();
              }}
            >
              Reset workspace
            </Button>
          </div>
        </Card>
      </section>
    </div>
  );
};

export default SettingsPage;
