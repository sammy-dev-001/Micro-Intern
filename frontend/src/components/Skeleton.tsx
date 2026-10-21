import { cn } from '../lib/cn';

type SkeletonProps = {
  className?: string;
};

/**
 * A single pulsing placeholder block. Compose these into shapes that
 * mirror the real content's structure.
 *
 * Usage:
 *   <Skeleton className="h-4 w-2/3" />
 *   <Skeleton className="h-10 w-10 rounded-full" />
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse rounded bg-chalk/40',
        className
      )}
    />
  );
}