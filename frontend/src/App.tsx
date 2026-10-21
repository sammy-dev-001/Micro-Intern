import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Landing } from './pages/Landing';
import { Stub } from './pages/Stub';
import { NotFound } from './pages/NotFound';
import {CategoryBar} from './components/CategoryBar'

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col">
        <Navbar />
<CategoryBar />

        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/tasks" element={<Stub title="Marketplace" note="Coming soon." />} />
            <Route path="/login" element={<Stub title="Log in" note="Auth is next." />} />
            <Route path="/signup" element={<Stub title="Sign up" note="Auth is next." />} />
            <Route path="/contact" element={<Stub title="Contact" note="Coming soon." />} />
            <Route path="/terms" element={<Stub title="Terms" note="Draft pending." />} />
            <Route path="/privacy" element={<Stub title="Privacy" note="Draft pending." />} />
            <Route path="/sample-profile" element={<Stub title="Sample profile" note="Coming soon." />} />

            {/* Redirects per §9 */}
            <Route path="/how-it-works" element={<Navigate to="/#how-it-works" replace />} />
            <Route path="/for-talent" element={<Navigate to="/#for-talent" replace />} />
            <Route path="/for-business" element={<Navigate to="/#for-business" replace />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}