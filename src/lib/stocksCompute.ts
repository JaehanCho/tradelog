import type { StockHolding, StockMarket, StockQuote } from "../types/stocks";

/** A holding enriched with market value, P&L, weight, and day-change. */
export interface ComputedHolding extends StockHolding {
  /** Current price in native currency. Falls back to avg_cost when no quote. */
  current_price: number;
  prev_close: number | null;
  has_quote: boolean;
  /** Day change as a fraction (e.g. 0.012 = +1.2%). Null if no prev_close. */
  day_change_pct: number | null;
  market_value_native: number;
  market_value_usd: number;
  cost_basis_native: number;
  cost_basis_usd: number;
  pnl_native: number;
  pnl_usd: number;
  /** P&L as a fraction (e.g. 0.16 = +16%). 0 if cost basis is 0. */
  pnl_pct: number;
  /** Portfolio weight as a fraction. 0 when total = 0. */
  weight: number;
}

/**
 * USD per 1 unit of the holding's native currency. When the FX cache hasn't
 * landed yet, KR positions return 0 — that's "honestly excluded from USD
 * totals" rather than "treat KRW as USD and inflate by 1300x". After the
 * first refresh, the real rate kicks in. The Hero shows a warning while
 * the rate is missing.
 */
export function nativeToUsd(market: StockMarket, fxUsdKrw: number | null): number {
  if (market === "US") return 1;
  if (fxUsdKrw == null || fxUsdKrw === 0) return 0;
  return 1 / fxUsdKrw;
}

export function quoteKey(symbol: string, market: string): string {
  return `${symbol}::${market}`;
}

export function computeHoldings(
  holdings: StockHolding[],
  quotes: Record<string, StockQuote>,
  fxUsdKrw: number | null,
): ComputedHolding[] {
  const intermediate = holdings.map((h) => {
    const q = quotes[quoteKey(h.symbol, h.market)];
    const current = q?.price ?? h.avg_cost;
    const prev = q?.prev_close ?? null;
    const dcp = prev != null && prev !== 0 ? (current - prev) / prev : null;
    const fx = nativeToUsd(h.market, fxUsdKrw);

    const mvNative = h.quantity * current;
    const mvUsd = mvNative * fx;
    const cbNative = h.quantity * h.avg_cost;
    const cbUsd = cbNative * fx;
    const pnlNative = mvNative - cbNative;
    const pnlUsd = mvUsd - cbUsd;
    const pnlPct = cbUsd !== 0 ? pnlUsd / cbUsd : 0;

    return {
      ...h,
      current_price: current,
      prev_close: prev,
      has_quote: q !== undefined,
      day_change_pct: dcp,
      market_value_native: mvNative,
      market_value_usd: mvUsd,
      cost_basis_native: cbNative,
      cost_basis_usd: cbUsd,
      pnl_native: pnlNative,
      pnl_usd: pnlUsd,
      pnl_pct: pnlPct,
      weight: 0,
    };
  });
  const total = intermediate.reduce((s, h) => s + h.market_value_usd, 0);
  return intermediate.map((h) => ({
    ...h,
    weight: total > 0 ? h.market_value_usd / total : 0,
  }));
}

const usdFmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});
const usdFmtRound = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const krwFmt = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: "KRW",
  maximumFractionDigits: 0,
});
const pctFmt = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatNative(amount: number, market: StockMarket): string {
  return market === "US" ? usdFmt.format(amount) : krwFmt.format(amount);
}

export function formatUsd(amount: number, opts: { round?: boolean } = {}): string {
  return (opts.round ? usdFmtRound : usdFmt).format(amount);
}

/** Signed percent with explicit "+" prefix on positives. */
export function formatPctSigned(value: number): string {
  const s = pctFmt.format(value);
  return value > 0 ? `+${s}` : s;
}

/** Unsigned percent. */
export function formatPct(value: number): string {
  return pctFmt.format(value);
}

/** Formats a signed amount with explicit "+" on positives. */
export function formatSignedNative(amount: number, market: StockMarket): string {
  const s = formatNative(Math.abs(amount), market);
  if (amount > 0) return `+${s}`;
  if (amount < 0) return `−${s}`;
  return s;
}

export function formatSignedUsd(amount: number): string {
  const s = formatUsd(Math.abs(amount));
  if (amount > 0) return `+${s}`;
  if (amount < 0) return `−${s}`;
  return s;
}

/** "pos" | "neg" | "neutral" — drives tone classes. */
export function toneOf(value: number | null): "pos" | "neg" | "neutral" {
  if (value == null) return "neutral";
  if (value > 0) return "pos";
  if (value < 0) return "neg";
  return "neutral";
}

/** Most recent `fetched_at` across quote cache + FX cache. Null if neither has a value. */
export function latestFetchedAt(
  quotes: Record<string, StockQuote>,
  fxFetchedAt: string | null,
): string | null {
  let latest: string | null = fxFetchedAt;
  for (const q of Object.values(quotes)) {
    if (!latest || q.fetched_at > latest) latest = q.fetched_at;
  }
  return latest;
}

/**
 * Locale-aware "3 minutes ago" / "3분 전" using `Intl.RelativeTimeFormat`.
 * Returns "" on unparseable input.
 */
export function relativeAgo(iso: string, locale: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000));
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (diffSec < 60) return rtf.format(-diffSec, "second");
  if (diffSec < 3600) return rtf.format(-Math.floor(diffSec / 60), "minute");
  if (diffSec < 86400) return rtf.format(-Math.floor(diffSec / 3600), "hour");
  return rtf.format(-Math.floor(diffSec / 86400), "day");
}
