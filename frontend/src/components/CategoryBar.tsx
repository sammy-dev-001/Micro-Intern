import { useState, useRef, useEffect, useLayoutEffect } from 'react';
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

const DROPDOWN_WIDTH = 256; // must match the dropdown's w-64
const GAP = 8;

type DropdownPos = { top: number; left: number };

export function CategoryBar() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [pos, setPos] = useState<DropdownPos | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  // Compute dropdown position from the button's rect on open, and keep it
  // correct while the user scrolls the category strip or resizes the window.
  useLayoutEffect(() => {
    if (openIndex === null) {
      setPos(null);
      return;
    }
    const button = document.querySelector<HTMLButtonElement>(
      `[data-category-btn="${openIndex}"]`
    );
    if (!button) return;

    function compute() {
      if (!button) return;
      const rect = button.getBoundingClientRect();
      // Prefer anchoring to the button's left edge. If that would push the
      // dropdown past the right viewport edge, anchor to the right instead.
      const wouldOverflowRight = rect.left + DROPDOWN_WIDTH + GAP > window.innerWidth;
      const left = wouldOverflowRight
        ? Math.max(GAP, rect.right - DROPDOWN_WIDTH)
        : rect.left;
      setPos({ top: rect.bottom + GAP, left });
    }

    compute();
    window.addEventListener('scroll', compute, true); // capture scroll on any ancestor
    window.addEventListener('resize', compute);
    return () => {
      window.removeEventListener('scroll', compute, true);
      window.removeEventListener('resize', compute);
    };
  }, [openIndex]);

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
    <div ref={barRef} className="border-b border-paper/15 bg-brand text-paper">
      <Container>
        <nav aria-label="Categories" className="relative">
          <ul
            className={cn(
              'flex items-center gap-1 no-scrollbar h-12',
              'overflow-x-auto lg:overflow-visible'
            )}
          >
            {categories.map((cat, i) => {
              const open = openIndex === i;
              return (
                <li key={cat.label} className="relative shrink-0">
                  <button
                    type="button"
                    data-category-btn={i}
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
                </li>
              );
            })}
          </ul>
        </nav>
      </Container>

      {/* Dropdown rendered once, outside the scrolling strip, position: fixed */}
      {openIndex !== null && pos && (
        <div
          role="menu"
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            width: DROPDOWN_WIDTH,
          }}
          className="z-50 rounded-md border border-chalk bg-paper p-2 shadow-lg"
        >
          <ul>
            {categories[openIndex].children.map((sub) => (
              <li key={sub}>
                <Link
                  to={`/tasks?category=${encodeURIComponent(categories[openIndex].label)}&sub=${encodeURIComponent(sub)}`}
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
    </div>
  );
}