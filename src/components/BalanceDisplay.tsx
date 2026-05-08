import { useTotalEquity } from "../hooks/useTotalEquity";
import { useViewMode } from "../hooks/useViewMode";
import { useT } from "../i18n";

const fmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const pctFmt = (n: number) => `${Math.round(n * 100)}%`;

export function BalanceDisplay() {
  const t = useT();
  const setView = useViewMode((s) => s.setView);
  const { trading, defi, total, tradingPct, defiPct } = useTotalEquity();

  // Hide the breakdown bar when there's no DeFi side yet — keeps the card
  // visually clean for users who only trade.
  const showBreakdown = defi > 0 || total > 0;

  return (
    <div className="balance">
      <div className="balance-label">{t.totalAssets.label}</div>
      <div className="balance-value">{fmt.format(total)}</div>

      {showBreakdown && (
        <>
          <div className="balance-bar" aria-hidden>
            <div
              className="balance-bar-trading"
              style={{ flex: tradingPct || (defi === 0 ? 1 : 0) }}
            />
            <div
              className="balance-bar-defi"
              style={{ flex: defiPct }}
            />
          </div>
          <div className="balance-breakdown">
            <button
              type="button"
              className="balance-sector"
              onClick={() => void setView("trading")}
            >
              <span className="balance-sector-dot tone-trading" />
              <span className="balance-sector-label">
                {t.totalAssets.sectorTrading}
              </span>
              <span className="balance-sector-value">{fmt.format(trading)}</span>
              <span className="balance-sector-pct">
                {pctFmt(tradingPct || (defi === 0 ? 1 : 0))}
              </span>
            </button>
            <button
              type="button"
              className="balance-sector"
              onClick={() => void setView("defi")}
            >
              <span className="balance-sector-dot tone-defi" />
              <span className="balance-sector-label">
                {t.totalAssets.sectorDefi}
              </span>
              <span className="balance-sector-value">{fmt.format(defi)}</span>
              <span className="balance-sector-pct">{pctFmt(defiPct)}</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
