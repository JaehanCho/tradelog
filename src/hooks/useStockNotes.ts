import { create } from "zustand";
import { api } from "../lib/api";
import type { StockNote } from "../types/stocks";

interface State {
  notes: StockNote[];
  loading: boolean;
  error: string | null;

  load: () => Promise<void>;
  /** Returns the upserted note (with its DB-assigned id). */
  upsert: (n: StockNote) => Promise<StockNote>;
  remove: (id: number) => Promise<void>;
}

/** Most recent first; ties broken by id desc so newly inserted notes win. */
const sortNotes = (rows: StockNote[]): StockNote[] =>
  [...rows].sort((a, b) => {
    const byDate = b.note_date.localeCompare(a.note_date);
    if (byDate !== 0) return byDate;
    return (b.id ?? 0) - (a.id ?? 0);
  });

export const useStockNotes = create<State>((set, get) => ({
  notes: [],
  loading: false,
  error: null,

  load: async () => {
    set({ loading: true, error: null });
    try {
      const rows = await api.getStockNotes();
      set({ notes: sortNotes(rows), loading: false });
    } catch (e) {
      set({ loading: false, error: String(e) });
    }
  },

  upsert: async (n) => {
    const prev = get().notes;
    try {
      const id = await api.upsertStockNote(n);
      const saved: StockNote = { ...n, id };
      const next = sortNotes([
        ...prev.filter((x) => x.id !== id),
        saved,
      ]);
      set({ notes: next });
      return saved;
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  remove: async (id) => {
    const prev = get().notes;
    set({ notes: prev.filter((x) => x.id !== id) });
    try {
      await api.deleteStockNote(id);
    } catch (e) {
      set({ notes: prev, error: String(e) });
    }
  },
}));

/** Selector helper: notes filtered to a specific ticker, sorted desc. */
export function notesForTicker(
  notes: StockNote[],
  symbol: string,
  market: string,
): StockNote[] {
  return notes.filter((n) => n.symbol === symbol && n.market === market);
}
