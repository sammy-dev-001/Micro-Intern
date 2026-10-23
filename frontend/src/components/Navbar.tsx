import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Logo } from "./Logo";
import { Button } from "./Button";
import { Container } from "./Container";
import { cn } from "../lib/cn";
import { useAuth } from "../auth/AuthContext";

type NavItem = { hash: string; label: string };



const anchors: NavItem[] = [
  { hash: "how-it-works", label: "How it works" },
  { hash: "for-talent", label: "For Talent" },
  { hash: "for-business", label: "For Business" },
];

function scrollToSection(hash: string) {
  const el = document.getElementById(hash);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

export function Navbar() {
  const [open, setOpen] = useState(false);
const { user } = useAuth();
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-chalk/60 bg-paper/95 backdrop-blur">
      <Container>
        <nav
          aria-label="Primary"
          className="flex h-16 items-center justify-between gap-6"
        >
          <Link to="/" aria-label="MicroIntern home" className="shrink-0">
            <Logo size="md" className="lg:hidden" />
            <Logo size="lg" className="hidden lg:inline-flex" />
          </Link>

          <ul className="hidden items-center gap-7 lg:flex">
            <li>
              <Link
                to="/tasks"
                className="text-sm font-medium text-ink/80 transition-colors hover:text-ink"
              >
                Tasks
              </Link>
            </li>
            {anchors.map((a) => (
              <li key={a.hash}>
                <button
                  type="button"
                  onClick={() => scrollToSection(a.hash)}
                  className="text-sm font-medium text-ink/80 transition-colors hover:text-ink"
                >
                  {a.label}
                </button>
              </li>
            ))}
          </ul>

          <div className="hidden items-center gap-2 lg:flex">
            {user ? (
              <Link to="/dashboard">
                <Button variant="secondary" size="sm">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline" size="sm">
                    Log In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button variant="secondary" size="sm">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-drawer"
            onClick={() => setOpen((v) => !v)}
            className={cn(
              "inline-flex h-10 w-10 items-center justify-center rounded-md",
              "text-ink transition-colors hover:bg-chalk/50",
              "focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-brand",
              "lg:hidden",
            )}
          >
            <HamburgerIcon open={open} />
          </button>
        </nav>
      </Container>

      {open && (
        <div
          id="mobile-drawer"
          className="border-t border-chalk bg-paper lg:hidden"
        >
          <Container>
            <ul className="flex flex-col py-2">
              <li>
                <Link
                  to="/tasks"
                  onClick={() => setOpen(false)}
                  className="block py-3 text-base font-medium text-ink/85 transition-colors hover:text-ink"
                >
                  Tasks
                </Link>
              </li>
              {anchors.map((a) => (
                <li key={a.hash}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      // Let the drawer close first, then scroll.
                      requestAnimationFrame(() => scrollToSection(a.hash));
                    }}
                    className="block w-full py-3 text-left text-base font-medium text-ink/85 transition-colors hover:text-ink"
                  >
                    {a.label}
                  </button>
                </li>
              ))}
            </ul>
            <div className="hidden items-center gap-2 lg:flex">
              {user ? (
                <Link to="/dashboard">
                  <Button variant="secondary" size="sm">
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="outline" size="sm">
                      Log In
                    </Button>
                  </Link>
                  <Link to="/signup">
                    <Button variant="secondary" size="sm">
                      Sign Up
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      {open ? (
        <>
          <line x1="4" y1="4" x2="16" y2="16" />
          <line x1="16" y1="4" x2="4" y2="16" />
        </>
      ) : (
        <>
          <line x1="3" y1="6" x2="17" y2="6" />
          <line x1="3" y1="10" x2="17" y2="10" />
          <line x1="3" y1="14" x2="17" y2="14" />
        </>
      )}
    </svg>
  );
}
