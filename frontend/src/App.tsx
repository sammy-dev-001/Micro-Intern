import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { RequireAuth } from './auth/RequireAuth';
import { ScrollToHash } from './components/ScrollToHash';
import { Navbar } from './components/Navbar';
import { CategoryBar } from './components/CategoryBar';
import { Footer } from './components/Footer';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Dashboard } from './pages/Dashboard';
import { Stub } from './pages/Stub';
import { NotFound } from './pages/NotFound';
import { SignupComplete } from './pages/SignupComplete';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToHash />
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <CategoryBar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/tasks" element={<Stub title="Marketplace" note="Coming soon." />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/signup/complete" element={<SignupComplete />} />
              <Route
                path="/dashboard"
                element={
                  <RequireAuth>
                    <Dashboard />
                  </RequireAuth>
                }
              />
              <Route path="/contact" element={<Stub title="Contact" note="Coming soon." />} />
              <Route path="/terms" element={<Stub title="Terms" note="Draft pending." />} />
              <Route path="/privacy" element={<Stub title="Privacy" note="Draft pending." />} />
              <Route path="/sample-profile" element={<Stub title="Sample profile" note="Coming soon." />} />

              <Route path="/how-it-works" element={<Navigate to="/#how-it-works" replace />} />
              <Route path="/for-talent" element={<Navigate to="/#for-talent" replace />} />
              <Route path="/for-business" element={<Navigate to="/#for-business" replace />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}