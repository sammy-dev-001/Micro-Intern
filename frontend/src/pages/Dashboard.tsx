import { useAuth } from '../auth/AuthContext';
import { Container } from '../components/Container';
import { Button } from '../components/Button';
import { useDocumentTitle } from '../lib/useDocumentTitle';

export function Dashboard() {
  useDocumentTitle('Dashboard — MicroIntern');
  const { user, logout } = useAuth();

  return (
    <Container className="py-16 md:py-24">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="label-utility text-brand/70">
              {user?.type === 'talent' ? 'Talent' : 'Business'} dashboard
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">
              Welcome, {user?.name}
            </h1>
          </div>
          <Button variant="outline" size="md" onClick={logout}>
            Log out
          </Button>
        </div>
        <p className="text-sm text-ink/70">
          Your dashboard is being built. For now, this page confirms you're
          logged in as <strong>{user?.email}</strong>.
        </p>
      </div>
    </Container>
  );
}