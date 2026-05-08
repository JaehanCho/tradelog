/**
 * Raw row stored in SQLite. `trade_date` is a KST calendar date (YYYY-MM-DD).
 * `created_at` / `updated_at` are UTC ISO 8601 timestamps from the backend.
 */
export interface TradingDay {
  trade_date: string;
  deposit: number;
  withdrawal: number;
  end_balance: number | null;
  note: string;
  /** Free-form daily market thoughts, separate from per-trade `note`. */
  market_note: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Row enriched with computed fields by `computeTradingDays`.
 * `null` means the dependency was missing (e.g. no end_balance yet) and the
 * value should be rendered blank.
 */
export interface ComputedTradingDay extends TradingDay {
  start_balance: number | null;
  daily_pnl: number | null;
  daily_return_pct: number | null;
  cumulative_pnl: number | null;
  cumulative_return_pct: number | null;
}
