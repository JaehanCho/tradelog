import { invoke } from "@tauri-apps/api/core";
import {
  readText as clipboardReadText,
  writeText as clipboardWriteText,
} from "@tauri-apps/plugin-clipboard-manager";
import type { DefiPosition, DefiSnapshot } from "../types/defi";
import type { TradingDay } from "../types/trading-day";
import type { WisdomNote } from "../types/wisdom";

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
  renameOrUpsert: (oldTradeDate: string, day: TradingDay) =>
    invoke<void>("rename_or_upsert_trading_day", { oldTradeDate, day }),
  getSettings: () => invoke<Record<string, string>>("get_settings"),
  setSetting: (key: string, value: string) =>
    invoke<void>("set_setting", { key, value }),
  // DeFi
  getDefiPositions: () => invoke<DefiPosition[]>("get_defi_positions"),
  upsertDefiPosition: (position: DefiPosition) =>
    invoke<void>("upsert_defi_position", { position }),
  deleteDefiPosition: (id: string) =>
    invoke<void>("delete_defi_position", { id }),
  getPositionSnapshots: (positionId: string) =>
    invoke<DefiSnapshot[]>("get_position_snapshots", { positionId }),
  addPositionSnapshot: (snapshot: DefiSnapshot) =>
    invoke<void>("add_position_snapshot", { snapshot }),
  deletePositionSnapshot: (id: string) =>
    invoke<void>("delete_position_snapshot", { id }),
  // Wisdom
  getWisdomNotes: () => invoke<WisdomNote[]>("get_wisdom_notes"),
  upsertWisdomNote: (note: WisdomNote) =>
    invoke<void>("upsert_wisdom_note", { note }),
  deleteWisdomNote: (id: string) =>
    invoke<void>("delete_wisdom_note", { id }),
  // Tauri's native clipboard avoids macOS's "Allow paste from <App>" prompt
  // that navigator.clipboard.readText() triggers on each paste.
  clipboardRead: async (): Promise<string> =>
    (await clipboardReadText()) ?? "",
  clipboardWrite: (text: string) => clipboardWriteText(text),
};
