import { useState, type SubmitEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/Button';
import { FormField } from '../../components/FormField';
import { GoogleButton } from '../../components/GoogleButton';
import type { WizardState } from '../../auth/SignupWizard';

type Props = {
  state: WizardState;
  update: <K extends keyof WizardState>(key: K, value: WizardState[K]) => void;
  onNext: () => void;
  onGoogle: (credential: string) => void;
  error: string | null;
  redirectTo: string;
};

export function StepIdentity({
  state,
  update,
  onNext,
  onGoogle,
  error,
  redirectTo,
}: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  function onSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setLocalError(null);
    if (state.name.trim().length < 2) {
      setLocalError('Enter your name (at least 2 characters).');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(state.email)) {
      setLocalError('Enter a valid email address.');
      return;
    }
    if (state.password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }
    onNext();
  }

  const shown = localError ?? error;

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight text-ink md:text-4xl">
        Create your account
      </h1>
      <p className="mt-3 text-base text-ink/70">
        Already have one?{' '}
        <Link
          to={`/login${
            redirectTo !== '/dashboard'
              ? `?redirect=${encodeURIComponent(redirectTo)}`
              : ''
          }`}
          className="font-semibold text-brand underline-offset-4 hover:underline"
        >
          Log in
        </Link>
      </p>

      <div className="mt-8">
        <GoogleButton onCredential={onGoogle} text="signup_with" />
      </div>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-chalk" />
        <span className="text-xs uppercase tracking-wider text-ink/50">
          or with email
        </span>
        <span className="h-px flex-1 bg-chalk" />
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
        <FormField
          label="Full name"
          name="name"
          autoComplete="name"
          value={state.name}
          onChange={(e) => update('name', e.target.value)}
          required
        />
        <FormField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={state.email}
          onChange={(e) => update('email', e.target.value)}
          required
        />
        <div>
          <FormField
            label="Password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={state.password}
            onChange={(e) => update('password', e.target.value)}
            required
            hint="At least 6 characters."
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="mt-1 self-end text-sm font-medium text-ink/60 hover:text-ink"
          >
            {showPassword ? 'Hide password' : 'Show password'}
          </button>
        </div>

        {shown && (
          <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {shown}
          </p>
        )}

        <Button type="submit" variant="primary" size="lg" className="mt-2 w-full">
          Continue
        </Button>
      </form>
    </div>
  );
}