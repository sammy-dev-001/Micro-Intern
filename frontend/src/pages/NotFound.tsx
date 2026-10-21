import { Link } from 'react-router-dom';
import { Container } from '../components/Container';
import { Button } from '../components/Button';

export function NotFound() {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <p className="label-utility text-brand/70">404</p>
      <h1 className="text-4xl font-extrabold tracking-tight">Page not found</h1>
      <p className="max-w-md text-ink/70">
        That link doesn't go anywhere. Let's get you back to somewhere real.
      </p>
      <Link to="/">
        <Button variant="primary" size="md">
          Back to home
        </Button>
      </Link>
    </Container>
  );
}