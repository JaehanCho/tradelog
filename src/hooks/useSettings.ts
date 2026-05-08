import { create } from "zustand";
import { api } from "../lib/api";

interface SettingsState {
  goalBalance: number;
  goalDate: string;
  loaded: boolean;
  load: () => Promise<void>;
  setGoal: (balance: number, date: string) => Promise<void>;
}

export const useSettings = create<SettingsState>((set) => ({
  goalBalance: 500_000,
  goalDate: "2028-12-31",
  loaded: false,

  load: async () => {
    try {
      const s = await api.getSettings();
      const goalBalance = Number(s.goal_balance ?? 500_000);
      const goalDate = s.goal_date ?? "2028-12-31";
      set({
        goalBalance: Number.isFinite(goalBalance) ? goalBalance : 500_000,
        goalDate,
        loaded: true,
      });
    } catch {
      set({ loaded: true });
    }
  },

  setGoal: async (balance, date) => {
    set({ goalBalance: balance, goalDate: date });
    await Promise.all([
      api.setSetting("goal_balance", String(balance)),
      api.setSetting("goal_date", date),
    ]);
  },
}));
