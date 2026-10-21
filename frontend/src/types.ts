
/** Brand palette as Tailwind utility names. Kept in sync with tailwind.config.js. */
export type BrandTone = 'brand' | 'marigold' | 'verified' | 'ink' | 'paper';

/** Escrow state machine — mirrors the ledger in §5.3. */
export type EscrowStatus =
  | 'funded'
  | 'assigned'
  | 'submitted'
  | 'approved'
  | 'released';