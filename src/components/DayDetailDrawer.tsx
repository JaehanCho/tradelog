import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useTradingDays } from "../hooks/useTradingDays";
import { useT } from "../i18n";
import type { ComputedTradingDay } from "../types/trading-day";

interface DayDetailDrawerProps {
  row: ComputedTradingDay | null;
  onClose: () => void;
}

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const pct = (n: number) =>
  `${n >= 0 ? "+" : ""}${(n * 100).toFixed(2)}%`;

export function DayDetailDrawer({ row, onClose }: DayDetailDrawerProps) {
  const t = useT();
  const renameDay = useTradingDays((s) => s.renameDay);
  const [tradeNote, setTradeNote] = useState("");
  const [marketNote, setMarketNote] = useState("");
  const tradeRef = useRef<HTMLTextAreaElement | null>(null);
  const marketRef = useRef<HTMLTextAreaElement | null>(null);

  // Reset local buffers whenever a different row is opened.
  useEffect(() => {
    if (!row) return;
    setTradeNote(row.note ?? "");
    setMarketNote(row.market_note ?? "");
  }, [row?.trade_date]);  // eslint-disable-line react-hooks/exhaustive-deps

  // ESC closes.
  useEffect(() => {
    if (!row) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [row, onClose]);

  // Auto-resize both textareas to fit content.
  useLayoutEffect(() => {
    autosize(tradeRef.current);
  }, [tradeNote, row?.trade_date]);
  useLayoutEffect(() => {
    autosize(marketRef.current);
  }, [marketNote, row?.trade_date]);

  const persist = useCallback(
    (overrides?: { note?: string; market_note?: string }) => {
      if (!row) return;
      const note = overrides?.note ?? tradeNote;
      const market_note = overrides?.market_note ?? marketNote;
      // Only write if anything changed.
      if (note === (row.note ?? "") && market_note === (row.market_note ?? "")) {
        return;
      }
      void renameDay(row.trade_date, {
        trade_date: row.trade_date,
        deposit: row.deposit ?? 0,
        withdrawal: row.withdrawal ?? 0,
        end_balance: row.end_balance ?? null,
        note,
        market_note,
      });
    },
    [row, tradeNote, marketNote, renameDay],
  );

  if (!row) return null;

  const dateLabel = formatDateLabel(row.trade_date);

  return (
    <div className="day-drawer-overlay" onClick={onClose} role="presentation">
      <aside
        className="day-drawer"
        onClick={(e) => e.stopPropagation()}
        aria-label={dateLabel}
      >
        <header className="day-drawer-header">
          <div className="day-drawer-date">{dateLabel}</div>
          <button
            type="button"
            className="day-drawer-close"
            onClick={onClose}
            aria-label={t.drawer.closeAria}
          >
            ✕
          </button>
        </header>

        <div className="day-drawer-stats">
          <Stat
            label={t.drawer.pnlLabel}
            value={
              row.daily_pnl === null
                ? "—"
                : `${row.daily_pnl >= 0 ? "+" : ""}${usd.format(row.daily_pnl)}`
            }
            tone={row.daily_pnl === null ? "neutral" : row.daily_pnl >= 0 ? "pos" : "neg"}
          />
          <Stat
            label={t.drawer.cumReturnLabel}
            value={
              row.cumulative_return_pct === null
                ? "—"
                : pct(row.cumulative_return_pct)
            }
            tone={
              row.cumulative_return_pct === null
                ? "neutral"
                : row.cumulative_return_pct >= 0
                  ? "pos"
                  : "neg"
            }
          />
          <Stat
            label={t.drawer.endBalanceLabel}
            value={row.end_balance == null ? "—" : usd.format(row.end_balance)}
            tone="neutral"
          />
        </div>

        <section className="day-drawer-section">
          <label className="day-drawer-label" htmlFor="dd-trade-note">
            {t.drawer.tradeNoteLabel}
          </label>
          <textarea
            id="dd-trade-note"
            ref={tradeRef}
            className="day-drawer-textarea"
            value={tradeNote}
            placeholder={t.drawer.tradeNotePlaceholder}
            onChange={(e) => setTradeNote(e.target.value)}
            onBlur={() => persist()}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                persist();
              }
            }}
          />
        </section>

        <section className="day-drawer-section">
          <label className="day-drawer-label" htmlFor="dd-market-note">
            {t.drawer.marketNoteLabel}
          </label>
          <textarea
            id="dd-market-note"
            ref={marketRef}
            className="day-drawer-textarea day-drawer-textarea-large"
            value={marketNote}
            placeholder={t.drawer.marketNotePlaceholder}
            onChange={(e) => setMarketNote(e.target.value)}
            onBlur={() => persist()}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                persist();
              }
            }}
          />
        </section>
      </aside>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "pos" | "neg" | "neutral";
}) {
  return (
    <div className="day-drawer-stat">
      <div className="day-drawer-stat-label">{label}</div>
      <div className={`day-drawer-stat-value tone-${tone}`}>{value}</div>
    </div>
  );
}

function autosize(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

function formatDateLabel(iso: string): string {
  // Append weekday in current locale, e.g. "2026-05-09 (Sat)".
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  const wd = d.toLocaleDateString(undefined, { weekday: "short" });
  return `${iso} (${wd})`;
}
