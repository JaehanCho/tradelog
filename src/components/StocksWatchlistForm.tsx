import { useEffect, useState } from "react";
import { useStockWatches } from "../hooks/useStockWatches";
import { useT } from "../i18n";
import type { StockMarket } from "../types/stocks";

interface Props {
  open: boolean;
  onClose: () => void;
}

interface FormState {
  symbol: string;
  market: StockMarket;
  display_name: string;
}

const EMPTY: FormState = { symbol: "", market: "US", display_name: "" };

export function StocksWatchlistForm({ open, onClose }: Props) {
  const t = useT();
  const upsert = useStockWatches((s) => s.upsert);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(EMPTY);
      setError(null);
    }
  }, [open]);

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
    const symbol = form.symbol.trim().toUpperCase();
    if (!symbol) {
      setError("symbol");
      return;
    }
    await upsert({
      symbol,
      market: form.market,
      display_name: form.display_name.trim(),
    });
    onClose();
  };

  return (
    <div className="stocks-modal-overlay" onClick={onClose} role="presentation">
      <form
        className="stocks-modal"
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
      >
        <header className="stocks-modal-header">
          <h3 className="stocks-modal-title">
            {t.stocks.watchlist.form.titleNew}
          </h3>
        </header>
        <div className="stocks-modal-body">
          <div className="stocks-field">
            <label className="stocks-field-label">
              {t.stocks.watchlist.form.symbol}
            </label>
            <input
              className={`stocks-field-input ${
                error === "symbol" ? "has-error" : ""
              }`}
              type="text"
              autoFocus
              value={form.symbol}
              placeholder={t.stocks.holdings.form.symbolHint}
              onChange={(e) =>
                setForm((f) => ({ ...f, symbol: e.target.value }))
              }
            />
          </div>
          <div className="stocks-field">
            <label className="stocks-field-label">
              {t.stocks.watchlist.form.market}
            </label>
            <div className="stocks-radio-row">
              {(
                [
                  ["US", t.stocks.holdings.form.marketUs],
                  ["KR_KOSPI", t.stocks.holdings.form.marketKospi],
                  ["KR_KOSDAQ", t.stocks.holdings.form.marketKosdaq],
                ] as const
              ).map(([value, label]) => (
                <label key={value} className="stocks-radio">
                  <input
                    type="radio"
                    name="watch-market"
                    checked={form.market === value}
                    onChange={() =>
                      setForm((f) => ({ ...f, market: value as StockMarket }))
                    }
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="stocks-field">
            <label className="stocks-field-label">
              {t.stocks.watchlist.form.displayName}
            </label>
            <input
              className="stocks-field-input"
              type="text"
              value={form.display_name}
              placeholder={t.stocks.holdings.form.displayNameHint}
              onChange={(e) =>
                setForm((f) => ({ ...f, display_name: e.target.value }))
              }
            />
          </div>
        </div>
        <footer className="stocks-modal-footer">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
          >
            {t.stocks.watchlist.form.cancel}
          </button>
          <button type="submit" className="btn btn-primary btn-sm">
            {t.stocks.watchlist.form.save}
          </button>
        </footer>
      </form>
    </div>
  );
}
