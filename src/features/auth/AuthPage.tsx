import React, { useState } from 'react';
import { KeyRound, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { useWorkspace } from '@/app/WorkspaceProvider';
import { Button, Card, NoticeBanner } from '@/ui/components';

const AuthPage = () => {
  const { auth, actions } = useWorkspace();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      return;
    }

    if (mode === 'signup') {
      await actions.signUp({
        fullName: fullName.trim() || 'Workspace Owner',
        email: email.trim(),
        password,
      });
      return;
    }

    await actions.signIn({
      email: email.trim(),
      password,
    });
  };

  if (!auth.isConfigured) {
    return (
      <div className="auth-page">
        <div className="auth-page__panel">
          <div className="stack-md">
            <span className="eyebrow">Supabase required</span>
            <h1>Finish the project environment before authentication can start.</h1>
            <p className="page-description">
              Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to your local
              environment, then reload the app.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-page__panel">
        <div className="stack-md">
          <span className="eyebrow">Supabase foundation</span>
          <h1>Secure sign-in for each customer workspace.</h1>
          <p className="page-description">
            Authentication, customer profile creation, and finance records are now
            designed around Supabase Auth plus row-level security.
          </p>
        </div>

        <div className="setup-highlights">
          <Card className="setup-highlight">
            <ShieldCheck size={24} />
            <div className="stack-xs">
              <strong>Scoped records</strong>
              <p>Each customer only reads and writes their own finance data.</p>
            </div>
          </Card>
          <Card className="setup-highlight">
            <Mail size={24} />
            <div className="stack-xs">
              <strong>Email and password auth</strong>
              <p>Supabase handles sessions while the app keeps the UX focused.</p>
            </div>
          </Card>
          <Card className="setup-highlight">
            <KeyRound size={24} />
            <div className="stack-xs">
              <strong>Database-backed workspace</strong>
              <p>Profiles, budgets, goals, reminders, and transactions sync remotely.</p>
            </div>
          </Card>
        </div>
      </div>

      <Card className="auth-page__form">
        <div className="stack-md">
          <div className="auth-toggle">
            <button
              type="button"
              className={mode === 'signin' ? 'theme-chip theme-chip--active' : 'theme-chip'}
              onClick={() => setMode('signin')}
            >
              Sign in
            </button>
            <button
              type="button"
              className={mode === 'signup' ? 'theme-chip theme-chip--active' : 'theme-chip'}
              onClick={() => setMode('signup')}
            >
              Create account
            </button>
          </div>

          {auth.notice ? <NoticeBanner tone="success">{auth.notice}</NoticeBanner> : null}
          {auth.syncError ? <NoticeBanner tone="danger">{auth.syncError}</NoticeBanner> : null}
        </div>

        <form className="stack-md" onSubmit={handleSubmit}>
          {mode === 'signup' ? (
            <label className="field">
              <span>Full name</span>
              <div className="field-input">
                <UserRound size={16} />
                <input
                  className="input input--bare"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Randy Coster"
                />
              </div>
            </label>
          ) : null}

          <label className="field">
            <span>Email</span>
            <div className="field-input">
              <Mail size={16} />
              <input
                className="input input--bare"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
              />
            </div>
          </label>

          <label className="field">
            <span>Password</span>
            <div className="field-input">
              <KeyRound size={16} />
              <input
                className="input input--bare"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 6 characters"
              />
            </div>
          </label>

          <Button type="submit" disabled={auth.isLoading}>
            {auth.isLoading
              ? 'Working...'
              : mode === 'signup'
                ? 'Create secure account'
                : 'Sign in to workspace'}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default AuthPage;
