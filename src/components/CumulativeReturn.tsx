import { useTradingDays } from "../hooks/useTradingDays";
import { useT } from "../i18n";

const pct = new Intl.NumberFormat("ko-KR", {
  style: "percent",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function CumulativeReturn() {
  const computed = useTradingDays((s) => s.computed);
  const t = useT();
  const last = [...computed]
    .reverse()
    .find((r) => r.cumulative_return_pct !== null);
  const value = last?.cumulative_return_pct ?? 0;
  const positive = value >= 0;

  return (
    <div className="cumulative-return">
      <div className="cumulative-return-label">{t.cumulativeReturn.label}</div>
      <div
        className={`cumulative-return-value ${
          positive ? "positive" : "negative"
        }`}
      >
        {pct.format(value)}
      </div>
    </div>
  );
}
