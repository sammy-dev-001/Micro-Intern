import { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Container } from '../components/Container';
import { Button } from '../components/Button';
import { useAuth } from '../auth/AuthContext';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { cn } from '../lib/cn';
import type { UserType } from '../types';

type PendingGoogle = {
  google_id: string;
  email: string;
  name: string;
};

export function SignupComplete() {
  useDocumentTitle('Finish signing up — MicroIntern');
  const { completeGoogleSignup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const pending = (location.state as { pending?: PendingGoogle })?.pending;

  const [type, setType] = useState<UserType>('talent');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If nobody redirected here with pending Google data, send them to signup.
  if (!pending) {
    return <Navigate to="/signup" replace />;
  }

  async function onSubmit() {
    if (!pending) return;
    setSubmitting(true);
    setError(null);
    try {
      await completeGoogleSignup({ ...pending, type });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError((err as Error).message || 'Could not complete signup.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Container className="py-16 md:py-24">
      <div className="mx-auto w-full max-w-sm">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">
          One more step
        </h1>
        <p className="mt-2 text-sm text-ink/70">
          Signed in as <strong>{pending.email}</strong>. How will you use
          MicroIntern?
        </p>

        <fieldset className="mt-8 flex flex-col gap-2">
          <legend className="text-sm font-medium text-ink">I'm joining as</legend>
          <div className="grid grid-cols-2 gap-2">
            {(['talent', 'business'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                aria-pressed={type === t}
                className={cn(
                  'flex h-11 items-center justify-center rounded-md border text-sm font-semibold transition-colors',
                  type === t
                    ? 'border-brand bg-brand text-paper'
                    : 'border-chalk bg-paper text-ink hover:border-brand/40'
                )}
              >
                {t === 'talent' ? 'Talent' : 'Business'}
              </button>
            ))}
          </div>
        </fieldset>

        {error && (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <Button
          variant="primary"
          size="lg"
          onClick={onSubmit}
          disabled={submitting}
          className="mt-6 w-full"
        >
          {submitting ? 'Creating account…' : 'Finish signing up'}
        </Button>
      </div>
    </Container>
  );
}