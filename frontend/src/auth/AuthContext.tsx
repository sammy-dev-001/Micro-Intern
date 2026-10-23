import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, getToken, setToken, setUnauthorizedHandler } from '../lib/api';
import type {
  AuthResponse,
  AuthUser,
  GoogleLoginResponse,
  LoginPayload,
  RegisterPayload,
  UserType,
} from '../types';

type GoogleLoginResult =
  | { user: AuthUser }
  | { needs_role: true; pending: string };

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (payload: LoginPayload) => Promise<AuthUser>;
  register: (payload: RegisterPayload) => Promise<AuthUser>;
  loginWithGoogle: (credential: string) => Promise<GoogleLoginResult>;
  completeGoogleSignup: (payload: {
    pending: string;
    type: UserType;
  }) => Promise<AuthUser>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Hydrate on mount: if a token exists, verify it against /auth/me.
  useEffect(() => {
    let cancelled = false;
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get<{ user: AuthUser }>('/auth/me')
      .then((res) => {
        if (!cancelled) setUser(res.user);
      })
      .catch(() => {
        // 401 already cleared the token via the unauthorized handler.
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Global 401 handler: any authenticated request that fails clears the user.
  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    return () => setUnauthorizedHandler(null);
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const res = await api.post<AuthResponse>('/auth/login', payload);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const res = await api.post<AuthResponse>('/auth/register', payload);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const loginWithGoogle = useCallback(
    async (credential: string): Promise<GoogleLoginResult> => {
      const res = await api.post<GoogleLoginResponse>('/auth/google', { credential });
      if ('needs_role' in res) {
        return { needs_role: true, pending: res.pending };
      }
      setToken(res.token);
      setUser(res.user);
      return { user: res.user };
    },
    []
  );

  const completeGoogleSignup = useCallback(
    async (payload: { pending: string; type: UserType }) => {
      const res = await api.post<AuthResponse>('/auth/google/complete', payload);
      setToken(res.token);
      setUser(res.user);
      return res.user;
    },
    []
  );

  const logout = useCallback(() => {
    // Best-effort server call; ignore failures.
    api.post('/auth/logout').catch(() => {});
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      loginWithGoogle,
      completeGoogleSignup,
      logout,
    }),
    [user, loading, login, register, loginWithGoogle, completeGoogleSignup, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}