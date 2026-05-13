import { useEffect, useMemo, useState } from "react";
import { useStockHoldings } from "../hooks/useStockHoldings";
import { useStockNotes } from "../hooks/useStockNotes";
import { useStockWatches } from "../hooks/useStockWatches";
import { useT } from "../i18n";
import {
  formatNative,
  formatPct,
  formatPctSigned,
  formatSignedNative,
  formatSignedUsd,
  formatUsd,
  toneOf,
  type ComputedHolding,
} from "../lib/stocksCompute";
import type { StockHolding, StockNote } from "../types/stocks";

interface Props {
  holding: ComputedHolding | null;
  onClose: () => void;
  onEdit: (h: StockHolding) => void;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function StocksHoldingDrawer({ holding, onClose, onEdit }: Props) {
  const t = useT();
  const removeHolding = useStockHoldings((s) => s.remove);
  const upsertWatch = useStockWatches((s) => s.upsert);
  const notes = useStockNotes((s) => s.notes);
  const upsertNote = useStockNotes((s) => s.upsert);
  const removeNote = useStockNotes((s) => s.remove);

  const [noteBody, setNoteBody] = useState("");
  const [noteDate, setNoteDate] = useState(todayIso());

  // Reset composer whenever a different holding opens.
  useEffect(() => {
    setNoteBody("");
    setNoteDate(todayIso());
  }, [holding?.symbol, holding?.market]);

  // Esc closes.
  useEffect(() => {
    if (!holding) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [holding, onClose]);

  const tickerNotes = useMemo<StockNote[]>(() => {
    if (!holding) return [];
    return notes.filter(
      (n) => n.symbol === holding.symbol && n.market === holding.market,
    );
  }, [holding, notes]);

  if (!holding) return null;

  const submitNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteBody.trim()) return;
    await upsertNote({
      symbol: holding.symbol,
      market: holding.market,
      note_date: noteDate || todayIso(),
      body: noteBody.trim(),
    });
    setNoteBody("");
  };

  const moveToWatch = async () => {
    if (!confirm(t.stocks.holdings.drawer.deleteConfirm)) return;
    await upsertWatch({
      symbol: holding.symbol,
      market: holding.market,
      display_name: holding.display_name,
    });
    await removeHolding(holding.symbol, holding.market);
    onClose();
  };

  const deleteHolding = async () => {
    if (!confirm(t.stocks.holdings.drawer.deleteConfirm)) return;
    await removeHolding(holding.symbol, holding.market);
    onClose();
  };

  return (
    <div
      className="stocks-drawer-overlay"
      onClick={onClose}
      role="presentation"
    >
      <aside
        className="stocks-drawer"
        onClick={(e) => e.stopPropagation()}
        aria-label={holding.symbol}
      >
        <header className="stocks-drawer-header">
          <div className="stocks-drawer-title">
            <span className="stocks-drawer-symbol">{holding.symbol}</span>
            {holding.display_name && (
              <span className="stocks-drawer-name">{holding.display_name}</span>
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

        <div className="stocks-drawer-stats">
          <Stat
            label={t.stocks.holdings.drawer.marketValue}
            primary={formatNative(holding.market_value_native, holding.market)}
            secondary={
              holding.market === "US"
                ? null
                : formatUsd(holding.market_value_usd)
            }
            tone="neutral"
          />
          <Stat
            label={t.stocks.holdings.drawer.costBasis}
            primary={formatNative(holding.cost_basis_native, holding.market)}
            secondary={
              holding.market === "US"
                ? null
                : formatUsd(holding.cost_basis_usd)
            }
            tone="neutral"
          />
          <Stat
            label="P&L"
            primary={formatSignedNative(holding.pnl_native, holding.market)}
            secondary={`${formatSignedUsd(holding.pnl_usd)}  ·  ${formatPctSigned(holding.pnl_pct)}`}
            tone={toneOf(holding.pnl_usd)}
          />
          <Stat
            label={t.stocks.holdings.drawer.dayChange}
            primary={
              holding.day_change_pct == null
                ? "—"
                : `${holding.day_change_pct >= 0 ? "▲" : "▼"} ${formatPct(Math.abs(holding.day_change_pct))}`
            }
            secondary={null}
            tone={toneOf(holding.day_change_pct)}
          />
        </div>

        <section className="stocks-drawer-section">
          <header className="stocks-drawer-section-header">
            <h4 className="stocks-drawer-section-title">
              {t.stocks.holdings.drawer.notes}
            </h4>
          </header>

          <form className="stocks-note-composer" onSubmit={submitNote}>
            <div className="stocks-note-composer-row">
              <input
                type="date"
                className="stocks-field-input stocks-note-date"
                value={noteDate}
                onChange={(e) => setNoteDate(e.target.value)}
              />
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={!noteBody.trim()}
              >
                {t.stocks.holdings.drawer.addNote}
              </button>
            </div>
            <textarea
              className="stocks-field-input stocks-note-body"
              rows={3}
              value={noteBody}
              placeholder={t.stocks.notes.form.bodyPlaceholder}
              onChange={(e) => setNoteBody(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  e.preventDefault();
                  void submitNote(e as unknown as React.FormEvent);
                }
              }}
            />
          </form>

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
                    <button
                      type="button"
                      className="stocks-note-delete"
                      aria-label={t.stocks.notes.form.delete}
                      onClick={() => {
                        if (
                          n.id != null &&
                          confirm(t.stocks.notes.deleteConfirm)
                        ) {
                          void removeNote(n.id);
                        }
                      }}
                    >
                      ✕
                    </button>
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
            onClick={() => onEdit(holding)}
          >
            {t.stocks.holdings.drawer.edit}
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={moveToWatch}
          >
            {t.stocks.holdings.drawer.moveToWatch}
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm stocks-action-danger"
            onClick={deleteHolding}
          >
            {t.stocks.holdings.drawer.delete}
          </button>
        </footer>
      </aside>
    </div>
  );
}

function Stat({
  label,
  primary,
  secondary,
  tone,
}: {
  label: string;
  primary: string;
  secondary: string | null;
  tone: "pos" | "neg" | "neutral";
}) {
  return (
    <div className="stocks-drawer-stat">
      <div className="stocks-drawer-stat-label">{label}</div>
      <div className={`stocks-drawer-stat-value tone-${tone}`}>{primary}</div>
      {secondary && (
        <div className="stocks-drawer-stat-secondary">{secondary}</div>
      )}
    </div>
  );
}
