import { useEffect, useMemo, useState } from "react";
import { useTradingDays } from "../hooks/useTradingDays";
import { useT } from "../i18n";

const usd = new Intl.NumberFormat("en-US", {
  signDisplay: "exceptZero",
  maximumFractionDigits: 0,
});

const fmtCompact = (v: number): string => {
  const abs = Math.abs(v);
  if (abs >= 1000) return `${v >= 0 ? "+" : "-"}${(abs / 1000).toFixed(1)}K`;
  return usd.format(v);
};

function shiftMonth(ym: string, delta: number): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function PnlCalendar() {
  const computed = useTradingDays((s) => s.computed);
  const monthFilter = useTradingDays((s) => s.monthFilter);
  const setMonthFilter = useTradingDays((s) => s.setMonthFilter);
  const t = useT();

  // Default the calendar to the sidebar filter month, or the latest data
  // month, or current KST month.
  const initialMonth = useMemo(() => {
    if (monthFilter) return monthFilter;
    if (computed.length > 0) {
      return computed[computed.length - 1].trade_date.slice(0, 7);
    }
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }, [monthFilter, computed]);

  const [viewMonth, setViewMonth] = useState(initialMonth);
  useEffect(() => {
    if (monthFilter) setViewMonth(monthFilter);
  }, [monthFilter]);

  const pnlByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of computed) {
      if (r.daily_pnl !== null) map.set(r.trade_date, r.daily_pnl);
    }
    return map;
  }, [computed]);

  const cells = useMemo(() => {
    const [y, m] = viewMonth.split("-").map(Number);
    const first = new Date(Date.UTC(y, m - 1, 1));
    const lead = first.getUTCDay(); // 0 (Sun) .. 6 (Sat)
    const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const out: ({ day: number; dateIso: string; pnl: number | null } | null)[] = [];
    for (let i = 0; i < lead; i++) out.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      out.push({ day: d, dateIso: iso, pnl: pnlByDate.get(iso) ?? null });
    }
    while (out.length % 7 !== 0) out.push(null);
    return out;
  }, [viewMonth, pnlByDate]);

  const onMonthClick = () => {
    setMonthFilter(monthFilter === viewMonth ? null : viewMonth);
  };

  return (
    <section className="calendar">
      <div className="calendar-header">
        <button
          className="calendar-nav"
          aria-label={t.calendar.prevMonth}
          onClick={() => setViewMonth(shiftMonth(viewMonth, -1))}
        >
          ◀
        </button>
        <button
          className={`calendar-month-btn ${
            monthFilter === viewMonth ? "active" : ""
          }`}
          onClick={onMonthClick}
          title={t.calendar.monthFilterTitle}
        >
          {viewMonth}
        </button>
        <button
          className="calendar-nav"
          aria-label={t.calendar.nextMonth}
          onClick={() => setViewMonth(shiftMonth(viewMonth, 1))}
        >
          ▶
        </button>
      </div>

      <div className="calendar-weekdays">
        {t.calendar.weekdays.map((d, i) => (
          <div
            key={d}
            className={`calendar-weekday ${i === 0 ? "sun" : ""} ${i === 6 ? "sat" : ""}`}
          >
            {d}
          </div>
        ))}
      </div>

      <div className="calendar-grid">
        {cells.map((c, i) =>
          c === null ? (
            <div key={`pad-${i}`} className="calendar-cell calendar-empty" />
          ) : (
            <div
              key={c.dateIso}
              className={`calendar-cell ${
                c.pnl === null
                  ? ""
                  : c.pnl > 0
                    ? "positive"
                    : c.pnl < 0
                      ? "negative"
                      : "flat"
              }`}
              title={
                c.pnl === null
                  ? c.dateIso
                  : `${c.dateIso} · ${usd.format(c.pnl)}`
              }
            >
              <div className="calendar-cell-day">{c.day}</div>
              {c.pnl !== null && (
                <div className="calendar-cell-pnl">{fmtCompact(c.pnl)}</div>
              )}
            </div>
          ),
        )}
      </div>
    </section>
  );
}
