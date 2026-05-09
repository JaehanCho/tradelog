import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";
import { useSettings } from "../hooks/useSettings";
import { useTradingDays } from "../hooks/useTradingDays";
import { useT } from "../i18n";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const pct = (n: number) =>
  `${n >= 0 ? "+" : ""}${(n * 100).toFixed(2)}%`;

interface EquityPoint {
  date: string;
  cumulative: number;
  returnPct: number;
}

export function EquityCurve() {
  const computed = useTradingDays((s) => s.computed);
  const goalBalance = useSettings((s) => s.goalBalance);
  const goalDate = useSettings((s) => s.goalDate);
  const t = useT();

  // Plot the cumulative trading amount — `principal + cumulative PnL`. This
  // is deposit/withdrawal-neutral: the line tracks performance, not the
  // raw cash sitting in the account. `cumulative_return_pct` rides along
  // so the tooltip can show both magnitude and rate at the same time.
  const data = useMemo<EquityPoint[]>(() => {
    let cumulativeWithdrawal = 0;
    const out: EquityPoint[] = [];
    for (const r of computed) {
      if (r.end_balance === null) continue;
      out.push({
        date: r.trade_date,
        cumulative: r.end_balance + cumulativeWithdrawal,
        returnPct: r.cumulative_return_pct ?? 0,
      });
      cumulativeWithdrawal += r.withdrawal ?? 0;
    }
    return out;
  }, [computed]);

  if (data.length === 0) {
    return (
      <div className="equity-empty">
        <div className="equity-empty-frame" />
        <div className="equity-empty-msg">{t.equity.empty}</div>
      </div>
    );
  }

  const renderTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (!active || !payload || payload.length === 0) return null;
    const point = payload[0].payload as EquityPoint;
    const positive = point.returnPct >= 0;
    return (
      <div className="equity-tooltip">
        <div className="equity-tooltip-date">{point.date}</div>
        <div className="equity-tooltip-row">
          <span className="equity-tooltip-label">{t.equity.tooltipLabel}</span>
          <span className="equity-tooltip-value">
            {usd.format(point.cumulative)}
          </span>
        </div>
        <div className="equity-tooltip-row">
          <span className="equity-tooltip-label">
            {t.equity.tooltipReturnLabel}
          </span>
          <span
            className={`equity-tooltip-value ${
              positive ? "tone-pos" : "tone-neg"
            }`}
          >
            {pct(point.returnPct)}
          </span>
        </div>
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.32} />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--separator)" strokeDasharray="2 4" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "var(--text-secondary)" }}
          stroke="var(--separator)"
          minTickGap={48}
        />
        <YAxis
          tickFormatter={(v) => usd.format(Number(v))}
          tick={{ fontSize: 11, fill: "var(--text-secondary)" }}
          stroke="var(--separator)"
          width={72}
        />
        <Tooltip content={renderTooltip} />
        <ReferenceLine
          y={goalBalance}
          stroke="var(--accent-secondary)"
          strokeDasharray="4 4"
          label={{
            value: t.equity.goalLabel(
              usd.format(goalBalance),
              goalDate.slice(0, 7),
            ),
            position: "insideTopRight",
            fill: "var(--text-secondary)",
            fontSize: 11,
          }}
        />
        <Area
          type="monotone"
          dataKey="cumulative"
          stroke="var(--accent)"
          strokeWidth={2}
          fill="url(#equityFill)"
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
