import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export function ScrollToHash() {
  const { hash, pathname } = useLocation();
  const strippedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!hash) {
      // If we just stripped a hash for this same path, don't scroll to top.
      if (strippedRef.current === pathname) {
        strippedRef.current = null;
        return;
      }
      window.scrollTo({ top: 0, left: 0 });
      return;
    }

    const id = decodeURIComponent(hash.slice(1));
    const el = document.getElementById(id);
    if (!el) return;

    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    el.scrollIntoView({
      behavior: prefersReduced ? 'auto' : 'smooth',
      block: 'start',
    });

    // Strip the hash so the browser doesn't run its own scroll.
    strippedRef.current = pathname;
    window.history.replaceState(null, '', pathname);
  }, [hash, pathname]);

  return null;
}