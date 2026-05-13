import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { useStockHoldings } from "../hooks/useStockHoldings";
import { useStockQuotes } from "../hooks/useStockQuotes";
import { useT } from "../i18n";
import { computeHoldings, formatPct, formatUsd } from "../lib/stocksCompute";

const PALETTE = [
  "#007AFF",
  "#34C759",
  "#FF9500",
  "#AF52DE",
  "#FF2D55",
  "#5AC8FA",
  "#FFCC00",
  "#5856D6",
];
const OTHER_COLOR = "#8E8E93";
const TOP_N = 8;

interface Slice {
  name: string;
  value: number;
  weight: number;
  color: string;
}

export function StocksAllocation() {
  const t = useT();
  const holdings = useStockHoldings((s) => s.holdings);
  const quotes = useStockQuotes((s) => s.quotes);
  const fxRate = useStockQuotes((s) => s.fxRate);

  const slices = useMemo<Slice[]>(() => {
    const computed = computeHoldings(holdings, quotes, fxRate);
    if (computed.length === 0) return [];
    const sorted = [...computed].sort(
      (a, b) => b.market_value_usd - a.market_value_usd,
    );
    const total = sorted.reduce((s, h) => s + h.market_value_usd, 0) || 1;

    if (sorted.length <= TOP_N) {
      return sorted.map((h, i) => ({
        name: h.symbol,
        value: h.market_value_usd,
        weight: h.market_value_usd / total,
        color: PALETTE[i % PALETTE.length],
      }));
    }
    const top = sorted.slice(0, TOP_N).map((h, i) => ({
      name: h.symbol,
      value: h.market_value_usd,
      weight: h.market_value_usd / total,
      color: PALETTE[i % PALETTE.length],
    }));
    const restValue = sorted
      .slice(TOP_N)
      .reduce((s, h) => s + h.market_value_usd, 0);
    return [
      ...top,
      {
        name: t.stocks.allocation.other,
        value: restValue,
        weight: restValue / total,
        color: OTHER_COLOR,
      },
    ];
  }, [holdings, quotes, fxRate, t]);

  return (
    <section className="stocks-section stocks-allocation">
      <header className="stocks-section-header">
        <h3 className="stocks-section-title">{t.stocks.allocation.title}</h3>
        <span className="stocks-allocation-count">
          {t.stocks.allocation.totalCount(holdings.length)}
        </span>
      </header>
      {slices.length === 0 ? (
        <div className="stocks-empty">
          <div className="stocks-empty-msg">{t.stocks.holdings.empty}</div>
        </div>
      ) : (
        <div className="stocks-allocation-body">
          <div className="stocks-allocation-chart">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={slices}
                  dataKey="value"
                  innerRadius={60}
                  outerRadius={90}
                  stroke="var(--surface-solid)"
                  strokeWidth={2}
                >
                  {slices.map((s) => (
                    <Cell key={s.name} fill={s.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--surface-solid)",
                    border: "1px solid var(--separator)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value: number, name: string) => [
                    formatUsd(value, { round: true }),
                    name,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="stocks-allocation-legend">
            {slices.map((s) => (
              <li key={s.name} className="stocks-allocation-legend-row">
                <span
                  className="stocks-allocation-swatch"
                  style={{ background: s.color }}
                  aria-hidden="true"
                />
                <span className="stocks-allocation-name">{s.name}</span>
                <span className="stocks-allocation-weight">
                  {formatPct(s.weight)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
