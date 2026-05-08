import { create } from "zustand";
import { api } from "../lib/api";
import { computeTradingDays } from "../lib/compute";
import type { ComputedTradingDay, TradingDay } from "../types/trading-day";

type HistoryEntry = TradingDay[];

interface State {
  raw: TradingDay[];
  /** Last server-confirmed state. Used as the rollback target on optimistic write failure. */
  confirmed: TradingDay[];
  computed: ComputedTradingDay[];
  loading: boolean;
  error: string | null;

  history: HistoryEntry[];
  historyIdx: number;

  load: () => Promise<void>;
  upsertOne: (day: TradingDay) => Promise<void>;
  upsertMany: (days: TradingDay[]) => Promise<void>;
  remove: (tradeDate: string) => Promise<void>;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
}

const sortByDate = (rows: TradingDay[]) =>
  [...rows].sort((a, b) => a.trade_date.localeCompare(b.trade_date));

const merge = (existing: TradingDay[], incoming: TradingDay[]): TradingDay[] => {
  const map = new Map(existing.map((r) => [r.trade_date, r]));
  for (const r of incoming) map.set(r.trade_date, r);
  return sortByDate(Array.from(map.values()));
};

export const useTradingDays = create<State>((set, get) => ({
  raw: [],
  confirmed: [],
  computed: [],
  loading: false,
  error: null,
  history: [],
  historyIdx: -1,

  load: async () => {
    set({ loading: true, error: null });
    try {
      const rows = await api.getAll();
      const sorted = sortByDate(rows);
      set({
        raw: sorted,
        confirmed: sorted,
        computed: computeTradingDays(sorted),
        loading: false,
        history: [sorted],
        historyIdx: 0,
      });
    } catch (e) {
      set({ loading: false, error: String(e) });
    }
  },

  upsertOne: async (day) => {
    const prevConfirmed = get().confirmed;
    const next = merge(get().raw, [day]);
    set(pushHistory(next, get));
    try {
      await api.upsert(day);
      // Only advance confirmed if no newer write has overwritten our work.
      if (get().raw === next) set({ confirmed: next });
      else set({ confirmed: merge(get().confirmed, [day]) });
    } catch (e) {
      // Roll back optimistic change to the last confirmed snapshot.
      set({
        error: String(e),
        raw: prevConfirmed,
        computed: computeTradingDays(prevConfirmed),
      });
    }
  },

  upsertMany: async (days) => {
    if (days.length === 0) return;
    const prevConfirmed = get().confirmed;
    const next = merge(get().raw, days);
    set(pushHistory(next, get));
    try {
      await api.upsertMany(days);
      if (get().raw === next) set({ confirmed: next });
      else set({ confirmed: merge(get().confirmed, days) });
    } catch (e) {
      set({
        error: String(e),
        raw: prevConfirmed,
        computed: computeTradingDays(prevConfirmed),
      });
    }
  },

  remove: async (tradeDate) => {
    const prevConfirmed = get().confirmed;
    const next = get().raw.filter((r) => r.trade_date !== tradeDate);
    set(pushHistory(next, get));
    try {
      await api.delete(tradeDate);
      if (get().raw === next) set({ confirmed: next });
      else
        set({
          confirmed: get().confirmed.filter((r) => r.trade_date !== tradeDate),
        });
    } catch (e) {
      set({
        error: String(e),
        raw: prevConfirmed,
        computed: computeTradingDays(prevConfirmed),
      });
    }
  },

  undo: async () => {
    const { history, historyIdx } = get();
    if (historyIdx <= 0) return;
    const target = history[historyIdx - 1];
    const prevConfirmed = get().confirmed;
    set({
      raw: target,
      computed: computeTradingDays(target),
      historyIdx: historyIdx - 1,
    });
    try {
      // replace_all so rows added-then-undone actually disappear from disk.
      await api.replaceAll(target);
      set({ confirmed: target });
    } catch (e) {
      // Roll the index back; restore prior confirmed state.
      set({
        error: String(e),
        raw: prevConfirmed,
        computed: computeTradingDays(prevConfirmed),
        historyIdx,
      });
    }
  },

  redo: async () => {
    const { history, historyIdx } = get();
    if (historyIdx >= history.length - 1) return;
    const target = history[historyIdx + 1];
    const prevConfirmed = get().confirmed;
    set({
      raw: target,
      computed: computeTradingDays(target),
      historyIdx: historyIdx + 1,
    });
    try {
      await api.replaceAll(target);
      set({ confirmed: target });
    } catch (e) {
      set({
        error: String(e),
        raw: prevConfirmed,
        computed: computeTradingDays(prevConfirmed),
        historyIdx,
      });
    }
  },
}));

function pushHistory(next: TradingDay[], get: () => State): Partial<State> {
  const { history, historyIdx } = get();
  const trimmed = history.slice(0, historyIdx + 1);
  trimmed.push(next);
  const cap = trimmed.slice(Math.max(0, trimmed.length - 50));
  return {
    raw: next,
    computed: computeTradingDays(next),
    history: cap,
    historyIdx: cap.length - 1,
  };
}
