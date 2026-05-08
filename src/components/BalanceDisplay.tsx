import { useTradingDays } from "../hooks/useTradingDays";
import { useT } from "../i18n";

const fmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function BalanceDisplay() {
  const computed = useTradingDays((s) => s.computed);
  const t = useT();
  const lastWithBalance = [...computed]
    .reverse()
    .find((r) => r.end_balance !== null);
  const balance = lastWithBalance?.end_balance ?? 0;

  return (
    <div className="balance">
      <div className="balance-label">{t.balance.label}</div>
      <div className="balance-value">{fmt.format(balance)}</div>
    </div>
  );
}
