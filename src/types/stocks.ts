/**
 * Stock market identifier — drives Yahoo ticker suffix and native currency.
 * `KR_KOSPI` → `.KS`, `KR_KOSDAQ` → `.KQ`, `US` → no suffix.
 */
export type StockMarket = "KR_KOSPI" | "KR_KOSDAQ" | "US";

export const STOCK_MARKETS: readonly StockMarket[] = [
  "KR_KOSPI",
  "KR_KOSDAQ",
  "US",
] as const;

/** Native currency for a market. */
export function currencyOf(market: StockMarket): "USD" | "KRW" {
  return market === "US" ? "USD" : "KRW";
}

/**
 * A long-position holding. PK is (symbol, market). `avg_cost` and the
 * implicit "current price" are both in the position's native currency;
 * USD conversion happens in the selectors.
 */
export interface StockHolding {
  symbol: string;
  market: StockMarket;
  display_name: string;
  quantity: number;
  avg_cost: number;
  created_at?: string;
  updated_at?: string;
}

/** A watched ticker (no position). */
export interface StockWatch {
  symbol: string;
  market: StockMarket;
  display_name: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * One entry in a per-ticker memo timeline. `id` is undefined when the
 * note is being created (backend assigns via AUTOINCREMENT).
 */
export interface StockNote {
  id?: number;
  symbol: string;
  market: StockMarket;
  note_date: string;
  body: string;
  created_at?: string;
  updated_at?: string;
}

/** Cached Yahoo Finance quote in native currency. */
export interface StockQuote {
  symbol: string;
  market: StockMarket;
  price: number;
  prev_close: number | null;
  currency: "USD" | "KRW";
  fetched_at: string;
}

/** Cached FX pair (currently only USDKRW). */
export interface FxRate {
  pair: string;
  rate: number;
  fetched_at: string;
}

/** Result returned by `refresh_stock_quotes`. Carries the merged cache state. */
export interface QuoteRefreshResult {
  quotes: StockQuote[];
  fx_rate: number | null;
  fx_fetched_at: string | null;
  fetched: number;
  skipped: number;
  failed_symbols: { symbol: string; market: StockMarket }[];
}
