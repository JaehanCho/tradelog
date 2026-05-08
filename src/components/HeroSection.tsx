import { useViewMode } from "../hooks/useViewMode";
import { BalanceDisplay } from "./BalanceDisplay";
import { CumulativeReturn } from "./CumulativeReturn";
import { EquityCurve } from "./EquityCurve";
import { GoalProgress } from "./GoalProgress";

export function HeroSection() {
  const view = useViewMode((s) => s.view);
  const showTradingExtras = view === "trading";

  return (
    <section className="hero">
      <div className="hero-stats">
        <BalanceDisplay />
        {showTradingExtras && (
          <>
            <CumulativeReturn />
            <GoalProgress />
          </>
        )}
      </div>
      {showTradingExtras && (
        <div className="hero-chart">
          <EquityCurve />
        </div>
      )}
    </section>
  );
}
