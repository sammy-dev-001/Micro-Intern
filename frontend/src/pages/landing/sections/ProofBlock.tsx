import { Link } from 'react-router-dom';
import { Container } from '../../../components/Container';
import { ProofSlip, type ProofSlipData } from '../../../components/ProofSlip';
import { useReveal } from '../../../lib/useReveal';

const SAMPLE: ProofSlipData = {
  talent_name: 'Adaeze O.',
  skill: 'Data Cleaning',
  business_name: 'Lagos Retail Co.',
  mentor_name: 'Tunde A.',
  amount_kobo: 2_500_000, // ₦25,000
  released_at: '2026-09-12T00:00:00Z',
  certificate_slug: 'mci_7f3a2b',
  snapshot_hash:
    'sha256:22b4960c9f6a3874eb9042b4c941f2b895813ff9cd599de07b9872ff73d6ce71',
};

export function ProofBlock() {
  const revealRef = useReveal<HTMLElement>();

  return (
    <section
      ref={revealRef}
      data-reveal
      aria-labelledby="proof-block-heading"
      className="section bg-brand text-paper"
    >
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          {/* Copy side */}
          <div className="max-w-lg">
            <span className="label-utility text-marigold">
              The certificate
            </span>
            <h2
              id="proof-block-heading"
              className="mt-4 text-paper/90 text-balance text-3xl font-extrabold leading-tight tracking-tight md:text-4xl"
            >
              Your certificate isn't a PDF we print. It's a record of work we
              can prove.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-paper/80">
              Every completed task issues a public proof slip — with the work,
              the payment, and a verifiable hash. No portfolio to curate, no
              claims to defend. The record speaks.
            </p>
            <Link
              to="/sample-profile"
              className="mt-6 inline-flex text-sm font-semibold text-marigold underline-offset-4 hover:underline"
            >
              See a sample profile 
            </Link>
          </div>

          {/* Slip side */}
          <div className="flex justify-center lg:justify-end">
            <ProofSlip data={SAMPLE} rotated />
          </div>
        </div>
      </Container>
    </section>
  );
}