import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

type SectionHeadingProps = {
  eyebrow?: string;
  title: ReactNode;
  subline?: ReactNode;
  align?: 'left' | 'center';
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  subline,
  align = 'left',
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3',
        align === 'center' && 'items-center text-center',
        className
      )}
    >
      {eyebrow && (
        <span className="text-xs font-semibold uppercase tracking-wider text-brand/70">
          {eyebrow}
        </span>
      )}
      <h2 className="text-3xl font-extrabold tracking-tight text-ink text-balance">
        {title}
      </h2>
      {subline && (
        <p className="max-w-2xl text-base text-ink/70 md:text-lg">{subline}</p>
      )}
    </div>
  );
}