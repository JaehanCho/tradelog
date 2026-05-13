import { useEffect, useMemo, useState } from "react";

import { useStockHoldings } from "../hooks/useStockHoldings";
import { useStockNotes } from "../hooks/useStockNotes";
import { useStockWatches } from "../hooks/useStockWatches";
import { useT } from "../i18n";
import type { StockMarket, StockNote } from "../types/stocks";

interface Props {
  open: boolean;
  editing: StockNote | null;
  onClose: () => void;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

interface FormState {
  tickerKey: string; // "SYMBOL::MARKET" — empty until selected
  note_date: string;
  body: string;
}

const EMPTY: FormState = { tickerKey: "", note_date: todayIso(), body: "" };

export function StocksNoteForm({ open, editing, onClose }: Props) {
  const t = useT();
  const holdings = useStockHoldings((s) => s.holdings);
  const watches = useStockWatches((s) => s.watches);
  const upsertNote = useStockNotes((s) => s.upsert);
  const removeNote = useStockNotes((s) => s.remove);

  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  // Union of holdings + watches as a ticker picker source.
  const tickerOptions = useMemo(() => {
    const map = new Map<string, { symbol: string; market: StockMarket; display: string }>();
    for (const h of holdings) {
      map.set(`${h.symbol}::${h.market}`, {
        symbol: h.symbol,
        market: h.market,
        display: h.display_name || h.symbol,
      });
    }
    for (const w of watches) {
      const k = `${w.symbol}::${w.market}`;
      if (!map.has(k)) {
        map.set(k, {
          symbol: w.symbol,
          market: w.market,
          display: w.display_name || w.symbol,
        });
      }
    }
    return [...map.entries()].map(([key, v]) => ({ key, ...v }));
  }, [holdings, watches]);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        tickerKey: `${editing.symbol}::${editing.market}`,
        note_date: editing.note_date,
        body: editing.body,
      });
    } else {
      setForm({
        tickerKey: tickerOptions[0]?.key ?? "",
        note_date: todayIso(),
        body: "",
      });
    }
    setError(null);
  }, [open, editing, tickerOptions]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.tickerKey) {
      setError("ticker");
      return;
    }
    if (!form.body.trim()) {
      setError("body");
      return;
    }
    const [symbol, market] = form.tickerKey.split("::") as [string, StockMarket];
    await upsertNote({
      id: editing?.id,
      symbol,
      market,
      note_date: form.note_date || todayIso(),
      body: form.body.trim(),
    });
    onClose();
  };

  const handleDelete = async () => {
    if (!editing?.id) return;
    if (!confirm(t.stocks.notes.deleteConfirm)) return;
    await removeNote(editing.id);
    onClose();
  };

  const isEdit = editing !== null;

  return (
    <div className="stocks-modal-overlay" onClick={onClose} role="presentation">
      <form
        className="stocks-modal"
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
      >
        <header className="stocks-modal-header">
          <h3 className="stocks-modal-title">
            {isEdit
              ? t.stocks.notes.form.titleEdit
              : t.stocks.notes.form.titleNew}
          </h3>
        </header>
        <div className="stocks-modal-body">
          <div className="stocks-field">
            <label className="stocks-field-label">
              {t.stocks.notes.form.ticker}
            </label>
            <select
              className={`stocks-field-input ${
                error === "ticker" ? "has-error" : ""
              }`}
              value={form.tickerKey}
              onChange={(e) =>
                setForm((f) => ({ ...f, tickerKey: e.target.value }))
              }
              disabled={isEdit}
            >
              {!form.tickerKey && (
                <option value="">{t.stocks.notes.form.tickerPlaceholder}</option>
              )}
              {tickerOptions.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.symbol}
                  {opt.display && opt.display !== opt.symbol
                    ? ` — ${opt.display}`
                    : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="stocks-field">
            <label className="stocks-field-label">
              {t.stocks.notes.form.date}
            </label>
            <input
              type="date"
              className="stocks-field-input"
              value={form.note_date}
              onChange={(e) =>
                setForm((f) => ({ ...f, note_date: e.target.value }))
              }
            />
          </div>
          <div className="stocks-field">
            <label className="stocks-field-label">
              {t.stocks.notes.form.body}
            </label>
            <textarea
              className={`stocks-field-input stocks-note-body-input ${
                error === "body" ? "has-error" : ""
              }`}
              rows={5}
              value={form.body}
              placeholder={t.stocks.notes.form.bodyPlaceholder}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              autoFocus={!isEdit}
            />
          </div>
        </div>
        <footer className="stocks-modal-footer">
          {isEdit && (
            <button
              type="button"
              className="btn btn-secondary btn-sm stocks-action-danger"
              onClick={handleDelete}
            >
              {t.stocks.notes.form.delete}
            </button>
          )}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
          >
            {t.stocks.notes.form.cancel}
          </button>
          <button type="submit" className="btn btn-primary btn-sm">
            {t.stocks.notes.form.save}
          </button>
        </footer>
      </form>
    </div>
  );
}
