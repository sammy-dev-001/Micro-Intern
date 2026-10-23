import { Button } from '../../components/Button';
import { cn } from '../../lib/cn';
import type { WizardState } from '../../auth/SignupWizard';
import type { UserType } from '../../types';

type Props = {
  state: WizardState;
  update: <K extends keyof WizardState>(key: K, value: WizardState[K]) => void;
  onNext: () => void;
  onBack?: () => void;
  error: string | null;
};

const options: {
  value: UserType;
  title: string;
  description: string;
}[] = [
  {
    value: 'talent',
    title: 'I want to find work',
    description:
      'Complete tasks, get paid from escrow, and build a public record of verified skills.',
  },
  {
    value: 'business',
    title: 'I want to hire talent',
    description:
      'Post short paid tasks, fund escrow in one step, and approve deliverables before payment releases.',
  },
];

export function StepRole({ state, update, onNext, onBack, error }: Props) {
  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight text-ink md:text-4xl">
        How will you use MicroIntern?
      </h1>
      <p className="mt-3 text-base text-ink/70">
        You can't change this later, so pick the one that fits.
      </p>

      <div className="mt-8 flex flex-col gap-3">
        {options.map((opt) => {
          const active = state.type === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => update('type', opt.value)}
              aria-pressed={active}
              className={cn(
                'flex flex-col gap-2 rounded-lg border-2 p-6 text-left transition-colors',
                active
                  ? 'border-brand bg-brand/5'
                  : 'border-chalk bg-paper hover:border-brand/40'
              )}
            >
              <span className="text-lg font-bold tracking-tight text-ink">
                {opt.title}
              </span>
              <span className="text-base text-ink/70">{opt.description}</span>
            </button>
          );
        })}
      </div>

      {error && (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        {onBack ? (
          <Button variant="ghost" size="lg" onClick={onBack} type="button">
            Back
          </Button>
        ) : (
          <span />
        )}
        <Button variant="primary" size="lg" onClick={onNext} type="button">
          Continue
        </Button>
      </div>
    </div>
  );
}