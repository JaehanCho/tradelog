import { useEffect } from "react";
import { useStockQuotes } from "../hooks/useStockQuotes";
import { StocksAllocation } from "./StocksAllocation";
import { StocksHero } from "./StocksHero";
import { StocksHoldingsTable } from "./StocksHoldingsTable";
import { StocksNotesFeed } from "./StocksNotesFeed";
import { StocksWatchlist } from "./StocksWatchlist";

/**
 * Stocks dashboard. Vertical bento: hero summary → holdings + allocation
 * row → watchlist pill rail → notes feed.
 */
export function StocksBoard() {
  // Trigger a stale-aware refresh whenever this tab is mounted (= entered).
  const refresh = useStockQuotes((s) => s.refresh);
  useEffect(() => {
    void refresh(false);
  }, [refresh]);

  return (
    <section className="stocks-board">
      <StocksHero />
      <div className="stocks-dashboard-row">
        <StocksHoldingsTable />
        <StocksAllocation />
      </div>
      <StocksWatchlist />
      <StocksNotesFeed />
    </section>
  );
}
