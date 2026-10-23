
/** Brand palette as Tailwind utility names. Kept in sync with tailwind.config.js. */
export type BrandTone = 'brand' | 'marigold' | 'verified' | 'ink' | 'paper';

/** Escrow state machine — mirrors the ledger in §5.3. */
export type EscrowStatus =
  | 'funded'
  | 'assigned'
  | 'submitted'
  | 'approved'
  | 'released';

  export type UserType = 'talent' | 'business';

export type AuthUser = {
  id: number | string;
  name: string;
  email: string;
  type: UserType;
  created_at: string;
  profile: Record<string, unknown> | null;
};

export type AuthResponse = {
  user: AuthUser;
  token: string;
};

export type LoginPayload = { email: string; password: string };

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  type: UserType;
};


export type GoogleLoginResponse =
  | { user: AuthUser; token: string }
  | { needs_role: true; pending: string };