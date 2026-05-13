import { useMemo, useState } from "react";

import { useStockHoldings } from "../hooks/useStockHoldings";
import { useStockNotes, notesForTicker } from "../hooks/useStockNotes";
import { useStockQuotes, quoteKey } from "../hooks/useStockQuotes";
import { useStockWatches } from "../hooks/useStockWatches";
import { useT } from "../i18n";
import { formatNative, formatPct, toneOf } from "../lib/stocksCompute";
import type { StockWatch } from "../types/stocks";
import { StocksWatchlistForm } from "./StocksWatchlistForm";

export function StocksWatchlist() {
  const t = useT();
  const watches = useStockWatches((s) => s.watches);
  const quotes = useStockQuotes((s) => s.quotes);

  const [adding, setAdding] = useState(false);
  const [openKey, setOpenKey] = useState<string | null>(null);

  const openWatch = useMemo(() => {
    if (!openKey) return null;
    return watches.find((w) => `${w.symbol}::${w.market}` === openKey) ?? null;
  }, [openKey, watches]);

  return (
    <section className="stocks-section">
      <header className="stocks-section-header">
        <h3 className="stocks-section-title">{t.stocks.watchlist.title}</h3>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => setAdding(true)}
        >
          {t.stocks.watchlist.addCta}
        </button>
      </header>

      {watches.length === 0 ? (
        <div className="stocks-empty">
          <div className="stocks-empty-msg">{t.stocks.watchlist.empty}</div>
        </div>
      ) : (
        <div className="stocks-watchlist-row">
          {watches.map((w) => {
            const q = quotes[quoteKey(w.symbol, w.market)];
            const dayChange =
              q?.prev_close != null && q.prev_close !== 0
                ? (q.price - q.prev_close) / q.prev_close
                : null;
            return (
              <button
                key={`${w.symbol}::${w.market}`}
                type="button"
                className="stocks-watch-pill"
                onClick={() => setOpenKey(`${w.symbol}::${w.market}`)}
                title={w.display_name || w.symbol}
              >
                <span className="stocks-watch-symbol">{w.symbol}</span>
                {q ? (
                  <>
                    <span className="stocks-watch-price">
                      {formatNative(q.price, w.market)}
                    </span>
                    {dayChange != null && (
                      <span
                        className={`stocks-watch-day tone-${toneOf(dayChange)}`}
                      >
                        {dayChange >= 0 ? "▲" : "▼"}{" "}
                        {formatPct(Math.abs(dayChange))}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="stocks-watch-noprice">—</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <StocksWatchlistForm open={adding} onClose={() => setAdding(false)} />
      <WatchDrawer watch={openWatch} onClose={() => setOpenKey(null)} />
    </section>
  );
}

function WatchDrawer({
  watch,
  onClose,
}: {
  watch: StockWatch | null;
  onClose: () => void;
}) {
  const t = useT();
  const removeWatch = useStockWatches((s) => s.remove);
  const upsertHolding = useStockHoldings((s) => s.upsert);
  const notes = useStockNotes((s) => s.notes);

  if (!watch) return null;

  const tickerNotes = notesForTicker(notes, watch.symbol, watch.market);

  const moveToHoldings = async () => {
    // Move to holdings with quantity=0 placeholder — user fills via form.
    await upsertHolding({
      symbol: watch.symbol,
      market: watch.market,
      display_name: watch.display_name,
      quantity: 0,
      avg_cost: 0,
    });
    await removeWatch(watch.symbol, watch.market);
    onClose();
  };

  const handleDelete = async () => {
    if (!confirm(t.stocks.watchlist.drawer.deleteConfirm)) return;
    await removeWatch(watch.symbol, watch.market);
    onClose();
  };

  return (
    <div className="stocks-drawer-overlay" onClick={onClose} role="presentation">
      <aside
        className="stocks-drawer"
        onClick={(e) => e.stopPropagation()}
        aria-label={watch.symbol}
      >
        <header className="stocks-drawer-header">
          <div className="stocks-drawer-title">
            <span className="stocks-drawer-symbol">{watch.symbol}</span>
            {watch.display_name && (
              <span className="stocks-drawer-name">{watch.display_name}</span>
            )}
          </div>
          <button
            type="button"
            className="day-drawer-close"
            onClick={onClose}
            aria-label={t.drawer.closeAria}
          >
            ✕
          </button>
        </header>

        <section className="stocks-drawer-section">
          <header className="stocks-drawer-section-header">
            <h4 className="stocks-drawer-section-title">
              {t.stocks.holdings.drawer.notes}
            </h4>
          </header>
          {tickerNotes.length === 0 ? (
            <div className="stocks-empty stocks-empty-small">
              {t.stocks.notes.empty}
            </div>
          ) : (
            <ul className="stocks-note-list">
              {tickerNotes.map((n) => (
                <li key={n.id} className="stocks-note-item">
                  <div className="stocks-note-meta">
                    <span className="stocks-note-date-label">{n.note_date}</span>
                  </div>
                  <div className="stocks-note-body">{n.body}</div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <footer className="stocks-drawer-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={moveToHoldings}
          >
            {t.stocks.watchlist.drawer.moveToHoldings}
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm stocks-action-danger"
            onClick={handleDelete}
          >
            {t.stocks.watchlist.drawer.delete}
          </button>
        </footer>
      </aside>
    </div>
  );
}
