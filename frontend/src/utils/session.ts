// Utility functions for managing user session in localStorage

export const SESSION_KEY = 'microintern_user';

export function saveSession(user: any) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function getSession(): any | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function isLoggedIn(): boolean {
  return !!getSession();
}
