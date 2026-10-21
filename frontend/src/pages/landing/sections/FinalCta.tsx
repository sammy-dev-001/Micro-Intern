import { Link } from 'react-router-dom';
import { Container } from '../../../components/Container';
import { Button } from '../../../components/Button';
import { useReveal } from '../../../lib/useReveal';

export function FinalCta() {
  const revealRef = useReveal<HTMLElement>();

  return (
    <section
      ref={revealRef}
      data-reveal
      aria-labelledby="final-cta-heading"
      className="section bg-brand text-paper"
    >
      <Container>
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-8 text-center">
          <h2
            id="final-cta-heading"
            className="text-balance text-paper/90 text-3xl font-extrabold leading-tight tracking-tight md:text-4xl lg:text-5xl"
          >
            Your certificates say you can.
            <br className="hidden sm:block" /> The work says you did.
          </h2>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link to="/tasks" className="w-full sm:w-auto">
              <Button variant="primary" size="lg" className="w-full">
                Find work
              </Button>
            </Link>
            <Link to="/signup?type=business" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full border-paper/40 bg-transparent text-paper hover:border-paper hover:bg-paper/10"
              >
                Post a task
              </Button>
            </Link>
          </div>

          <p className="text-sm text-paper/60">
            No subscription. No retainers. Just tasks, escrow, and proof.
          </p>
        </div>
      </Container>
    </section>
  );
}