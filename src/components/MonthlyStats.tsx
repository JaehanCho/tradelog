import { useMemo } from "react";
import { useTradingDays } from "../hooks/useTradingDays";
import { useT } from "../i18n";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  signDisplay: "exceptZero",
  maximumFractionDigits: 0,
});
const pct = new Intl.NumberFormat("ko-KR", {
  style: "percent",
  signDisplay: "exceptZero",
  minimumFractionDigits: 1,
  maximumFractionDigits: 2,
});

export function MonthlyStats() {
  const computed = useTradingDays((s) => s.computed);
  const monthFilter = useTradingDays((s) => s.monthFilter);
  const t = useT();

  const stats = useMemo(() => {
    const rows = (
      monthFilter
        ? computed.filter((r) => r.trade_date.startsWith(monthFilter))
        : computed
    ).filter((r) => r.daily_pnl !== null);
    const total = rows.reduce((s, r) => s + (r.daily_pnl ?? 0), 0);
    const wins = rows.filter((r) => (r.daily_pnl ?? 0) > 0).length;
    const losses = rows.filter((r) => (r.daily_pnl ?? 0) < 0).length;
    const tradedDays = wins + losses;
    const winRate = tradedDays === 0 ? 0 : wins / tradedDays;
    const avg = rows.length === 0 ? 0 : total / rows.length;

    // Return % vs start_balance of first row in the window.
    const first = rows[0];
    const periodReturn =
      first && first.start_balance && first.start_balance !== 0
        ? total / first.start_balance
        : 0;

    return { total, winRate, avg, count: rows.length, wins, losses, periodReturn };
  }, [computed, monthFilter]);

  const label = monthFilter
    ? t.monthStats.statsMonth(monthFilter)
    : t.monthStats.statsAll;

  const sign = (v: number) => (v > 0 ? "positive" : v < 0 ? "negative" : "");

  return (
    <section className="month-stats">
      <div className="month-stats-header">
        <span className="month-stats-label">{label}</span>
        <span className="month-stats-count">
          {t.monthStats.tradingDays(stats.count)}
        </span>
      </div>
      <div className="month-stats-grid">
        <div className="stat-card">
          <div className="stat-card-label">{t.monthStats.totalPnl}</div>
          <div className={`stat-card-value ${sign(stats.total)}`}>
            {usd.format(stats.total)}
          </div>
          <div className={`stat-card-sub ${sign(stats.periodReturn)}`}>
            {pct.format(stats.periodReturn)} {t.monthStats.vsStart}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">{t.monthStats.winRate}</div>
          <div className="stat-card-value">
            {(stats.winRate * 100).toFixed(1)}%
          </div>
          <div className="stat-card-sub">
            <span className="positive">{t.monthStats.wins(stats.wins)}</span>{" "}
            <span className="negative">{t.monthStats.losses(stats.losses)}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">{t.monthStats.avgDaily}</div>
          <div className={`stat-card-value ${sign(stats.avg)}`}>
            {usd.format(stats.avg)}
          </div>
          <div className="stat-card-sub">{t.monthStats.perDay}</div>
        </div>
      </div>
    </section>
  );
}
