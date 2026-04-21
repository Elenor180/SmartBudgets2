import React, { useEffect, useRef, useState } from 'react';
import { useWorkspace } from '@/app/WorkspaceProvider';
import type { Profile } from '@/domain/models';
import { currencies, themeModes } from '@/domain/models';
import { deserializeWorkspace, serializeWorkspace } from '@/lib/storage';
import {
  Button,
  Card,
  FieldMessage,
  NoticeBanner,
  PageHeader,
  SectionHeader,
} from '@/ui/components';

const createSettingsFormState = (profile: Profile) => ({
  fullName: profile.fullName,
  currency: profile.currency,
  monthlyIncome: String(profile.monthlyIncome),
});

const parseMonthlyIncome = (value: string) => {
  if (!value.trim()) {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const SettingsPage = () => {
  const { state, auth, actions } = useWorkspace();
  const [form, setForm] = useState(() => createSettingsFormState(state.profile));
  const [fieldErrors, setFieldErrors] = useState<{
    fullName?: string;
    monthlyIncome?: string;
  }>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const syncedProfileRef = useRef(createSettingsFormState(state.profile));

  useEffect(() => {
    const nextForm = createSettingsFormState(state.profile);

    setForm((current) => {
      const isDirty =
        current.fullName !== syncedProfileRef.current.fullName ||
        current.currency !== syncedProfileRef.current.currency ||
        current.monthlyIncome !== syncedProfileRef.current.monthlyIncome;

      syncedProfileRef.current = nextForm;
      return isDirty ? current : nextForm;
    });
  }, [
    state.profile.currency,
    state.profile.fullName,
    state.profile.monthlyIncome,
  ]);

  const hasChanges =
    form.fullName !== state.profile.fullName ||
    form.currency !== state.profile.currency ||
    form.monthlyIncome !== String(state.profile.monthlyIncome);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextFieldErrors: {
      fullName?: string;
      monthlyIncome?: string;
    } = {};
    const parsedMonthlyIncome = parseMonthlyIncome(form.monthlyIncome);

    if (form.fullName.trim() && form.fullName.trim().length < 2) {
      nextFieldErrors.fullName =
        'Use at least 2 characters or leave this blank to use Workspace Owner.';
    }

    if (parsedMonthlyIncome === null) {
      nextFieldErrors.monthlyIncome = 'Enter a valid monthly income amount.';
    } else if (parsedMonthlyIncome < 0) {
      nextFieldErrors.monthlyIncome = 'Monthly income cannot be negative.';
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    setFieldErrors({});
    await actions.updateProfile({
      fullName: form.fullName.trim() || 'Workspace Owner',
      currency: form.currency,
      monthlyIncome: parsedMonthlyIncome ?? 0,
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
    const nextForm = createSettingsFormState(imported.profile);
    syncedProfileRef.current = nextForm;
    setForm(nextForm);
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
            description="Update the core identity and income values here. Category baselines and savings targets stay editable from the Budgets screen."
          />
          <form className="stack-md" onSubmit={handleSave}>
            <label className="field">
              <span>Full name</span>
              <input
                className="input"
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
                aria-invalid={Boolean(fieldErrors.fullName)}
                aria-describedby={
                  fieldErrors.fullName
                    ? 'settings-full-name-error'
                    : 'settings-full-name-help'
                }
              />
              {fieldErrors.fullName ? (
                <FieldMessage id="settings-full-name-error" tone="danger">
                  {fieldErrors.fullName}
                </FieldMessage>
              ) : (
                <FieldMessage id="settings-full-name-help">
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

            <div className="form-grid form-grid--tight">
              <label className="field">
                <span>Currency</span>
                <select
                  className="select"
                  value={form.currency}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      currency: event.target.value as typeof current.currency,
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

              <label className="field">
                <span>Monthly income</span>
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.monthlyIncome}
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
                  aria-invalid={Boolean(fieldErrors.monthlyIncome)}
                  aria-describedby={
                    fieldErrors.monthlyIncome
                      ? 'settings-monthly-income-error'
                      : 'settings-monthly-income-help'
                  }
                />
                {fieldErrors.monthlyIncome ? (
                  <FieldMessage id="settings-monthly-income-error" tone="danger">
                    {fieldErrors.monthlyIncome}
                  </FieldMessage>
                ) : (
                  <FieldMessage id="settings-monthly-income-help">
                    Keep this at 0 until you are ready to track live income values.
                  </FieldMessage>
                )}
              </label>
            </div>

            <Button type="submit" disabled={auth.isSaving || !hasChanges}>
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
                disabled={auth.isSaving}
                onClick={() => void actions.setTheme(option)}
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
