import { useMemo } from "react";
import { useTradingDays } from "../hooks/useTradingDays";
import { useT } from "../i18n";

const MAX_MONTHS = 12;

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  signDisplay: "exceptZero",
  maximumFractionDigits: 0,
});

interface MonthBar {
  ym: string;
  monthLabel: string;
  yearLabel: string;
  total: number;
}

export function MonthlyPnlBars() {
  const computed = useTradingDays((s) => s.computed);
  const monthFilter = useTradingDays((s) => s.monthFilter);
  const setMonthFilter = useTradingDays((s) => s.setMonthFilter);
  const t = useT();

  const bars = useMemo<MonthBar[]>(() => {
    const byMonth = new Map<string, number>();
    for (const r of computed) {
      if (r.daily_pnl == null) continue;
      const ym = r.trade_date.slice(0, 7);
      byMonth.set(ym, (byMonth.get(ym) ?? 0) + r.daily_pnl);
    }
    const list = Array.from(byMonth.entries())
      .map(([ym, total]) => {
        const d = new Date(`${ym}-01T00:00:00`);
        return {
          ym,
          total,
          monthLabel: d.toLocaleDateString(undefined, { month: "short" }),
          yearLabel: ym.slice(2, 4),
        };
      })
      .sort((a, b) => (a.ym < b.ym ? 1 : -1));
    return list.slice(0, MAX_MONTHS);
  }, [computed]);

  const maxAbs = useMemo(() => {
    let m = 0;
    for (const b of bars) {
      const v = Math.abs(b.total);
      if (v > m) m = v;
    }
    return m === 0 ? 1 : m;
  }, [bars]);

  return (
    <section className="monthly-bars" aria-label={t.monthlyBars.title}>
      <header className="monthly-bars-header">
        <span className="monthly-bars-title">{t.monthlyBars.title}</span>
        <span className="monthly-bars-subtitle">
          {t.monthlyBars.subtitle(bars.length)}
        </span>
      </header>
      {bars.length === 0 ? (
        <div className="monthly-bars-empty">{t.monthlyBars.empty}</div>
      ) : (
        <ul className="monthly-bars-list">
          {bars.map((b) => {
            const pct = (Math.abs(b.total) / maxAbs) * 50;
            const isActive = monthFilter === b.ym;
            const tone =
              b.total > 0 ? "tone-pos" : b.total < 0 ? "tone-neg" : "tone-flat";
            return (
              <li
                key={b.ym}
                className={`monthly-bars-row ${isActive ? "is-active" : ""}`}
              >
                <button
                  type="button"
                  className="monthly-bars-button"
                  onClick={() =>
                    setMonthFilter(monthFilter === b.ym ? null : b.ym)
                  }
                  title={`${b.ym} · ${usd.format(b.total)}`}
                >
                  <span className="monthly-bars-label">
                    <span className="monthly-bars-month">{b.monthLabel}</span>
                    <span className="monthly-bars-year">'{b.yearLabel}</span>
                  </span>
                  <span className="monthly-bars-track" aria-hidden="true">
                    <span className="monthly-bars-zero" />
                    <span
                      className={`monthly-bars-fill ${tone}`}
                      style={{
                        width: `${pct}%`,
                        left: b.total >= 0 ? "50%" : `${50 - pct}%`,
                      }}
                    />
                  </span>
                  <span className={`monthly-bars-value ${tone}`}>
                    {usd.format(b.total)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
