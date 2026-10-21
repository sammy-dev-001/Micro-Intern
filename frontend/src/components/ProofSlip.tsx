import { cn } from '../lib/cn';
import { formatNaira } from '../lib/format';

export type ProofSlipData = {
  talent_name: string;
  skill: string;
  business_name: string;
  mentor_name?: string | null;
  amount_kobo: number;
  released_at: string; // ISO date
  certificate_slug: string;
  snapshot_hash: string;
};

type ProofSlipProps = {
  data: ProofSlipData;
  className?: string;
  /** Slight rotation for the marketing display. Omit for real certificate pages. */
  rotated?: boolean;
};

/**
 * The signature component — a receipt-style card that renders a proof of work.
 * Same component is used on the landing page (with sample data) and on the
 * real certificate page (with API data).
 *
 * Design rules:
 * - Paper background, Chalk border, shadow-lg (the one shadow the system uses).
 * - Tabular figures for the amount.
 * - Verified Green used only for the RELEASED stamp and nothing else.
 * - Mentor line omitted entirely when absent — not hidden, not blank.
 */
export function ProofSlip({ data, className, rotated = false }: ProofSlipProps) {
  const issued = formatDate(data.released_at);

  return (
    <article
      className={cn(
        'relative w-full max-w-[380px] rounded-lg border border-chalk bg-paper p-6',
        'shadow-[0_10px_30px_-12px_rgba(17,23,43,0.18)]',
        rotated && 'rotate-[-2deg]',
        className
      )}
      aria-label="Sample proof of work"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 border-b border-chalk pb-4">
        <span className="label-utility text-ink/60">Proof of Work</span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-brand">
          MicroIntern
        </span>
      </div>

      {/* Skill — the biggest line on the slip */}
      <h3 className="mt-5 text-2xl font-extrabold leading-tight tracking-tight text-ink">
        {data.skill}
      </h3>

      {/* For business */}
      <p className="mt-1 text-sm text-ink/70">
        For {data.business_name}
      </p>

      {/* Mentor — omitted entirely when absent */}
      {data.mentor_name && (
        <p className="mt-1 text-sm text-ink/70">
          Mentored by {data.mentor_name}
        </p>
      )}

      {/* Amount + stamp row */}
      <div className="mt-6 flex items-end justify-between gap-3 border-t border-chalk pt-5">
        <div>
          <p className="label-utility text-ink/50">Paid</p>
          <p className="tabular mt-1 text-3xl font-extrabold leading-none text-ink">
            {formatNaira(data.amount_kobo)}
          </p>
        </div>

        {/* RELEASED stamp — the point of the slip */}
        <span
          className="inline-flex -rotate-6 items-center rounded border-2 border-verified px-3 py-1 text-xs font-extrabold uppercase tracking-widest text-verified"
          aria-label="Status: released"
        >
          Released
        </span>
      </div>

      {/* Footer */}
      <div className="mt-5 flex flex-col gap-1 border-t border-chalk pt-4 text-[10px] leading-relaxed text-ink/50">
        <p>
          Issued {issued} · Talent {data.talent_name}
        </p>
        <p className="break-all">
          Verify at microintern.ng/c/{data.certificate_slug}
        </p>
      </div>

      {/* Torn edge effect — pure CSS, no SVG */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -bottom-1 h-2"
        style={{
          backgroundImage:
            'radial-gradient(circle at 6px 0, transparent 5px, #F4EFE6 5px)',
          backgroundSize: '12px 8px',
          backgroundRepeat: 'repeat-x',
        }}
      />
    </article>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}