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
} from "recharts";
import { useTradingDays } from "../hooks/useTradingDays";

const GOAL = { date: "2028-12-31", balance: 500_000 };

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function EquityCurve() {
  const computed = useTradingDays((s) => s.computed);

  const data = useMemo(
    () =>
      computed
        .filter((r) => r.end_balance !== null)
        .map((r) => ({ date: r.trade_date, balance: r.end_balance as number })),
    [computed],
  );

  if (data.length === 0) {
    return (
      <div className="equity-empty">
        <div className="equity-empty-frame" />
        <div className="equity-empty-msg">데이터를 입력해주세요</div>
      </div>
    );
  }

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
        <Tooltip
          formatter={(v: number) => usd.format(v)}
          contentStyle={{
            background: "var(--surface)",
            border: "1px solid var(--separator)",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <ReferenceLine
          y={GOAL.balance}
          stroke="var(--accent-secondary)"
          strokeDasharray="4 4"
          label={{
            value: `목표 ${usd.format(GOAL.balance)} @ 2028-12`,
            position: "insideTopRight",
            fill: "var(--text-secondary)",
            fontSize: 11,
          }}
        />
        <Area
          type="monotone"
          dataKey="balance"
          stroke="var(--accent)"
          strokeWidth={2}
          fill="url(#equityFill)"
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
