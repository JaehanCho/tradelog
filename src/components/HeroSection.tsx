import { BalanceDisplay } from "./BalanceDisplay";
import { CumulativeReturn } from "./CumulativeReturn";
import { EquityCurve } from "./EquityCurve";

export function HeroSection() {
  return (
    <section className="hero">
      <div className="hero-stats">
        <BalanceDisplay />
        <CumulativeReturn />
      </div>
      <div className="hero-chart">
        <EquityCurve />
      </div>
    </section>
  );
}
