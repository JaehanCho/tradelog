import { describe, expect, it } from "vitest";
import { computeTradingDays } from "./compute";
import type { TradingDay } from "../types/trading-day";

const td = (
  date: string,
  deposit: number,
  end: number | null,
  withdrawal = 0,
  note = "",
): TradingDay => ({
  trade_date: date,
  deposit,
  withdrawal,
  end_balance: end,
  note,
  market_note: "",
});

describe("computeTradingDays", () => {
  it("returns empty array for empty input", () => {
    expect(computeTradingDays([])).toEqual([]);
  });

  it("computes first row with deposit + end_balance", () => {
    const out = computeTradingDays([td("2026-04-01", 10000, 10500)]);
    expect(out[0].start_balance).toBe(10000);
    expect(out[0].daily_pnl).toBe(500);
    expect(out[0].daily_return_pct).toBeCloseTo(0.05);
    expect(out[0].cumulative_pnl).toBe(500);
    expect(out[0].cumulative_return_pct).toBeCloseTo(0.05);
  });

  it("computes 3-day chain without further deposits", () => {
    const out = computeTradingDays([
      td("2026-04-01", 10000, 10500),
      td("2026-04-02", 0, 11000),
      td("2026-04-03", 0, 10800),
    ]);

    expect(out[1].start_balance).toBe(10500);
    expect(out[1].daily_pnl).toBe(500);
    expect(out[1].cumulative_pnl).toBe(1000);
    expect(out[1].cumulative_return_pct).toBeCloseTo(0.1);

    expect(out[2].start_balance).toBe(11000);
    expect(out[2].daily_pnl).toBe(-200);
    expect(out[2].cumulative_pnl).toBe(800);
    expect(out[2].cumulative_return_pct).toBeCloseTo(0.08);
  });

  it("rolls start_balance forward when end_balance is null", () => {
    const out = computeTradingDays([
      td("2026-04-01", 10000, 10500),
      td("2026-04-02", 0, null),
      td("2026-04-03", 0, 10800),
    ]);

    expect(out[1].start_balance).toBe(10500);
    expect(out[1].daily_pnl).toBeNull();
    expect(out[1].cumulative_pnl).toBeNull();

    expect(out[2].start_balance).toBe(10500);
    expect(out[2].daily_pnl).toBe(300);
    expect(out[2].cumulative_pnl).toBe(800);
  });

  it("subtracts prior withdrawal from next start_balance", () => {
    const out = computeTradingDays([
      td("2026-04-01", 10000, 10500, 200),
      td("2026-04-02", 0, 10400),
    ]);
    // start_balance(2) = 10500 + 0 - 200 = 10300
    expect(out[1].start_balance).toBe(10300);
    expect(out[1].daily_pnl).toBe(100);
  });

  it("adds mid-stream deposit to next start_balance", () => {
    const out = computeTradingDays([
      td("2026-04-01", 10000, 10500),
      td("2026-04-02", 1000, 11600),
    ]);
    // start_balance(2) = 10500 + 1000 - 0 = 11500
    expect(out[1].start_balance).toBe(11500);
    expect(out[1].daily_pnl).toBe(100);
  });

  it("treats start_balance of zero as 0% daily return", () => {
    const out = computeTradingDays([td("2026-04-01", 0, 0)]);
    expect(out[0].daily_return_pct).toBe(0);
  });

  it("excludes current-day deposit from cumulative-return denominator", () => {
    // initial capital = 10000, cumulative_pnl(2) = 100
    // denom for day 2 = initial(10000) + cumulative_deposits(11000) - day2.deposit(1000) = 20000
    const out = computeTradingDays([
      td("2026-04-01", 10000, 10500),
      td("2026-04-02", 1000, 11600),
    ]);
    expect(out[1].cumulative_pnl).toBe(600);
    expect(out[1].cumulative_return_pct).toBeCloseTo(600 / (10000 + 1000));
  });
});
