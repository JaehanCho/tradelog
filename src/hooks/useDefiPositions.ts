import { create } from "zustand";
import { api } from "../lib/api";
import type { DefiPosition, DefiSnapshot } from "../types/defi";

interface State {
  positions: DefiPosition[];
  /** Map keyed by position_id → snapshots (sorted desc by date). */
  snapshotsByPosition: Record<string, DefiSnapshot[]>;
  loading: boolean;
  error: string | null;

  load: () => Promise<void>;
  loadSnapshots: (positionId: string) => Promise<void>;
  upsertPosition: (p: DefiPosition) => Promise<void>;
  deletePosition: (id: string) => Promise<void>;
  addSnapshot: (s: DefiSnapshot) => Promise<void>;
  deleteSnapshot: (positionId: string, id: string) => Promise<void>;
}

const sortPositions = (rows: DefiPosition[]): DefiPosition[] =>
  [...rows].sort((a, b) => {
    // Active first (closed_date null), then by opened_date desc.
    const aClosed = a.closed_date != null ? 1 : 0;
    const bClosed = b.closed_date != null ? 1 : 0;
    if (aClosed !== bClosed) return aClosed - bClosed;
    return b.opened_date.localeCompare(a.opened_date);
  });

const sortSnapshots = (rows: DefiSnapshot[]): DefiSnapshot[] =>
  [...rows].sort((a, b) => b.snapshot_date.localeCompare(a.snapshot_date));

export const useDefiPositions = create<State>((set, get) => ({
  positions: [],
  snapshotsByPosition: {},
  loading: false,
  error: null,

  load: async () => {
    set({ loading: true, error: null });
    try {
      const positions = await api.getDefiPositions();
      set({ positions: sortPositions(positions), loading: false });
      // Eagerly load snapshots for each position so latest values are
      // available for the total-equity selector.
      await Promise.all(
        positions.map(async (p) => {
          try {
            const snaps = await api.getPositionSnapshots(p.id);
            set((s) => ({
              snapshotsByPosition: {
                ...s.snapshotsByPosition,
                [p.id]: sortSnapshots(snaps),
              },
            }));
          } catch (e) {
            console.error("[defi] load snapshots failed:", p.id, e);
          }
        }),
      );
    } catch (e) {
      set({ loading: false, error: String(e) });
    }
  },

  loadSnapshots: async (positionId) => {
    try {
      const snaps = await api.getPositionSnapshots(positionId);
      set((s) => ({
        snapshotsByPosition: {
          ...s.snapshotsByPosition,
          [positionId]: sortSnapshots(snaps),
        },
      }));
    } catch (e) {
      console.error("[defi] loadSnapshots failed:", positionId, e);
    }
  },

  upsertPosition: async (p) => {
    const prev = get().positions;
    const next = sortPositions([
      ...prev.filter((x) => x.id !== p.id),
      p,
    ]);
    set({ positions: next });
    try {
      await api.upsertDefiPosition(p);
    } catch (e) {
      set({ positions: prev, error: String(e) });
    }
  },

  deletePosition: async (id) => {
    const prev = get().positions;
    const prevSnaps = get().snapshotsByPosition;
    set({
      positions: prev.filter((p) => p.id !== id),
      snapshotsByPosition: Object.fromEntries(
        Object.entries(prevSnaps).filter(([k]) => k !== id),
      ),
    });
    try {
      await api.deleteDefiPosition(id);
    } catch (e) {
      set({ positions: prev, snapshotsByPosition: prevSnaps, error: String(e) });
    }
  },

  addSnapshot: async (s) => {
    const prev = get().snapshotsByPosition;
    const list = prev[s.position_id] ?? [];
    const next = sortSnapshots([...list, s]);
    set({
      snapshotsByPosition: { ...prev, [s.position_id]: next },
    });
    try {
      await api.addPositionSnapshot(s);
    } catch (e) {
      set({ snapshotsByPosition: prev, error: String(e) });
    }
  },

  deleteSnapshot: async (positionId, id) => {
    const prev = get().snapshotsByPosition;
    const list = prev[positionId] ?? [];
    set({
      snapshotsByPosition: {
        ...prev,
        [positionId]: list.filter((x) => x.id !== id),
      },
    });
    try {
      await api.deletePositionSnapshot(id);
    } catch (e) {
      set({ snapshotsByPosition: prev, error: String(e) });
    }
  },
}));

/** Latest snapshot for a position, or null if no snapshots yet. */
export function latestSnapshot(
  snapshots: DefiSnapshot[] | undefined,
): DefiSnapshot | null {
  return snapshots && snapshots.length > 0 ? snapshots[0] : null;
}
