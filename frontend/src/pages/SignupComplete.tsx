import { useLocation, Navigate } from 'react-router-dom';
import { SignupWizard } from '../auth/SignupWizard';
import { useDocumentTitle } from '../lib/useDocumentTitle';

export function SignupComplete() {
  useDocumentTitle('Finish signing up — MicroIntern');
  const location = useLocation();
  const pending = (location.state as { pending?: string })?.pending;

  if (!pending) return <Navigate to="/signup" replace />;

  return <SignupWizard redirectTo="/dashboard" googlePending={pending} />;
}