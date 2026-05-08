import { useEffect } from "react";
import { HeroSection } from "./components/HeroSection";
import { TradingGrid } from "./components/TradingGrid";
import { Sidebar } from "./components/Sidebar";
import { UpdateNotification } from "./components/UpdateNotification";
import { useTradingDays } from "./hooks/useTradingDays";

export default function App() {
  const load = useTradingDays((s) => s.load);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">
        <HeroSection />
        <TradingGrid />
      </main>
      <UpdateNotification />
    </div>
  );
}
