import { useEffect } from "react";
import { DefiBoard } from "./components/DefiBoard";
import { HeroSection } from "./components/HeroSection";
import { MonthlyStats } from "./components/MonthlyStats";
import { PnlCalendar } from "./components/PnlCalendar";
import { Sidebar } from "./components/Sidebar";
import { TradingGrid } from "./components/TradingGrid";
import { UpdateNotification } from "./components/UpdateNotification";
import { WisdomBoard } from "./components/WisdomBoard";
import { useDefiPositions } from "./hooks/useDefiPositions";
import { useTradingDays } from "./hooks/useTradingDays";
import { useSettings } from "./hooks/useSettings";
import { useViewMode } from "./hooks/useViewMode";
import { useWisdomNotes } from "./hooks/useWisdomNotes";
import { useDocumentLang, useLocaleStore } from "./i18n";

export default function App() {
  const load = useTradingDays((s) => s.load);
  const loadSettings = useSettings((s) => s.load);
  const loadLocale = useLocaleStore((s) => s.load);
  const loadView = useViewMode((s) => s.load);
  const loadDefi = useDefiPositions((s) => s.load);
  const loadWisdom = useWisdomNotes((s) => s.load);
  const view = useViewMode((s) => s.view);
  useDocumentLang();

  useEffect(() => {
    load();
    loadSettings();
    loadLocale();
    loadView();
    loadDefi();
    loadWisdom();
  }, [load, loadSettings, loadLocale, loadView, loadDefi, loadWisdom]);

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">
        <HeroSection />
        {view === "trading" && (
          <>
            <section className="dashboard-row">
              <MonthlyStats />
              <PnlCalendar />
            </section>
            <TradingGrid />
          </>
        )}
        {view === "defi" && <DefiBoard />}
        {view === "wisdom" && <WisdomBoard />}
      </main>
      <UpdateNotification />
    </div>
  );
}
