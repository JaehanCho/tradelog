import type { ComputedTradingDay, TradingDay } from "../types/trading-day";

/**
 * Compute derived fields from a chronologically sorted list of trading days.
 *
 * Definitions (from spec §3 + ADR-005):
 *   start_balance(t)  = end_balance(prev) + deposit(t) - withdrawal(prev)
 *                       (first row: start_balance = deposit if end_balance present,
 *                        otherwise null until first end_balance arrives)
 *   daily_pnl(t)      = end_balance(t) - start_balance(t)
 *   daily_return(t)   = daily_pnl(t) / start_balance(t)   (start_balance == 0 -> 0)
 *   cumulative_pnl(t) = SUM(daily_pnl) up to and including t
 *   cumulative_return(t) = cumulative_pnl(t) / capital_in(t)
 *     where capital_in(t) = SUM(deposit) up to t. If the user's first row has
 *     no deposit but an end_balance (importing pre-existing balance), seed
 *     capital_in with that first start_balance.
 *
 * Rows whose end_balance is null are kept in the output (so the grid still
 * shows the user's input) but their daily/cumulative metrics are null and
 * they don't roll the start_balance chain forward.
 */
export function computeTradingDays(
  days: TradingDay[],
): ComputedTradingDay[] {
  if (days.length === 0) return [];

  const result: ComputedTradingDay[] = [];

  let prevEndBalance: number | null = null;
  let prevWithdrawal = 0;
  let cumulativePnl = 0;
  let capitalIn = 0;

  for (let i = 0; i < days.length; i++) {
    const d = days[i];
    capitalIn += d.deposit;

    let startBalance: number | null;
    if (prevEndBalance === null) {
      startBalance = d.end_balance !== null ? d.deposit : null;
    } else {
      startBalance = prevEndBalance + d.deposit - prevWithdrawal;
    }

    let dailyPnl: number | null = null;
    let dailyReturnPct: number | null = null;

    if (d.end_balance !== null && startBalance !== null) {
      dailyPnl = d.end_balance - startBalance;
      dailyReturnPct = startBalance === 0 ? 0 : dailyPnl / startBalance;

      cumulativePnl += dailyPnl;
      // Seed capital baseline if the user is importing a pre-existing balance
      // with no explicit deposit row.
      if (capitalIn === 0 && startBalance !== 0) {
        capitalIn = startBalance;
      }
    }

    let cumulativePnlOut: number | null = null;
    let cumulativeReturnPct: number | null = null;
    if (d.end_balance !== null) {
      cumulativePnlOut = cumulativePnl;
      cumulativeReturnPct = capitalIn === 0 ? 0 : cumulativePnl / capitalIn;
    }

    result.push({
      ...d,
      start_balance: startBalance,
      daily_pnl: dailyPnl,
      daily_return_pct: dailyReturnPct,
      cumulative_pnl: cumulativePnlOut,
      cumulative_return_pct: cumulativeReturnPct,
    });

    // Only roll the chain forward when this row "completes" — both
    // end_balance and withdrawal advance together to keep the invariant
    // documented above (null-end_balance rows do not roll the chain).
    if (d.end_balance !== null) {
      prevEndBalance = d.end_balance;
      prevWithdrawal = d.withdrawal;
    }
  }

  return result;
}
