import { create } from "zustand";
import { api } from "../lib/api";

export type View = "trading" | "defi" | "stocks" | "wisdom";

interface ViewModeState {
  view: View;
  loaded: boolean;
  load: () => Promise<void>;
  setView: (next: View) => Promise<void>;
}

const isView = (v: string | undefined): v is View =>
  v === "trading" || v === "defi" || v === "stocks" || v === "wisdom";

export const useViewMode = create<ViewModeState>((set) => ({
  view: "trading",
  loaded: false,

  load: async () => {
    try {
      const s = await api.getSettings();
      const raw = s.last_view;
      set({ view: isView(raw) ? raw : "trading", loaded: true });
    } catch {
      set({ loaded: true });
    }
  },

  setView: async (next) => {
    set({ view: next });
    try {
      await api.setSetting("last_view", next);
    } catch (e) {
      console.error("[viewMode] failed to persist view:", e);
    }
  },
}));
