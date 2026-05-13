import { create } from "zustand";
import { api } from "../lib/api";
import type { StockMarket, StockQuote } from "../types/stocks";

/** Map key for a (symbol, market) pair. */
export const quoteKey = (symbol: string, market: string): string =>
  `${symbol}::${market}`;

interface State {
  /** symbol::market → cached quote. */
  quotes: Record<string, StockQuote>;
  /** USDKRW rate (KRW per 1 USD). Null until first fetch lands. */
  fxRate: number | null;
  fxFetchedAt: string | null;
  loading: boolean;
  /** Manual-refresh in flight — disables the button. */
  refreshing: boolean;
  /** Set when last refresh attempt failed (network/Yahoo unreachable). */
  refreshError: string | null;

  load: () => Promise<void>;
  /** Trigger Yahoo refresh. `force=false` honors the 5-min cache window. */
  refresh: (force: boolean) => Promise<void>;
}

export const useStockQuotes = create<State>((set, get) => ({
  quotes: {},
  fxRate: null,
  fxFetchedAt: null,
  loading: false,
  refreshing: false,
  refreshError: null,

  load: async () => {
    set({ loading: true });
    try {
      const rows = await api.getStockQuotes();
      const map: Record<string, StockQuote> = {};
      for (const q of rows) map[quoteKey(q.symbol, q.market)] = q;
      set({ quotes: map, loading: false });
    } catch (e) {
      set({ loading: false, refreshError: String(e) });
    }
  },

  refresh: async (force: boolean) => {
    if (get().refreshing) return;
    set({ refreshing: true, refreshError: null });
    try {
      const result = await api.refreshStockQuotes(force);
      const map: Record<string, StockQuote> = {};
      for (const q of result.quotes) {
        map[quoteKey(q.symbol, q.market)] = q;
      }
      set({
        quotes: map,
        fxRate: result.fx_rate,
        fxFetchedAt: result.fx_fetched_at,
        refreshing: false,
        refreshError:
          result.failed_symbols.length > 0
            ? `partial: ${result.failed_symbols
                .map((f) => f.symbol)
                .join(", ")}`
            : null,
      });
    } catch (e) {
      set({ refreshing: false, refreshError: String(e) });
    }
  },
}));

export function priceFor(
  quotes: Record<string, StockQuote>,
  symbol: string,
  market: StockMarket,
): StockQuote | undefined {
  return quotes[quoteKey(symbol, market)];
}
