import { create } from "zustand";
import { api } from "../lib/api";
import type { StockWatch } from "../types/stocks";

interface State {
  watches: StockWatch[];
  loading: boolean;
  error: string | null;

  load: () => Promise<void>;
  upsert: (w: StockWatch) => Promise<void>;
  remove: (symbol: string, market: string) => Promise<void>;
}

const keyOf = (w: { symbol: string; market: string }) =>
  `${w.symbol}::${w.market}`;

const sortWatches = (rows: StockWatch[]): StockWatch[] =>
  [...rows].sort((a, b) => a.symbol.localeCompare(b.symbol));

export const useStockWatches = create<State>((set, get) => ({
  watches: [],
  loading: false,
  error: null,

  load: async () => {
    set({ loading: true, error: null });
    try {
      const rows = await api.getStockWatches();
      set({ watches: sortWatches(rows), loading: false });
    } catch (e) {
      set({ loading: false, error: String(e) });
    }
  },

  upsert: async (w) => {
    const prev = get().watches;
    const k = keyOf(w);
    const next = sortWatches([...prev.filter((x) => keyOf(x) !== k), w]);
    set({ watches: next });
    try {
      await api.upsertStockWatch(w);
    } catch (e) {
      set({ watches: prev, error: String(e) });
    }
  },

  remove: async (symbol, market) => {
    const prev = get().watches;
    const k = `${symbol}::${market}`;
    set({ watches: prev.filter((x) => keyOf(x) !== k) });
    try {
      await api.deleteStockWatch(symbol, market);
    } catch (e) {
      set({ watches: prev, error: String(e) });
    }
  },
}));
