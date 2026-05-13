import { useMemo, useState } from "react";

import { useSettings } from "../hooks/useSettings";
import { useStockHoldings } from "../hooks/useStockHoldings";
import { useStockQuotes } from "../hooks/useStockQuotes";
import { useLocaleStore, useT } from "../i18n";
import {
  computeHoldings,
  formatPctSigned,
  formatSignedUsd,
  formatUsd,
  latestFetchedAt,
  relativeAgo,
  toneOf,
} from "../lib/stocksCompute";
import { StocksGoalEditModal } from "./StocksGoalEditModal";

/**
 * Hero card for the Stocks tab: total assets, cumulative profit, goal
 * progress, and the refresh control. Currency is USD (matches the DeFi
 * tab convention) so users get one number for "my equity wealth."
 */
export function StocksHero() {
  const t = useT();
  const locale = useLocaleStore((s) => s.locale);

  const holdings = useStockHoldings((s) => s.holdings);
  const quotes = useStockQuotes((s) => s.quotes);
  const fxRate = useStockQuotes((s) => s.fxRate);
  const fxFetchedAt = useStockQuotes((s) => s.fxFetchedAt);
  const refreshing = useStockQuotes((s) => s.refreshing);
  const refreshError = useStockQuotes((s) => s.refreshError);
  const refresh = useStockQuotes((s) => s.refresh);

  const stocksGoalBalance = useSettings((s) => s.stocksGoalBalance);

  const [editingGoal, setEditingGoal] = useState(false);

  const summary = useMemo(() => {
    const computed = computeHoldings(holdings, quotes, fxRate);
    const totalUsd = computed.reduce((s, h) => s + h.market_value_usd, 0);
    const costUsd = computed.reduce((s, h) => s + h.cost_basis_usd, 0);
    const pnlUsd = totalUsd - costUsd;
    const pnlPct = costUsd > 0 ? pnlUsd / costUsd : 0;
    const goalPct = stocksGoalBalance > 0 ? totalUsd / stocksGoalBalance : 0;
    return { totalUsd, costUsd, pnlUsd, pnlPct, goalPct };
  }, [holdings, quotes, fxRate, stocksGoalBalance]);

  const latest = useMemo(
    () => latestFetchedAt(quotes, fxFetchedAt),
    [quotes, fxFetchedAt],
  );

  const hasKr = holdings.some((h) => h.market !== "US");
  const showFxBadge = hasKr && fxRate != null;
  const goalPctClamped = Math.max(0, Math.min(1, summary.goalPct));
  const goalPctText = `${Math.round(summary.goalPct * 100)}`;

  return (
    <section className="stocks-hero">
      <header className="stocks-hero-head">
        <h2 className="stocks-board-title">{t.sidebar.sectionStocks}</h2>
        <div className="stocks-hero-toolbar">
          {latest && (
            <span className="stocks-board-status">
              {t.stocks.hero.lastRefreshed(relativeAgo(latest, locale))}
            </span>
          )}
          {refreshError && (
            <span className="stocks-board-error" title={refreshError}>
              {t.stocks.hero.refreshFailed}
            </span>
          )}
          <button
            type="button"
            className="btn btn-secondary btn-sm stocks-refresh-btn"
            onClick={() => void refresh(true)}
            disabled={refreshing}
            aria-label={t.stocks.hero.refresh}
          >
            <span
              className={`stocks-refresh-icon ${refreshing ? "is-spinning" : ""}`}
              aria-hidden="true"
            >
              ↻
            </span>
            <span>{t.stocks.hero.refresh}</span>
          </button>
          <button
            type="button"
            className="stocks-hero-gear"
            onClick={() => setEditingGoal(true)}
            aria-label={t.stocks.hero.goalEdit}
            title={t.stocks.hero.goalEdit}
          >
            ⚙
          </button>
        </div>
      </header>

      <div className="stocks-hero-stats">
        <HeroStat
          label={t.stocks.hero.totalAssets}
          value={formatUsd(summary.totalUsd, { round: true })}
          tone="neutral"
        />
        <HeroStat
          label={t.stocks.hero.cumulativeProfit}
          value={formatSignedUsd(summary.pnlUsd)}
          subtitle={formatPctSigned(summary.pnlPct)}
          tone={toneOf(summary.pnlUsd)}
        />
        <HeroStat
          label={t.stocks.hero.goal}
          value={formatUsd(stocksGoalBalance, { round: true })}
          subtitle={t.stocks.hero.achievement(goalPctText)}
          tone="neutral"
        />
      </div>

      <div className="stocks-hero-progress" aria-hidden="true">
        <div
          className="stocks-hero-progress-fill"
          style={{ width: `${goalPctClamped * 100}%` }}
        />
      </div>

      {showFxBadge && fxRate != null && (
        <div className="stocks-hero-fx">
          {t.stocks.hero.fxRate(formatFx(fxRate))}
          {fxFetchedAt && (
            <span className="stocks-hero-fx-time">
              · {relativeAgo(fxFetchedAt, locale)}
            </span>
          )}
        </div>
      )}

      <StocksGoalEditModal
        open={editingGoal}
        onClose={() => setEditingGoal(false)}
      />
    </section>
  );
}

function HeroStat({
  label,
  value,
  subtitle,
  tone,
}: {
  label: string;
  value: string;
  subtitle?: string;
  tone: "pos" | "neg" | "neutral";
}) {
  return (
    <div className="stocks-hero-stat">
      <div className="stocks-hero-stat-label">{label}</div>
      <div className={`stocks-hero-stat-value tone-${tone}`}>{value}</div>
      {subtitle && (
        <div className={`stocks-hero-stat-sub tone-${tone}`}>{subtitle}</div>
      )}
    </div>
  );
}

function formatFx(rate: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(rate);
}
