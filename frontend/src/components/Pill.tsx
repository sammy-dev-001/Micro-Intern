import type { ReactNode } from 'react';
import type { BrandTone } from '../types';
import { cn } from '../lib/cn';

type PillProps = {
  tone?: BrandTone;
  className?: string;
  children: ReactNode;
};

const tones: Record<BrandTone, string> = {
  brand: 'bg-brand/10 text-brand',
  marigold: 'bg-marigold/15 text-ink',
  verified: 'bg-verified/10 text-verified',
  ink: 'bg-ink/10 text-ink',
  paper: 'bg-paper text-ink border border-chalk',
};

export function Pill({ tone = 'brand', className, children }: PillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1',
        'text-xs font-semibold uppercase tracking-wider',
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}