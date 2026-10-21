import { useEffect, useRef } from 'react';

/**
 * Attaches an IntersectionObserver to the element and adds `.is-revealed`
 * once it has entered the viewport. Fires once per element; does not
 * re-hide on scroll-out.
 *
 * Usage:
 *   const ref = useReveal<HTMLDivElement>();
 *   return <div ref={ref} data-reveal>…</div>;
 *
 * Respects prefers-reduced-motion — if the user has reduced motion on,
 * the element is revealed immediately without waiting for intersection.
 */
export function useReveal<T extends HTMLElement = HTMLElement>(
  options: { rootMargin?: string; threshold?: number } = {}
) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Reduced motion: reveal immediately, skip the observer
    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (prefersReduced) {
      el.classList.add('is-revealed');
      return;
    }

    // No IntersectionObserver (very old browsers): reveal immediately
    if (typeof IntersectionObserver === 'undefined') {
      el.classList.add('is-revealed');
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        }
      },
      {
        rootMargin: options.rootMargin ?? '0px 0px -10% 0px',
        threshold: options.threshold ?? 0.15,
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [options.rootMargin, options.threshold]);

  return ref;
}