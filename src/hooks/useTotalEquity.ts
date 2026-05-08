import { latestSnapshot, useDefiPositions } from "./useDefiPositions";
import { useTradingDays } from "./useTradingDays";

export interface SectorBreakdown {
  trading: number;
  defi: number;
  total: number;
  /** Each sector's share of `total` in [0, 1]. Both 0 if total === 0. */
  tradingPct: number;
  defiPct: number;
}

/**
 * Total assets across all sectors. Trading is the latest non-null
 * `end_balance`; DeFi is the sum of each active position's latest snapshot
 * `value_usd`. Closed positions are excluded.
 */
export function useTotalEquity(): SectorBreakdown {
  const computed = useTradingDays((s) => s.computed);
  const positions = useDefiPositions((s) => s.positions);
  const snapshotsByPosition = useDefiPositions((s) => s.snapshotsByPosition);

  // Trading equity = the latest completed day's end_balance MINUS that day's
  // withdrawal. Per compute.ts the chain rolls `start(t+1) = end(t) +
  // deposit(t+1) - withdrawal(t)`, so end_balance is the pre-withdrawal
  // close — subtracting the same row's withdrawal yields the actual cash
  // sitting in the trading account right now.
  const lastCompleted = [...computed]
    .reverse()
    .find((r) => r.end_balance !== null);
  const trading = lastCompleted
    ? (lastCompleted.end_balance ?? 0) - (lastCompleted.withdrawal ?? 0)
    : 0;

  const defi = positions
    .filter((p) => p.closed_date == null)
    .reduce((sum, p) => {
      const snap = latestSnapshot(snapshotsByPosition[p.id]);
      // If no snapshot yet, fall back to principal so the position still
      // shows up in the total instead of being silently 0.
      return sum + (snap?.value_usd ?? p.principal_usd);
    }, 0);

  const total = trading + defi;
  const tradingPct = total > 0 ? trading / total : 0;
  const defiPct = total > 0 ? defi / total : 0;

  return { trading, defi, total, tradingPct, defiPct };
}
