import { cn } from '../lib/cn';

type LogoMarkProps = {
  /** Rendered size in px (square). Defaults to 44. */
  size?: number;
  /** Paper bars + Marigold notch, for use on Indigo backgrounds. */
  inverted?: boolean;
  className?: string;
};

/**
 * MicroIntern mark — "proof + growth".
 *
 * Three rising bars, tilted ~6° to the right so the group reads as motion.
 * The tallest bar carries a square notch at its top-right corner — the
 * "proof" mark. The notch is the only place color appears; the bars are one
 * solid fill. No tile, no stroke, no shadow.
 *
 * Grid: 48×48. Bars are 8 units wide, gaps are 3 units, all tilted together.
 */
export function LogoMark({
  size = 44,
  inverted = false,
  className,
}: LogoMarkProps) {
  const bar = inverted ? '#F4EFE6' : '#14246B';
  const notch = '#F2A93B';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role="img"
      aria-label="MicroIntern"
      className={cn('shrink-0', className)}
    >
      {/*
        Group tilted 6° clockwise around the visual center (24, 26).
        All three bars inherit the tilt, so the group moves together.
      */}
      <g transform="rotate(6 24 26)">
        {/* Bar 1 — shortest, leftmost. Baseline y=42, top y=30. */}
        <rect x="9" y="30" width="8" height="12" rx="1" fill={bar} />

        {/* Bar 2 — middle. Baseline y=42, top y=20. */}
        <rect x="20" y="20" width="8" height="22" rx="1" fill={bar} />

        {/*
          Bar 3 — tallest, rightmost. Baseline y=42, top y=10.
          The top-right 4×4 corner is notched out — the "proof" step.
          Drawn as a path so the notch is a real void, not a masked rect.
        */}
        <path
          d="M31 10 H35 V14 H39 V42 H31 Z"
          fill={bar}
        />

        {/*
          The notch itself, in Marigold. Sits exactly where bar 3's corner
          was removed, so the eye reads "something happened here" — a stamp,
          a seal, a certification. Small: 4×4 units.
        */}
        <rect x="35" y="10" width="4" height="4" fill={notch} />
      </g>
    </svg>
  );
}

type LogoProps = {
  size?: 'sm' | 'md' | 'lg';
  inverted?: boolean;
  withWordmark?: boolean;
  className?: string;
};

const markSizes = { sm: 36, md: 48, lg: 64 } as const;
const textSizes = {
  sm: 'text-xl',
  md: 'text-2xl',
  lg: 'text-3xl',
} as const;

export function Logo({
  size = 'md',
  inverted = false,
  withWordmark = true,
  className,
}: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-3', className)}>
      <LogoMark size={markSizes[size]} inverted={inverted} />
      {withWordmark && (
        <span
          className={cn(
            'font-extrabold tracking-tighter',
            textSizes[size],
            inverted ? 'text-paper' : 'text-ink'
          )}
        >
          MicroIntern
        </span>
      )}
    </span>
  );
}