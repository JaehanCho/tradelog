import { useTradingDays } from "../hooks/useTradingDays";

const fmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function BalanceDisplay() {
  const computed = useTradingDays((s) => s.computed);
  const lastWithBalance = [...computed]
    .reverse()
    .find((r) => r.end_balance !== null);
  const balance = lastWithBalance?.end_balance ?? 0;

  return (
    <div className="balance">
      <div className="balance-label">현재 잔액</div>
      <div className="balance-value">{fmt.format(balance)}</div>
    </div>
  );
}
