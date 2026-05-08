import { useEffect } from "react";
import { HeroSection } from "./components/HeroSection";
import { MonthlyStats } from "./components/MonthlyStats";
import { PnlCalendar } from "./components/PnlCalendar";
import { Sidebar } from "./components/Sidebar";
import { TradingGrid } from "./components/TradingGrid";
import { UpdateNotification } from "./components/UpdateNotification";
import { useTradingDays } from "./hooks/useTradingDays";
import { useSettings } from "./hooks/useSettings";
import { useDocumentLang, useLocaleStore } from "./i18n";

export default function App() {
  const load = useTradingDays((s) => s.load);
  const loadSettings = useSettings((s) => s.load);
  const loadLocale = useLocaleStore((s) => s.load);
  useDocumentLang();

  useEffect(() => {
    load();
    loadSettings();
    loadLocale();
  }, [load, loadSettings, loadLocale]);

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">
        <HeroSection />
        <section className="dashboard-row">
          <MonthlyStats />
          <PnlCalendar />
        </section>
        <TradingGrid />
      </main>
      <UpdateNotification />
    </div>
  );
}
