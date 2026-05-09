import { useMemo, useState } from "react";
import { useTradingDays } from "../hooks/useTradingDays";
import { useT } from "../i18n";
import type { ComputedTradingDay } from "../types/trading-day";
import { DayDetailDrawer } from "./DayDetailDrawer";

const COLLAPSED_COUNT = 5;

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
      <ol className="journal-timeline">
        {visible.map((r) => (
          <JournalEntry
            key={r.trade_date}
            row={r}
            onEdit={() => setDrawerDate(r.trade_date)}
            editAria={t.drawer.openAria}
          />
        ))}
      </ol>
      <DayDetailDrawer
        row={drawerRow}
        onClose={() => setDrawerDate(null)}
      />
    </section>
  );
}

function JournalEntry({
  row,
  onEdit,
  editAria,
}: {
  row: ComputedTradingDay;
  onEdit: () => void;
  editAria: string;
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
    <li className={`journal-entry tone-${tone}`}>
      <header className="journal-entry-head">
        <span className="journal-entry-date">{formatDateLabel(row.trade_date)}</span>
        <span className={`journal-entry-pnl tone-${tone}`}>
          {row.daily_pnl == null
            ? "—"
            : `${row.daily_pnl >= 0 ? "+" : ""}${usd.format(row.daily_pnl)}`}
          {row.daily_return_pct != null && (
            <span className="journal-entry-pct">
              {" "}({pct(row.daily_return_pct)})
            </span>
          )}
        </span>
        <button
          type="button"
          className="journal-entry-edit"
          onClick={onEdit}
          aria-label={editAria}
          title={editAria}
        >
          ✎
        </button>
      </header>
      <div className="journal-entry-body">
        {market && (
          <p className="journal-entry-block">
            <span className="journal-entry-tag tone-market">
              {t.journal.marketNoteTag}
            </span>
            <span className="journal-entry-text">{market}</span>
          </p>
        )}
        {trade && (
          <p className="journal-entry-block">
            <span className="journal-entry-tag tone-trade">
              {t.journal.tradeNoteTag}
            </span>
            <span className="journal-entry-text">{trade}</span>
          </p>
        )}
      </div>
    </li>
  );
}

function formatDateLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  const wd = d.toLocaleDateString(undefined, { weekday: "short" });
  return `${iso} (${wd})`;
}
