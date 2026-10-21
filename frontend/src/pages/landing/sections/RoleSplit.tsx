import { Link } from 'react-router-dom';
import { Container } from '../../../components/Container';
import { Button } from '../../../components/Button';
import { cn } from '../../../lib/cn';
import { useReveal } from '../../../lib/useReveal';

type Role = {
  id: 'talent' | 'business';
  eyebrow: string;
  headline: string;
  bullets: string[];
  cta: { label: string; to: string };
  tone: 'paper' | 'chalk';
};

const roles: Role[] = [
  {
    id: 'talent',
    eyebrow: 'For Talent',
    headline: 'Turn your skills into a record you can point to.',
    bullets: [
      'Real tasks from real businesses — no "portfolio" theatre.',
      'Paid from escrow the moment work is approved.',
      'Every finished task verifies a skill on your public profile.',
    ],
    cta: { label: 'Start as Talent', to: '/signup?type=talent' },
    tone: 'chalk',
  },
  {
    id: 'business',
    eyebrow: 'For Business',
    headline: 'Hire for the work, not the CV.',
    bullets: [
      'Post a short task and fund escrow in one step.',
      'Review deliverables against an automated check before you approve.',
      'Release payment and get a verifiable record of what was done.',
    ],
    cta: { label: 'Post a Task', to: '/signup?type=business' },
    tone: 'paper',
  },
];

export function RoleSplit() {
    const ref = useReveal<HTMLElement>();
    
  return (
    <section
     ref={ref}
      data-reveal
      id="for-talent"
      aria-labelledby="role-split-heading"
      className="section"
    >
      <Container>
        <h2 id="role-split-heading" className="sr-only">
          Choose your role
        </h2>

        <div className="grid overflow-hidden rounded-lg border border-chalk md:grid-cols-2">
          {roles.map((role) => (
            <RoleColumn key={role.id} role={role} />
          ))}
        </div>
      </Container>
    </section>
  );
}

function RoleColumn({ role }: { role: Role }) {
  return (
    <div
      id={role.id === 'business' ? 'for-business' : undefined}
      className={cn(
        'flex flex-col gap-8 p-10 md:p-14',
        role.tone === 'chalk' ? 'bg-chalk/50' : 'bg-paper'
      )}
    >
      <div className="flex flex-col gap-4">
        <span className="label-utility text-brand/70">{role.eyebrow}</span>
        <h3 className="max-w-md text-2xl font-extrabold leading-tight tracking-tight text-ink md:text-3xl">
          {role.headline}
        </h3>
      </div>

      <ul className="flex flex-col gap-3">
        {role.bullets.map((b) => (
          <li key={b} className="flex items-start gap-3 text-sm leading-relaxed text-ink/75">
            <CheckIcon />
            <span>{b}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-2">
        <Link to={role.cta.to}>
          <Button
            variant={role.id === 'talent' ? 'primary' : 'secondary'}
            size="lg"
            className="w-full sm:w-auto"
          >
            {role.cta.label}
          </Button>
        </Link>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      aria-hidden="true"
      fill="none"
      className="mt-0.5 shrink-0 text-verified"
    >
      <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M5.5 9.2 L8 11.7 L12.5 7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}