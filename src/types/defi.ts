/**
 * A long-lived DeFi / yield-farming position.
 * `id` is a UUID v4 generated client-side.
 * `closed_date === null` means active.
 */
export interface DefiPosition {
  id: string;
  protocol: string;
  chain: string;
  asset: string;
  principal_usd: number;
  opened_date: string;
  closed_date: string | null;
  note: string;
  created_at?: string;
  updated_at?: string;
}

/** A point-in-time valuation of a `DefiPosition`. */
export interface DefiSnapshot {
  id: string;
  position_id: string;
  snapshot_date: string;
  value_usd: number;
  fees_earned_usd: number;
  note: string;
  created_at?: string;
}
