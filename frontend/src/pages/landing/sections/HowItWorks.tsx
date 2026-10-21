import { Container } from '../../../components/Container';
import { SectionHeading } from '../../../components/SectionHeading';
import { cn } from '../../../lib/cn';
import { useReveal } from '../../../lib/useReveal';
type Step = {
  key: string;
  label: string;
  description: string;
  final?: boolean;
};

const steps: Step[] = [
  {
    key: 'funded',
    label: 'Funded',
    description: 'The business pays the full task budget into escrow before anyone applies.',
  },
  {
    key: 'assigned',
    label: 'Assigned',
    description: 'One talent is selected. The money stays locked — nobody can touch it yet.',
  },
  {
    key: 'submitted',
    label: 'Submitted',
    description: 'The talent delivers the work. The business has a fixed window to review it.',
  },
  {
    key: 'approved',
    label: 'Approved',
    description: 'The business signs off. If they don\u2019t respond, escrow releases automatically.',
  },
  {
    key: 'released',
    label: 'Released',
    description: 'The talent gets paid, and the skill is verified on their public profile.',
    final: true,
  },
];

export function HowItWorks() {
    const ref = useReveal<HTMLElement>();

  return (
    <section
     ref={ref}
      data-reveal
      id="how-it-works"
      aria-labelledby="how-it-works-heading"
      className="section bg-paper"
    >
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <SectionHeading
            eyebrow="How it works"
            title={
              <span id="how-it-works-heading">
                Money moves through escrow, not promises.
              </span>
            }
            subline="Every task follows the same five steps. The budget is real before work starts, and traceable until it lands."
            align="center"
          />
        </div>

        <div className="mt-16">
          <HorizontalLedger />
          <VerticalLedger />
        </div>
      </Container>
    </section>
  );
}

/**
 * Desktop ledger — horizontal stepper with connector lines.
 * Hidden below lg where the vertical version takes over.
 */
function HorizontalLedger() {
  return (
    <ol
      className="hidden lg:grid lg:grid-cols-5 lg:gap-0"
      aria-label="Escrow lifecycle"
    >
      {steps.map((step, i) => (
        <li key={step.key} className="relative flex flex-col items-center px-4 text-center">
          {/* Left connector — skip on first node */}
          {i > 0 && (
            <span
              aria-hidden="true"
              className="absolute left-0 top-5 h-px w-1/2 -translate-y-1/2 bg-chalk"
            />
          )}
          {/* Right connector — skip on last node */}
          {i < steps.length - 1 && (
            <span
              aria-hidden="true"
              className="absolute right-0 top-5 h-px w-1/2 -translate-y-1/2 bg-chalk"
            />
          )}

          {/* Node */}
          <span
            className={cn(
              'relative z-10 flex h-10 w-10 items-center justify-center rounded-full',
              'text-sm font-bold tabular',
              step.final
                ? 'bg-verified text-paper'
                : 'bg-brand text-paper'
            )}
          >
            {i + 1}
          </span>

          {/* Label */}
          <span className="mt-4 text-sm font-bold tracking-tight text-ink">
            {step.label}
          </span>

          {/* Description */}
          <span className="mt-2 text-xs leading-relaxed text-ink/60">
            {step.description}
          </span>
        </li>
      ))}
    </ol>
  );
}

/**
 * Mobile / tablet ledger — vertical stepper with a left spine.
 * Visible below lg.
 */
function VerticalLedger() {
  return (
    <ol
      className="flex flex-col gap-6 lg:hidden"
      aria-label="Escrow lifecycle"
    >
      {steps.map((step, i) => (
        <li key={step.key} className="relative flex gap-4">
          {/* Spine — vertical line, skipping last node's tail */}
          {i < steps.length - 1 && (
            <span
              aria-hidden="true"
              className="absolute left-5 top-10 h-[calc(100%-2.5rem+1.5rem)] w-px bg-chalk"
            />
          )}

          {/* Node */}
          <span
            className={cn(
              'relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
              'text-sm font-bold tabular',
              step.final
                ? 'bg-verified text-paper'
                : 'bg-brand text-paper'
            )}
          >
            {i + 1}
          </span>

          {/* Text */}
          <div className="pt-1">
            <p className="text-sm font-bold tracking-tight text-ink">
              {step.label}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-ink/65">
              {step.description}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}