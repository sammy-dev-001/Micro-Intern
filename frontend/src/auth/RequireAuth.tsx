import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Container } from '../components/Container';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Container className="py-24">
        <p className="text-sm text-ink/70">Checking your session…</p>
      </Container>
    );
  }

  if (!user) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  return <>{children}</>;
}