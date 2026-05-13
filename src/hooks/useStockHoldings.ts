import { create } from "zustand";
import { api } from "../lib/api";
import type { StockHolding } from "../types/stocks";

interface State {
  holdings: StockHolding[];
  loading: boolean;
  error: string | null;

  load: () => Promise<void>;
  upsert: (h: StockHolding) => Promise<void>;
  remove: (symbol: string, market: string) => Promise<void>;
}

const keyOf = (h: { symbol: string; market: string }) =>
  `${h.symbol}::${h.market}`;

const sortHoldings = (rows: StockHolding[]): StockHolding[] =>
  [...rows].sort((a, b) => a.symbol.localeCompare(b.symbol));

export const useStockHoldings = create<State>((set, get) => ({
  holdings: [],
  loading: false,
  error: null,

  load: async () => {
    set({ loading: true, error: null });
    try {
      const rows = await api.getStockHoldings();
      set({ holdings: sortHoldings(rows), loading: false });
    } catch (e) {
      set({ loading: false, error: String(e) });
    }
  },

  upsert: async (h) => {
    const prev = get().holdings;
    const k = keyOf(h);
    const next = sortHoldings([...prev.filter((x) => keyOf(x) !== k), h]);
    set({ holdings: next });
    try {
      await api.upsertStockHolding(h);
    } catch (e) {
      set({ holdings: prev, error: String(e) });
    }
  },

  remove: async (symbol, market) => {
    const prev = get().holdings;
    const k = `${symbol}::${market}`;
    set({ holdings: prev.filter((x) => keyOf(x) !== k) });
    try {
      await api.deleteStockHolding(symbol, market);
    } catch (e) {
      set({ holdings: prev, error: String(e) });
    }
  },
}));
