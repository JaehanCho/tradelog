import { useMemo } from "react";
import { useTradingDays } from "../hooks/useTradingDays";

export function Sidebar() {
  const computed = useTradingDays((s) => s.computed);

  const months = useMemo(() => {
    const set = new Set<string>();
    for (const r of computed) set.add(r.trade_date.slice(0, 7));
    return Array.from(set).sort().reverse();
  }, [computed]);

  return (
    <aside className="app-sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">TradeLog</span>
      </div>
      <nav className="sidebar-nav">
        <div className="sidebar-section-label">월별</div>
        {months.length === 0 && (
          <div className="sidebar-empty">데이터 없음</div>
        )}
        {months.map((m) => (
          <a key={m} href={`#${m}`} className="sidebar-link">
            {m}
          </a>
        ))}
      </nav>
    </aside>
  );
}
