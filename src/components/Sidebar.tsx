import { useEffect, useMemo, useState } from "react";
import { getVersion } from "@tauri-apps/api/app";
import { useTradingDays } from "../hooks/useTradingDays";
import { useT } from "../i18n";
import { LanguageToggle } from "./LanguageToggle";
import { triggerUpdateCheck } from "./UpdateNotification";

export function Sidebar() {
  const computed = useTradingDays((s) => s.computed);
  const monthFilter = useTradingDays((s) => s.monthFilter);
  const setMonthFilter = useTradingDays((s) => s.setMonthFilter);
  const [version, setVersion] = useState<string>("");
  const t = useT();

  useEffect(() => {
    getVersion()
      .then(setVersion)
      .catch(() => setVersion(""));
  }, []);

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
        <div className="sidebar-section-label">{t.sidebar.monthLabel}</div>
        <button
          className={`sidebar-link ${monthFilter === null ? "active" : ""}`}
          onClick={() => setMonthFilter(null)}
        >
          {t.sidebar.all}
        </button>
        {months.length === 0 && (
          <div className="sidebar-empty">{t.sidebar.noData}</div>
        )}
        {months.map((m) => (
          <button
            key={m}
            className={`sidebar-link ${monthFilter === m ? "active" : ""}`}
            onClick={() => setMonthFilter(monthFilter === m ? null : m)}
          >
            {m}
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <LanguageToggle />
        <span className="sidebar-version">{version ? `v${version}` : ""}</span>
        <button
          className="sidebar-update-link"
          onClick={() => triggerUpdateCheck()}
          title={t.sidebar.updateCheckTitle}
        >
          {t.sidebar.updateCheck}
        </button>
      </div>
    </aside>
  );
}
