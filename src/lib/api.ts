import { invoke } from "@tauri-apps/api/core";
import type { TradingDay } from "../types/trading-day";

export const api = {
  getAll: () => invoke<TradingDay[]>("get_all_trading_days"),
  getRange: (from: string, to: string) =>
    invoke<TradingDay[]>("get_trading_days_range", { from, to }),
  upsert: (day: TradingDay) => invoke<void>("upsert_trading_day", { day }),
  upsertMany: (days: TradingDay[]) =>
    invoke<void>("upsert_trading_days", { days }),
  delete: (tradeDate: string) =>
    invoke<void>("delete_trading_day", { tradeDate }),
  replaceAll: (days: TradingDay[]) =>
    invoke<void>("replace_all_trading_days", { days }),
};
