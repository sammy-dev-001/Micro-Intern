import { useState, type SubmitEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Container } from '../components/Container';
import { Button } from '../components/Button';
import { FormField } from '../components/FormField';
import { useAuth } from '../auth/AuthContext';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { cn } from '../lib/cn';
import type { UserType } from '../types';

export function Signup() {
  useDocumentTitle('Sign up — MicroIntern');
  const { register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get('redirect') ?? '/dashboard';
  const initialType = params.get('type') === 'business' ? 'business' : 'talent';

  const [type, setType] = useState<UserType>(initialType);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setSubmitting(true);
    try {
      await register({ name: name.trim(), email: email.trim(), password, type });
      navigate(redirect, { replace: true });
    } catch (err) {
      setError((err as Error).message || 'Could not create your account.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Container className="py-16 md:py-24">
      <div className="mx-auto w-full max-w-sm">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">
          Create your account
        </h1>
        <p className="mt-2 text-sm text-ink/70">
          Already have one?{' '}
          <Link
            to={`/login${redirect !== '/dashboard' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
            className="font-semibold text-brand underline-offset-4 hover:underline"
          >
            Log in
          </Link>
        </p>

        <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4" noValidate>
          {/* Role selector */}
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium text-ink">
              I'm signing up as
            </legend>
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

          <FormField
            label={type === 'business' ? 'Your name' : 'Full name'}
            name="name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <FormField
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="flex flex-col gap-1.5">
            <FormField
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="self-end text-xs font-medium text-ink/60 hover:text-ink"
            >
              {showPassword ? 'Hide password' : 'Show password'}
            </button>
            <p className="text-xs text-ink/50">At least 6 characters.</p>
          </div>

          {error && (
            <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={submitting}
            className="mt-2 w-full"
          >
            {submitting ? 'Creating account…' : 'Create account'}
          </Button>
        </form>
      </div>
    </Container>
  );
}