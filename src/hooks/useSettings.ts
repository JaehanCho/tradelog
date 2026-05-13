import { create } from "zustand";
import { api } from "../lib/api";

interface SettingsState {
  goalBalance: number;
  goalDate: string;
  /** Stocks-tab portfolio target (USD). Default 100,000. */
  stocksGoalBalance: number;
  stocksGoalDate: string;
  loaded: boolean;
  load: () => Promise<void>;
  setGoal: (balance: number, date: string) => Promise<void>;
  setStocksGoal: (balance: number, date: string) => Promise<void>;
}

export const useSettings = create<SettingsState>((set) => ({
  goalBalance: 500_000,
  goalDate: "2028-12-31",
  stocksGoalBalance: 100_000,
  stocksGoalDate: "2028-12-31",
  loaded: false,

  load: async () => {
    try {
      const s = await api.getSettings();
      const goalBalance = Number(s.goal_balance ?? 500_000);
      const goalDate = s.goal_date ?? "2028-12-31";
      const stocksGoalBalance = Number(s.stocks_goal_balance ?? 100_000);
      const stocksGoalDate = s.stocks_goal_date ?? "2028-12-31";
      set({
        goalBalance: Number.isFinite(goalBalance) ? goalBalance : 500_000,
        goalDate,
        stocksGoalBalance: Number.isFinite(stocksGoalBalance)
          ? stocksGoalBalance
          : 100_000,
        stocksGoalDate,
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

  setStocksGoal: async (balance, date) => {
    set({ stocksGoalBalance: balance, stocksGoalDate: date });
    await Promise.all([
      api.setSetting("stocks_goal_balance", String(balance)),
      api.setSetting("stocks_goal_date", date),
    ]);
  },
}));
