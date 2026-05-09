import { useEffect, useMemo, useState } from "react";
import { getVersion } from "@tauri-apps/api/app";
import { useTradingDays } from "../hooks/useTradingDays";
import { useViewMode, type View } from "../hooks/useViewMode";
import { useT } from "../i18n";
import { LanguageToggle } from "./LanguageToggle";
import { triggerUpdateCheck } from "./UpdateNotification";

export function Sidebar() {
  const computed = useTradingDays((s) => s.computed);
  const monthFilter = useTradingDays((s) => s.monthFilter);
  const setMonthFilter = useTradingDays((s) => s.setMonthFilter);
  const view = useViewMode((s) => s.view);
  const setView = useViewMode((s) => s.setView);
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

  const sections: Array<{ key: View; label: string }> = [
    { key: "trading", label: t.sidebar.sectionTrading },
    { key: "defi", label: t.sidebar.sectionDefi },
    { key: "wisdom", label: t.sidebar.sectionWisdom },
  ];

  return (
    <aside className="app-sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">TradeLog</span>
      </div>
      <nav className="sidebar-nav">
        {sections.map((s) => (
          <div key={s.key} className="sidebar-section">
            <button
              className={`sidebar-link ${view === s.key ? "active" : ""}`}
              onClick={() => setView(s.key)}
            >
              {s.label}
            </button>
            {s.key === "trading" && view === "trading" && (
              <div className="sidebar-sub">
                <button
                  className={`sidebar-link sidebar-link-sub ${monthFilter === null ? "active" : ""}`}
                  onClick={() => setMonthFilter(null)}
                >
                  {t.sidebar.all}
                </button>
                {months.length === 0 && (
                  <div className="sidebar-empty sidebar-empty-sub">
                    {t.sidebar.noData}
                  </div>
                )}
                {months.map((m) => (
                  <button
                    key={m}
                    className={`sidebar-link sidebar-link-sub ${monthFilter === m ? "active" : ""}`}
                    onClick={() => setMonthFilter(monthFilter === m ? null : m)}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>
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
