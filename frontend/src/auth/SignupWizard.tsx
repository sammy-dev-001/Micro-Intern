import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Container } from '../components/Container';
import type { UserType } from '../types';
import { StepIdentity } from '../pages/signup/StepIdentity';
import { StepRole } from '../pages/signup/StepRole';
import { StepProfile } from '../pages/signup/StepProfile';

export type WizardState = {
  // Step 1 — identity
  name: string;
  email: string;
  password: string;
  // Step 2 — role
  type: UserType;
  // Step 3 — profile
  university: string;
  course: string;
  year_of_study: string;
  bio: string;
  skills: string[];
  company_name: string;
  industry: string;
  company_size: string;
  website: string;
  // Mode
  googlePending: string | null;
};

const initialState: WizardState = {
  name: '',
  email: '',
  password: '',
  type: 'talent',
  university: '',
  course: '',
  year_of_study: '',
  bio: '',
  skills: [],
  company_name: '',
  industry: '',
  company_size: '',
  website: '',
  googlePending: null,
};

type Step = 1 | 2 | 3;

type SignupWizardProps = {
  redirectTo: string;
  /** When provided, the wizard skips step 1 and starts at step 2 in "Google mode". */
  googlePending?: string;
};

export function SignupWizard({ redirectTo, googlePending }: SignupWizardProps) {
  const { register, completeGoogleSignup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>(googlePending ? 2 : 1);
  const [state, setState] = useState<WizardState>({
    ...initialState,
    googlePending: googlePending ?? null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof WizardState>(key: K, value: WizardState[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }

  async function handleGoogleCredential(credential: string) {
    setError(null);
    try {
      const res = await loginWithGoogle(credential);
      if ('needs_role' in res) {
        setState((s) => ({ ...s, googlePending: res.pending }));
        setStep(2);
      } else {
        navigate(redirectTo, { replace: true });
      }
    } catch (err) {
      setError((err as Error).message || 'Google sign-in failed.');
    }
  }

  async function handleFinish() {
    setError(null);
    setSubmitting(true);
    try {
      if (state.googlePending) {
        await completeGoogleSignup({
          pending: state.googlePending,
          type: state.type,
        });
      } else {
        await register({
          name: state.name.trim(),
          email: state.email.trim(),
          password: state.password,
          type: state.type,
          ...(state.type === 'talent'
            ? {
                university: state.university || undefined,
                course: state.course || undefined,
                year_of_study: state.year_of_study
                  ? Number(state.year_of_study)
                  : undefined,
                bio: state.bio || undefined,
                skills: state.skills.length ? state.skills : undefined,
              }
            : {
                company_name: state.company_name || undefined,
                industry: state.industry || undefined,
                company_size: state.company_size || undefined,
                website: state.website || undefined,
              }),
        });
      }
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError((err as Error).message || 'Could not create your account.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Container className="py-12 md:py-20">
      <div className="mx-auto w-full max-w-lg">
        <StepIndicator current={step} total={3} />
        <div className="mt-8">
          {step === 1 && (
            <StepIdentity
              state={state}
              update={update}
              onNext={() => setStep(2)}
              onGoogle={handleGoogleCredential}
              error={error}
              redirectTo={redirectTo}
            />
          )}
          {step === 2 && (
            <StepRole
              state={state}
              update={update}
              onNext={() => setStep(3)}
              onBack={state.googlePending ? undefined : () => setStep(1)}
              error={error}
            />
          )}
          {step === 3 && (
            <StepProfile
              state={state}
              update={update}
              onFinish={handleFinish}
              onBack={() => setStep(2)}
              submitting={submitting}
              error={error}
            />
          )}
        </div>
      </div>
    </Container>
  );
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold uppercase tracking-wider text-ink/60">
        Step {current} of {total}
      </p>
      <div className="flex gap-2">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={
              i < current
                ? 'h-1.5 flex-1 rounded-full bg-brand'
                : 'h-1.5 flex-1 rounded-full bg-chalk'
            }
          />
        ))}
      </div>
    </div>
  );
}