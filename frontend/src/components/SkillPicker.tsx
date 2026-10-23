import { useMemo, useRef, useState, useEffect } from 'react';
import { cn } from '../lib/cn';

type SkillPickerProps = {
  label: string;
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  max?: number;
  placeholder?: string;
};

/**
 * Multi-select with search. User types to filter the curated list, clicks
 * a suggestion to add it as a chip. Chips can be removed individually.
 * Cannot add free text — only items from `options` can be selected.
 */
export function SkillPicker({
  label,
  options,
  value,
  onChange,
  max = 8,
  placeholder = 'Search skills…',
}: SkillPickerProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return options
      .filter((o) => !value.includes(o))
      .filter((o) => (q ? o.toLowerCase().includes(q) : true))
      .slice(0, 20);
  }, [options, value, query]);

  const atMax = value.length >= max;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  function add(skill: string) {
    if (value.includes(skill) || atMax) return;
    onChange([...value, skill]);
    setQuery('');
    setActiveIndex(0);
  }

  function remove(skill: string) {
    onChange(value.filter((v) => v !== skill));
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && open && filtered[activeIndex]) {
      e.preventDefault();
      add(filtered[activeIndex]);
    } else if (e.key === 'Backspace' && query === '' && value.length > 0) {
      // Remove the last chip when the input is empty
      remove(value[value.length - 1]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div ref={wrapRef} className="flex flex-col gap-2">
      <label htmlFor="skill-picker-input" className="text-base font-medium text-ink">
        {label}
      </label>

      {/* Chips */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-2 rounded-full bg-chalk/60 px-3 py-1 text-sm font-medium text-ink"
            >
              {s}
              <button
                type="button"
                onClick={() => remove(s)}
                className="text-ink/60 hover:text-ink"
                aria-label={`Remove ${s}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input + dropdown */}
      <div className="relative">
        <input
          id="skill-picker-input"
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActiveIndex(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={atMax ? `Max ${max} skills selected` : placeholder}
          disabled={atMax}
          className={cn(
            'h-12 w-full rounded-md border border-chalk bg-paper px-4 text-base text-ink',
            'placeholder:text-ink/40',
            'transition-colors focus:border-brand focus:outline-none',
            'disabled:cursor-not-allowed disabled:opacity-60'
          )}
          autoComplete="off"
          aria-expanded={open}
          aria-controls="skill-picker-list"
          aria-autocomplete="list"
          role="combobox"
        />

        {open && !atMax && (
          <ul
            id="skill-picker-list"
            role="listbox"
            className={cn(
              'absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-y-auto',
              'rounded-md border border-chalk bg-paper p-1 shadow-lg'
            )}
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-ink/60">
                {query ? 'No matches — try a different search.' : 'Start typing to filter.'}
              </li>
            ) : (
              filtered.map((opt, i) => (
                <li key={opt}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={i === activeIndex}
                    onMouseDown={(e) => {
                      // Prevent the input blur before we handle the click
                      e.preventDefault();
                      add(opt);
                    }}
                    onMouseEnter={() => setActiveIndex(i)}
                    className={cn(
                      'w-full rounded px-3 py-2 text-left text-sm text-ink/80 transition-colors',
                      i === activeIndex ? 'bg-chalk/40 text-ink' : 'hover:bg-chalk/40 hover:text-ink'
                    )}
                  >
                    {opt}
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      <p className="text-sm text-ink/60">
        {value.length} of {max} selected. Pick from the list.
      </p>
    </div>
  );
}