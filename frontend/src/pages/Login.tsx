import { useState, type SubmitEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Container } from '../components/Container';
import { Button } from '../components/Button';
import { FormField } from '../components/FormField';
import { useAuth } from '../auth/AuthContext';
import { useDocumentTitle } from '../lib/useDocumentTitle';

export function Login() {
  useDocumentTitle('Log in — MicroIntern');
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get('redirect') ?? '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      navigate(redirect, { replace: true });
    } catch (err) {
      setError((err as Error).message || 'Could not log in.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Container className="py-16 md:py-24">
      <div className="mx-auto w-full max-w-sm">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">
          Log in
        </h1>
        <p className="mt-2 text-sm text-ink/70">
          New here?{' '}
          <Link
            to={`/signup${redirect !== '/dashboard' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
            className="font-semibold text-brand underline-offset-4 hover:underline"
          >
            Create an account
          </Link>
        </p>

        <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4" noValidate>
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
              autoComplete="current-password"
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
            {submitting ? 'Logging in…' : 'Log in'}
          </Button>
        </form>
      </div>
    </Container>
  );
}