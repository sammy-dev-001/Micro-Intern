import { useState, type SubmitEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container } from '../../../components/Container';
import { Button } from '../../../components/Button';

export function Hero() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  function onSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/tasks?q=${encodeURIComponent(q)}` : '/tasks');
  }

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative overflow-hidden bg-brand text-paper"
    >
      <DecorativeShapes aria-hidden="true" />

      <Container>
        <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center gap-8 py-24 text-center md:py-32">
          <h1
            id="hero-heading"
            className="text-balance text-paper/85 text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl lg:text-6xl"
          >
            Do real work. Get paid. Prove it.
          </h1>

          <p className="max-w-xl text-lg leading-relaxed text-paper/85">
            Short paid tasks from real businesses, funded up front, paid on
            delivery, and proven on your public profile.
          </p>

          {/* Search bar — the hero's primary action */}
          <form
            onSubmit={onSubmit}
            role="search"
            className="w-full max-w-xl"
          >
            <label htmlFor="hero-search" className="sr-only">
              Search for tasks or talent
            </label>
            <div className="flex items-stretch overflow-hidden rounded-md bg-paper shadow-lg focus-within:ring-2 focus-within:ring-marigold/60">
              <input
                id="hero-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for top talents"
                className="h-14 flex-1 bg-transparent px-5 text-base text-ink placeholder:text-ink/50 focus:outline-none"
              />
              <button
                type="submit"
                className="flex h-14 items-center gap-2 bg-marigold px-6 text-sm font-semibold text-ink transition-colors hover:bg-marigold/90"
              >
                <SearchIcon />
                <span className="hidden sm:inline">Search</span>
              </button>
            </div>
          </form>

          {/* Secondary actions — smaller, quieter than the search */}
          <div className="flex flex-col items-center gap-3 pt-2 text-sm text-paper/70 sm:flex-row sm:gap-6">
            <span>New to MicroIntern?</span>
            <Link
              to="/signup?type=talent"
              className="font-semibold text-paper underline-offset-4 hover:underline"
            >
              Join as Talent
            </Link>
            <span aria-hidden="true" className="hidden sm:inline">·</span>
            <Link
              to="/signup?type=business"
              className="font-semibold text-paper underline-offset-4 hover:underline"
            >
              Post a Task
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" fill="none">
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="2" />
      <path d="M12.5 12.5 L16 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function DecorativeShapes(props: { 'aria-hidden'?: 'true' | boolean }) {
  return (
    <div
      {...props}
      className="pointer-events-none absolute inset-0 hidden md:block"
    >
      <div
        className="absolute -right-32 top-1/4 h-96 w-72 rounded-3xl bg-paper/10"
        style={{ transform: 'rotate(-12deg)' }}
      />
      <div
        className="absolute -left-40 bottom-8 h-72 w-64 rounded-3xl bg-brand-700/60"
        style={{ transform: 'rotate(8deg)' }}
      />
    </div>
  );
}