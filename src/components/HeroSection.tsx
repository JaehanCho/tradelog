import { BalanceDisplay } from "./BalanceDisplay";
import { CumulativeReturn } from "./CumulativeReturn";
import { EquityCurve } from "./EquityCurve";
import { GoalProgress } from "./GoalProgress";

export function HeroSection() {
  return (
    <section className="hero">
      <div className="hero-stats">
        <BalanceDisplay />
        <CumulativeReturn />
        <GoalProgress />
      </div>
      <div className="hero-chart">
        <EquityCurve />
      </div>
    </section>
  );
}
