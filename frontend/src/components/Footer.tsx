import { Link } from 'react-router-dom';
import { Logo } from './Logo';
import { Container } from './Container';

const product = [
  { to: '/tasks', label: 'Tasks' },
  { to: '/how-it-works', label: 'How it works' },
  { to: '/for-talent', label: 'For Talent' },
  { to: '/for-business', label: 'For Business' },
];

const company = [
  { to: '/contact', label: 'Contact' },
  { to: '/terms', label: 'Terms' },
  { to: '/privacy', label: 'Privacy' },
];

export function Footer() {
  return (
    <footer className="bg-ink text-paper">
      <Container>
       <div className="grid gap-10 py-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <Logo size="md" inverted />
            <p className="max-w-xs text-sm leading-relaxed text-paper/70">
              Short paid tasks, funded up front. Real work, real proof.
            </p>
            <p className="text-xs text-paper/50">Built by Stormers</p>
          </div>

          {/* Product */}
          <nav aria-label="Product">
            <h3 className="label-utility mb-4 text-paper/50">Product</h3>
            <ul className="space-y-3">
              {product.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="text-sm text-paper/80 transition-colors hover:text-paper"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Company */}
          <nav aria-label="Company">
            <h3 className="label-utility mb-4 text-paper/50">Company</h3>
            <ul className="space-y-3">
              {company.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="text-sm text-paper/80 transition-colors hover:text-paper"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact */}
          <div>
            <h3 className="label-utility mb-4 text-paper/50">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href="mailto:hello@microintern.ng"
                  className="text-paper/80 transition-colors hover:text-paper"
                >
                  contact@microintern.ng
                </a>
              </li>
              <li className="flex gap-4 pt-2">
                <a
                  href="https://x.com/microintern"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-paper/60 transition-colors hover:text-paper"
                  aria-label="MicroIntern on X"
                >
                  X
                </a>
                <a
                  href="https://linkedin.com/company/microintern"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-paper/60 transition-colors hover:text-paper"
                  aria-label="MicroIntern on LinkedIn"
                >
                  LinkedIn
                </a>
                <a
                  href="https://instagram.com/microintern"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-paper/60 transition-colors hover:text-paper"
                  aria-label="MicroIntern on Instagram"
                >
                  Instagram
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-paper/15 py-4 text-xs text-paper/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 MicroIntern · Built by Stormers</p>
          
        </div>
      </Container>
    </footer>
  );
}