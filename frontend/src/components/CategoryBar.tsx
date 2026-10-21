import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container } from './Container';
import { cn } from '../lib/cn';

type Category = {
  label: string;
  children: string[];
};

const categories: Category[] = [
  {
    label: 'Sales & Marketing',
    children: ['Market Research', 'Product Marketing', 'Lead Generation', 'Sales Outreach'],
  },
  {
    label: 'Tech',
    children: ['Web Development', 'Data Analysis', 'App Development', 'E-commerce', 'Game Development', 'DevOps & Cloud'],
  },
  {
    label: 'Digital Marketing',
    children: ['Email Marketing', 'Social Media Marketing', 'SEO', 'Paid Advertising', 'Affiliate Marketing'],
  },
  {
    label: 'Writing',
    children: ['Copywriting', 'Content Writing', 'Academic Writing', 'Technical Writing', 'Editing & Proofreading'],
  },
  {
    label: 'Graphic Design',
    children: ['Logo Design', 'Banner & Ad Design', 'Social Media Design', '3D Modelling', 'Illustration'],
  },
  {
    label: 'Business & Finance',
    children: ['Life Coaching', 'Wellness & Meditation', 'Bookkeeping', 'Financial Modelling', 'Business Plans'],
  },
  {
    label: 'Photography',
    children: ['Portrait Photography', 'Event Photography', 'Product Photography', 'Editorial Photography'],
  },
  {
    label: 'Video & Audio',
    children: ['Video Editing', 'Motion Graphics', 'Voiceover', 'Podcast Editing'],
  },
  {
    label: 'Admin & Support',
    children: ['Virtual Assistance', 'Data Entry', 'Customer Support', 'Scheduling'],
  },
];

export function CategoryBar() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (openIndex === null) return;
    const onDown = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setOpenIndex(null);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [openIndex]);

  // Close on Escape
  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpenIndex(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openIndex]);

  return (
    <div
      ref={barRef}
      className="border-b border-paper/15 bg-brand text-paper"
    >
      <Container>
        <nav aria-label="Categories" className="relative">
          {/*
            On mobile, this is a horizontally scrollable strip. On lg+, it's
            a flex row that fits. The `no-scrollbar` utility hides the
            scrollbar visually but keeps the scroll behaviour.
          */}
          <ul
            className={cn(
              'flex items-center gap-1 overflow-x-auto no-scrollbar',
              'h-12 lg:overflow-visible'
            )}
          >
            {categories.map((cat, i) => {
              const open = openIndex === i;
              return (
                <li key={cat.label} className="relative shrink-0">
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-haspopup="true"
                    onClick={() => setOpenIndex(open ? null : i)}
                    className={cn(
                      'flex h-12 items-center gap-1 whitespace-nowrap px-3 text-sm font-medium',
                      'text-paper/85 transition-colors hover:text-paper',
                      open && 'text-paper'
                    )}
                  >
                    {cat.label}
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 10 10"
                      aria-hidden="true"
                      className={cn('transition-transform', open && 'rotate-180')}
                    >
                      <path
                        d="M2 4 L5 7 L8 4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>

                  {open && (
                    <div
                      role="menu"
                      className={cn(
                        'absolute left-0 top-full z-30 mt-1 w-64',
                        'rounded-md border border-chalk bg-paper p-2 shadow-lg'
                      )}
                    >
                      <ul>
                        {cat.children.map((sub) => (
                          <li key={sub}>
                            <Link
                              to={`/tasks?category=${encodeURIComponent(cat.label)}&sub=${encodeURIComponent(sub)}`}
                              role="menuitem"
                              onClick={() => setOpenIndex(null)}
                              className="block rounded px-3 py-2 text-sm text-ink/80 transition-colors hover:bg-chalk/40 hover:text-ink"
                            >
                              {sub}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </Container>
    </div>
  );
}