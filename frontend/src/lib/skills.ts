import { useEffect, useState } from 'react';
import { api } from './api';

export type Skill = { id: number; name: string };

/**
 * Fetches the canonical skills list from the backend.
 * Returns { skills, loading, error }.
 *
 * Caches for the component's lifetime. When the app grows and multiple
 * components need this, promote to a context provider or a small cache
 * layer (react-query, SWR). Not needed yet.
 */
export function useSkills() {
  const [skills, setSkills] = useState<Skill[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get<Skill[]>('/skills')
      .then((rows) => {
        if (!cancelled) setSkills(rows);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    skills: skills ?? [],
    loading: skills === null && !error,
    error,
  };
}