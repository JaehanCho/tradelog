import { latestSnapshot, useDefiPositions } from "../hooks/useDefiPositions";
import { useT } from "../i18n";
import type { DefiPosition } from "../types/defi";

interface Props {
  position: DefiPosition;
  onClick: () => void;
}

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function DefiPositionCard({ position, onClick }: Props) {
  const t = useT();
  const snapshots = useDefiPositions(
    (s) => s.snapshotsByPosition[position.id],
  );
  const snap = latestSnapshot(snapshots);
  const closed = position.closed_date != null;

  const days = daysSince(position.opened_date);
  const pnl = snap
    ? snap.value_usd + snap.fees_earned_usd - position.principal_usd
    : 0;
  const pnlPct = position.principal_usd > 0 ? pnl / position.principal_usd : 0;
  const apr =
    snap && days > 0 && position.principal_usd > 0
      ? (pnl / position.principal_usd) * (365 / days)
      : null;

  const tone =
    pnl > 0 ? "pos" : pnl < 0 ? "neg" : "neutral";

  return (
    <button
      type="button"
      className={`defi-card ${closed ? "is-closed" : ""}`}
      onClick={onClick}
    >
      <div className="defi-card-head">
        <div className="defi-card-title">
          <span className="defi-card-protocol">{position.protocol}</span>
          {position.asset && (
            <span className="defi-card-asset">· {position.asset}</span>
          )}
        </div>
        {position.chain && (
          <div className="defi-card-chain">{position.chain}</div>
        )}
      </div>

      <div className="defi-card-row">
        <span className="defi-card-row-label">{t.defi.cardPrincipal}</span>
        <span className="defi-card-row-value">
          {usd.format(position.principal_usd)}
        </span>
      </div>

      <div className="defi-card-row">
        <span className="defi-card-row-label">{t.defi.cardCurrent}</span>
        <span className={`defi-card-row-value tone-${tone}`}>
          {snap ? usd.format(snap.value_usd) : "—"}
          {snap && (
            <span className="defi-card-delta">
              {pnl >= 0 ? " ▲ " : " ▼ "}
              {(pnlPct * 100).toFixed(1)}%
            </span>
          )}
        </span>
      </div>

      <div className="defi-card-foot">
        <span className="defi-card-foot-item">
          {t.defi.cardApr}{" "}
          <strong>{apr === null ? "—" : `${(apr * 100).toFixed(1)}%`}</strong>
        </span>
        <span className="defi-card-foot-item">
          {closed ? t.defi.cardClosed : t.defi.cardAge(days)}
        </span>
      </div>

      {!snap && !closed && (
        <div className="defi-card-hint">{t.defi.cardNoSnapshot}</div>
      )}
    </button>
  );
}

function daysSince(iso: string): number {
  const opened = new Date(`${iso}T00:00:00`).getTime();
  if (Number.isNaN(opened)) return 0;
  const now = Date.now();
  return Math.max(0, Math.floor((now - opened) / 86_400_000));
}
