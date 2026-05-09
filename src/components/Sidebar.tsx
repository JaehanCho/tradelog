import { useEffect, useRef, useState } from "react";
import { getVersion } from "@tauri-apps/api/app";
import { useTradingDays } from "../hooks/useTradingDays";
import { useViewMode, type View } from "../hooks/useViewMode";
import { useT } from "../i18n";
import { LanguageToggle } from "./LanguageToggle";
import { MonthPickerPopover } from "./MonthPickerPopover";
import { triggerUpdateCheck } from "./UpdateNotification";

export function Sidebar() {
  const monthFilter = useTradingDays((s) => s.monthFilter);
  const view = useViewMode((s) => s.view);
  const setView = useViewMode((s) => s.setView);
  const [version, setVersion] = useState<string>("");
  const [pickerAnchor, setPickerAnchor] = useState<HTMLElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const t = useT();

  useEffect(() => {
    getVersion()
      .then(setVersion)
      .catch(() => setVersion(""));
  }, []);

  const sections: Array<{ key: View; label: string }> = [
    { key: "trading", label: t.sidebar.sectionTrading },
    { key: "defi", label: t.sidebar.sectionDefi },
    { key: "wisdom", label: t.sidebar.sectionWisdom },
  ];

  function togglePicker() {
    if (pickerAnchor) {
      setPickerAnchor(null);
    } else if (triggerRef.current) {
      setPickerAnchor(triggerRef.current);
    }
  }

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
              <button
                ref={triggerRef}
                type="button"
                className={`sidebar-month-trigger ${
                  monthFilter ? "has-filter" : ""
                } ${pickerAnchor ? "is-open" : ""}`}
                onClick={togglePicker}
                title={t.monthPicker.openLabel}
                aria-haspopup="dialog"
                aria-expanded={pickerAnchor ? "true" : "false"}
              >
                <span className="sidebar-month-icon" aria-hidden="true">
                  <svg viewBox="0 0 12 12" width="12" height="12">
                    <rect
                      x="1"
                      y="2.5"
                      width="10"
                      height="8.5"
                      rx="1.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                    />
                    <line
                      x1="1"
                      y1="5"
                      x2="11"
                      y2="5"
                      stroke="currentColor"
                      strokeWidth="1"
                    />
                    <line
                      x1="3.5"
                      y1="1"
                      x2="3.5"
                      y2="3.5"
                      stroke="currentColor"
                      strokeWidth="1"
                      strokeLinecap="round"
                    />
                    <line
                      x1="8.5"
                      y1="1"
                      x2="8.5"
                      y2="3.5"
                      stroke="currentColor"
                      strokeWidth="1"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <span className="sidebar-month-label">
                  {monthFilter ?? t.sidebar.all}
                </span>
              </button>
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
      {pickerAnchor && (
        <MonthPickerPopover
          anchor={pickerAnchor}
          onClose={() => setPickerAnchor(null)}
        />
      )}
    </aside>
  );
}
