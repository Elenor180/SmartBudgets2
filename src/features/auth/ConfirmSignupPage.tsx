import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Loader2, MailWarning, ShieldCheck } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getSupabaseClient, isSupabaseConfigured } from '@/integrations/supabase/client';
import { toErrorMessage } from '@/lib/errors';
import { Button, Card, NoticeBanner } from '@/ui/components';

type ConfirmationStatus = 'loading' | 'success' | 'error';
type VerifyOtpType = 'email' | 'invite' | 'recovery' | 'email_change';

const validOtpTypes = new Set<VerifyOtpType>([
  'email',
  'invite',
  'recovery',
  'email_change',
]);

const ConfirmSignupPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<ConfirmationStatus>('loading');
  const [message, setMessage] = useState(
    'Confirming your account and preparing your workspace...',
  );
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setStatus('error');
      setMessage(
        'Supabase is not configured in this environment, so the confirmation link cannot be completed here.',
      );
      return;
    }

    if (hasStartedRef.current) {
      return;
    }

    hasStartedRef.current = true;

    const tokenHash = searchParams.get('token_hash');
    const rawType = searchParams.get('type') ?? 'email';
    const type: VerifyOtpType = validOtpTypes.has(rawType as VerifyOtpType)
      ? (rawType as VerifyOtpType)
      : 'email';

    if (!tokenHash) {
      setStatus('error');
      setMessage(
        'This confirmation link is missing its verification token. Request a new confirmation email and try again.',
      );
      return;
    }

    void getSupabaseClient()
      .auth.verifyOtp({
        token_hash: tokenHash,
        type,
      })
      .then(({ error }) => {
        if (error) {
          throw error;
        }

        setStatus('success');
        setMessage(
          'Your email is confirmed. Redirecting you back into Smart Budgets now...',
        );

        window.setTimeout(() => {
          navigate('/', { replace: true });
        }, 1200);
      })
      .catch((error) => {
        setStatus('error');
        setMessage(
          toErrorMessage(
            error,
            'That confirmation link could not be completed. Request a new email and try again.',
          ),
        );
      });
  }, [navigate, searchParams]);

  return (
    <div className="auth-page">
      <div className="auth-page__panel">
        <div className="stack-md">
          <span className="eyebrow">Smart Budgets</span>
          <h1>Secure your workspace</h1>
          <p className="page-description">
            We use email verification to protect customer records before budget,
            goal, reminder, and AI features are unlocked.
          </p>
        </div>

        <div className="setup-highlights">
          <Card className="setup-highlight">
            <ShieldCheck size={24} />
            <div className="stack-xs">
              <strong>Protected access</strong>
              <p>Your finance workspace only opens after the account is verified.</p>
            </div>
          </Card>
          <Card className="setup-highlight">
            <CheckCircle2 size={24} />
            <div className="stack-xs">
              <strong>One secure step</strong>
              <p>Once confirmed, you can continue directly into setup or sign-in.</p>
            </div>
          </Card>
        </div>
      </div>

      <Card className="auth-page__form">
        <div className="stack-md">
          {status === 'loading' ? (
            <>
              <div className="list-row__meta">
                <Loader2 size={18} className="spin" />
                <strong>Confirming your email</strong>
              </div>
              <NoticeBanner>{message}</NoticeBanner>
            </>
          ) : null}

          {status === 'success' ? (
            <>
              <div className="list-row__meta">
                <CheckCircle2 size={18} />
                <strong>Email confirmed</strong>
              </div>
              <NoticeBanner tone="success">{message}</NoticeBanner>
              <Button onClick={() => navigate('/', { replace: true })}>
                Continue to Smart Budgets
              </Button>
            </>
          ) : null}

          {status === 'error' ? (
            <>
              <div className="list-row__meta">
                <MailWarning size={18} />
                <strong>Confirmation could not be completed</strong>
              </div>
              <NoticeBanner tone="danger">{message}</NoticeBanner>
              <Link to="/" className="button button--secondary">
                Return to the workspace entry
              </Link>
            </>
          ) : null}
        </div>
      </Card>
    </div>
  );
};

export default ConfirmSignupPage;
