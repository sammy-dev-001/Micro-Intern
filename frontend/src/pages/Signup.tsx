import { useSearchParams } from 'react-router-dom';
import { SignupWizard } from '../auth/SignupWizard';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { useAuth } from '../auth/AuthContext';
import { Navigate } from 'react-router-dom';
import { Container } from '../components/Container';

export function Signup() {
  useDocumentTitle('Sign up — MicroIntern');
  const { user, loading } = useAuth();
  const [params] = useSearchParams();
  const redirect = params.get('redirect') ?? '/dashboard';

  if (loading) {
    return (
      <Container className="py-24">
        <p className="text-sm text-ink/70">Loading…</p>
      </Container>
    );
  }
  if (user) return <Navigate to={redirect} replace />;

  return <SignupWizard redirectTo={redirect} />;
}