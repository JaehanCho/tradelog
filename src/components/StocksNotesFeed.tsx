import { useMemo, useState } from "react";

import { useStockHoldings } from "../hooks/useStockHoldings";
import { useStockNotes } from "../hooks/useStockNotes";
import { useStockWatches } from "../hooks/useStockWatches";
import { useT } from "../i18n";
import type { StockMarket, StockNote } from "../types/stocks";
import { StocksNoteForm } from "./StocksNoteForm";

const ALL = "__all__";

export function StocksNotesFeed() {
  const t = useT();
  const notes = useStockNotes((s) => s.notes);
  const holdings = useStockHoldings((s) => s.holdings);
  const watches = useStockWatches((s) => s.watches);

  const [filter, setFilter] = useState<string>(ALL);
  const [editing, setEditing] = useState<StockNote | null>(null);
  const [creating, setCreating] = useState(false);

  // Ticker dropdown = union of holdings + watches + tickers that appear in notes.
  const tickerOptions = useMemo(() => {
    const map = new Map<string, { symbol: string; market: StockMarket; display: string }>();
    const add = (symbol: string, market: StockMarket, display: string) => {
      const k = `${symbol}::${market}`;
      if (!map.has(k)) map.set(k, { symbol, market, display: display || symbol });
    };
    for (const h of holdings) add(h.symbol, h.market, h.display_name);
    for (const w of watches) add(w.symbol, w.market, w.display_name);
    for (const n of notes) add(n.symbol, n.market, "");
    return [...map.entries()].map(([key, v]) => ({ key, ...v }));
  }, [holdings, watches, notes]);

  const filtered = useMemo(() => {
    if (filter === ALL) return notes;
    return notes.filter((n) => `${n.symbol}::${n.market}` === filter);
  }, [notes, filter]);

  return (
    <section className="stocks-section">
      <header className="stocks-section-header">
        <h3 className="stocks-section-title">{t.stocks.notes.title}</h3>
        <div className="stocks-notes-toolbar">
          <select
            className="stocks-field-input stocks-notes-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            aria-label={t.stocks.notes.filterLabel}
          >
            <option value={ALL}>{t.stocks.notes.filterAll}</option>
            {tickerOptions.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.symbol}
                {opt.display && opt.display !== opt.symbol
                  ? ` — ${opt.display}`
                  : ""}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => {
              setEditing(null);
              setCreating(true);
            }}
            disabled={tickerOptions.length === 0}
          >
            {t.stocks.notes.addCta}
          </button>
        </div>
      </header>

      {filtered.length === 0 ? (
        <div className="stocks-empty">
          <div className="stocks-empty-title">{t.stocks.notes.empty}</div>
          <div className="stocks-empty-msg">{t.stocks.notes.emptyMsg}</div>
        </div>
      ) : (
        <ul className="stocks-notes-feed">
          {filtered.map((n) => (
            <NoteCard
              key={n.id}
              note={n}
              onEdit={() => setEditing(n)}
              moreLabel={t.stocks.notes.moreToggle}
              lessLabel={t.stocks.notes.lessToggle}
            />
          ))}
        </ul>
      )}

      <StocksNoteForm
        open={creating || editing !== null}
        editing={editing}
        onClose={() => {
          setEditing(null);
          setCreating(false);
        }}
      />
    </section>
  );
}

const PREVIEW_LIMIT = 220;

function NoteCard({
  note,
  onEdit,
  moreLabel,
  lessLabel,
}: {
  note: StockNote;
  onEdit: () => void;
  moreLabel: string;
  lessLabel: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLong = note.body.length > PREVIEW_LIMIT;
  const body =
    expanded || !isLong ? note.body : note.body.slice(0, PREVIEW_LIMIT) + "…";

  return (
    <li className="stocks-notes-card">
      <header className="stocks-notes-card-head">
        <span className="stocks-notes-date">{note.note_date}</span>
        <button
          type="button"
          className="stocks-notes-ticker"
          onClick={onEdit}
          title={`${note.symbol} (${note.market})`}
        >
          {note.symbol}
        </button>
      </header>
      <div className="stocks-notes-body">{body}</div>
      {isLong && (
        <button
          type="button"
          className="stocks-notes-toggle"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? lessLabel : moreLabel}
        </button>
      )}
    </li>
  );
}
