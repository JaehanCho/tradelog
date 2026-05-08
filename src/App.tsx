import { useEffect } from "react";
import { HeroSection } from "./components/HeroSection";
import { MonthlyStats } from "./components/MonthlyStats";
import { PlaceholderView } from "./components/PlaceholderView";
import { PnlCalendar } from "./components/PnlCalendar";
import { Sidebar } from "./components/Sidebar";
import { TradingGrid } from "./components/TradingGrid";
import { UpdateNotification } from "./components/UpdateNotification";
import { useTradingDays } from "./hooks/useTradingDays";
import { useSettings } from "./hooks/useSettings";
import { useViewMode } from "./hooks/useViewMode";
import { useDocumentLang, useLocaleStore, useT } from "./i18n";

export default function App() {
  const load = useTradingDays((s) => s.load);
  const loadSettings = useSettings((s) => s.load);
  const loadLocale = useLocaleStore((s) => s.load);
  const loadView = useViewMode((s) => s.load);
  const view = useViewMode((s) => s.view);
  const t = useT();
  useDocumentLang();

  useEffect(() => {
    load();
    loadSettings();
    loadLocale();
    loadView();
  }, [load, loadSettings, loadLocale, loadView]);

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">
        {view === "trading" && (
          <>
            <HeroSection />
            <section className="dashboard-row">
              <MonthlyStats />
              <PnlCalendar />
            </section>
            <TradingGrid />
          </>
        )}
        {view === "defi" && (
          <PlaceholderView
            title={t.views.defiPlaceholderTitle}
            message={t.views.defiPlaceholderMsg}
          />
        )}
        {view === "wisdom" && (
          <PlaceholderView
            title={t.views.wisdomPlaceholderTitle}
            message={t.views.wisdomPlaceholderMsg}
          />
        )}
      </main>
      <UpdateNotification />
    </div>
  );
}
