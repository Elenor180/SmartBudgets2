import React, { useState } from 'react';
import { KeyRound, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { useWorkspace } from '@/app/WorkspaceProvider';
import { Button, Card, FieldMessage, NoticeBanner } from '@/ui/components';

const emailPattern = /\S+@\S+\.\S+/;
const strongPasswordPattern =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{10,}$/;

const AuthPage = () => {
  const { auth, actions } = useWorkspace();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
  }>({});
  const normalizedEmail = email.trim();
  const showResendConfirmation =
    mode === 'signin' &&
    Boolean(normalizedEmail) &&
    /confirm/i.test(auth.syncError ?? '');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (auth.isLoading) {
      return;
    }

    const nextFieldErrors: {
      fullName?: string;
      email?: string;
      password?: string;
    } = {};

    if (!emailPattern.test(normalizedEmail)) {
      nextFieldErrors.email = 'Enter a valid email address.';
    }

    if (!password.trim()) {
      nextFieldErrors.password = 'Enter your password.';
    } else if (mode === 'signup' && !strongPasswordPattern.test(password)) {
      nextFieldErrors.password =
        'Use at least 10 characters with uppercase, lowercase, number, and symbol.';
    }

    if (mode === 'signup' && fullName.trim() && fullName.trim().length < 2) {
      nextFieldErrors.fullName =
        'Use at least 2 characters or leave this blank to use Workspace Owner.';
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    setFieldErrors({});

    if (mode === 'signup') {
      await actions.signUp({
        fullName: fullName.trim() || 'Workspace Owner',
        email: normalizedEmail,
        password,
      });
      return;
    }

    await actions.signIn({
      email: normalizedEmail,
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
              onClick={() => {
                setMode('signin');
                setFieldErrors({});
              }}
              aria-pressed={mode === 'signin'}
            >
              Sign in
            </button>
            <button
              type="button"
              className={mode === 'signup' ? 'theme-chip theme-chip--active' : 'theme-chip'}
              onClick={() => {
                setMode('signup');
                setFieldErrors({});
              }}
              aria-pressed={mode === 'signup'}
            >
              Create account
            </button>
          </div>

          {auth.notice ? <NoticeBanner tone="success">{auth.notice}</NoticeBanner> : null}
          {auth.syncError ? <NoticeBanner tone="danger">{auth.syncError}</NoticeBanner> : null}
          {mode === 'signup' ? (
            <NoticeBanner>
              Use a real email address you can access. This project requires email
              confirmation before password sign-in is allowed.
            </NoticeBanner>
          ) : (
            <NoticeBanner>
              If the user was created manually in Supabase, sign in here and finish
              setup inside the app.
            </NoticeBanner>
          )}
        </div>

        <form className="stack-md" onSubmit={handleSubmit} noValidate>
          {mode === 'signup' ? (
            <label className="field">
              <span>Full name</span>
              <div className="field-input">
                <UserRound size={16} />
                <input
                  className="input input--bare"
                  value={fullName}
                  onChange={(event) => {
                    setFullName(event.target.value);
                    setFieldErrors((current) => ({
                      ...current,
                      fullName: undefined,
                    }));
                  }}
                  placeholder="Randy Coster"
                  autoComplete="name"
                  aria-invalid={Boolean(fieldErrors.fullName)}
                  aria-describedby={
                    fieldErrors.fullName ? 'auth-full-name-error' : 'auth-full-name-help'
                  }
                />
              </div>
              {fieldErrors.fullName ? (
                <FieldMessage id="auth-full-name-error" tone="danger">
                  {fieldErrors.fullName}
                </FieldMessage>
              ) : (
                <FieldMessage id="auth-full-name-help">
                  Optional. Leave this blank to use Workspace Owner.
                </FieldMessage>
              )}
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
                onChange={(event) => {
                  setEmail(event.target.value);
                  setFieldErrors((current) => ({
                    ...current,
                    email: undefined,
                  }));
                }}
                placeholder="you@example.com"
                autoComplete="email"
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? 'auth-email-error' : undefined}
              />
            </div>
            {fieldErrors.email ? (
              <FieldMessage id="auth-email-error" tone="danger">
                {fieldErrors.email}
              </FieldMessage>
            ) : null}
          </label>

          <label className="field">
            <span>Password</span>
            <div className="field-input">
              <KeyRound size={16} />
              <input
                className="input input--bare"
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setFieldErrors((current) => ({
                    ...current,
                    password: undefined,
                  }));
                }}
                placeholder={
                  mode === 'signup'
                    ? 'Use 10+ characters and a symbol'
                    : 'Enter your password'
                }
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={
                  fieldErrors.password
                    ? 'auth-password-error'
                    : mode === 'signup'
                      ? 'auth-password-help'
                      : undefined
                }
              />
            </div>
            {fieldErrors.password ? (
              <FieldMessage id="auth-password-error" tone="danger">
                {fieldErrors.password}
              </FieldMessage>
            ) : mode === 'signup' ? (
              <FieldMessage id="auth-password-help">
                Use at least 10 characters with uppercase, lowercase, number,
                and symbol.
              </FieldMessage>
            ) : null}
          </label>

          <Button type="submit" disabled={auth.isLoading}>
            {auth.isLoading
              ? 'Working...'
              : mode === 'signup'
                ? 'Create secure account'
                : 'Sign in to workspace'}
          </Button>

          {showResendConfirmation ? (
            <Button
              type="button"
              tone="secondary"
              disabled={auth.isLoading}
              onClick={() => void actions.resendConfirmation(normalizedEmail)}
            >
              Resend confirmation email
            </Button>
          ) : null}
        </form>
      </Card>
    </div>
  );
};

export default AuthPage;
