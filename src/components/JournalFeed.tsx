import { useMemo, useState } from "react";
import { useTradingDays } from "../hooks/useTradingDays";
import { useT } from "../i18n";
import type { ComputedTradingDay } from "../types/trading-day";
import { DayDetailDrawer } from "./DayDetailDrawer";

const COLLAPSED_COUNT = 9;

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const pct = (n: number) =>
  `${n >= 0 ? "+" : ""}${(n * 100).toFixed(2)}%`;

export function JournalFeed() {
  const computed = useTradingDays((s) => s.computed);
  const monthFilter = useTradingDays((s) => s.monthFilter);
  const t = useT();
  const [drawerDate, setDrawerDate] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  // Show only days that have something written down — either a trade note
  // or a market note. Newest first so the latest thinking is at the top.
  const entries = useMemo(() => {
    const filtered = monthFilter
      ? computed.filter((r) => r.trade_date.startsWith(monthFilter))
      : computed;
    return filtered
      .filter((r) => (r.note ?? "").trim() || (r.market_note ?? "").trim())
      .slice()
      .reverse();
  }, [computed, monthFilter]);

  if (entries.length === 0) {
    return (
      <section className="journal-feed">
        <header className="journal-feed-header">
          <h2 className="journal-feed-title">{t.journal.title}</h2>
        </header>
        <div className="journal-feed-empty">{t.journal.empty}</div>
      </section>
    );
  }

  const visible = expanded ? entries : entries.slice(0, COLLAPSED_COUNT);
  const overflow = entries.length - visible.length;
  const drawerRow = drawerDate
    ? entries.find((r) => r.trade_date === drawerDate) ?? null
    : null;

  return (
    <section className="journal-feed">
      <header className="journal-feed-header">
        <h2 className="journal-feed-title">{t.journal.title}</h2>
        {(expanded || overflow > 0) && (
          <button
            className="journal-feed-toggle"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? t.journal.showLess : t.journal.showAll(entries.length)}
          </button>
        )}
      </header>
      <div className="journal-feed-grid">
        {visible.map((r) => (
          <JournalCard
            key={r.trade_date}
            row={r}
            onClick={() => setDrawerDate(r.trade_date)}
          />
        ))}
      </div>
      <DayDetailDrawer
        row={drawerRow}
        onClose={() => setDrawerDate(null)}
      />
    </section>
  );
}

function JournalCard({
  row,
  onClick,
}: {
  row: ComputedTradingDay;
  onClick: () => void;
}) {
  const t = useT();
  const market = (row.market_note ?? "").trim();
  const trade = (row.note ?? "").trim();
  const tone =
    row.daily_pnl == null
      ? "neutral"
      : row.daily_pnl > 0
        ? "pos"
        : row.daily_pnl < 0
          ? "neg"
          : "neutral";

  return (
    <button type="button" className="journal-card" onClick={onClick}>
      <header className="journal-card-head">
        <span className="journal-card-date">{formatDateLabel(row.trade_date)}</span>
        <span className={`journal-card-pnl tone-${tone}`}>
          {row.daily_pnl == null
            ? "—"
            : `${row.daily_pnl >= 0 ? "+" : ""}${usd.format(row.daily_pnl)}`}
          {row.daily_return_pct != null && (
            <span className="journal-card-pct">
              {" "}({pct(row.daily_return_pct)})
            </span>
          )}
        </span>
      </header>

      {market && (
        <div className="journal-card-block">
          <span className="journal-card-tag tone-market">
            {t.journal.marketNoteTag}
          </span>
          <p className="journal-card-text">{market}</p>
        </div>
      )}
      {trade && (
        <div className="journal-card-block">
          <span className="journal-card-tag tone-trade">
            {t.journal.tradeNoteTag}
          </span>
          <p className="journal-card-text">{trade}</p>
        </div>
      )}
    </button>
  );
}

function formatDateLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  const wd = d.toLocaleDateString(undefined, { weekday: "short" });
  return `${iso} (${wd})`;
}
