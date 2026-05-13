import { useEffect, useState } from "react";
import { useStockHoldings } from "../hooks/useStockHoldings";
import { useT } from "../i18n";
import type { StockHolding, StockMarket } from "../types/stocks";

interface Props {
  open: boolean;
  /** When non-null, the form is in edit mode for this holding. */
  editing: StockHolding | null;
  onClose: () => void;
}

interface FormState {
  symbol: string;
  market: StockMarket;
  display_name: string;
  quantity: string;
  avg_cost: string;
}

const EMPTY: FormState = {
  symbol: "",
  market: "US",
  display_name: "",
  quantity: "",
  avg_cost: "",
};

export function StocksHoldingForm({ open, editing, onClose }: Props) {
  const t = useT();
  const upsert = useStockHoldings((s) => s.upsert);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  // Reset form when opening with a different `editing` target.
  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        symbol: editing.symbol,
        market: editing.market,
        display_name: editing.display_name,
        quantity: String(editing.quantity),
        avg_cost: String(editing.avg_cost),
      });
    } else {
      setForm(EMPTY);
    }
    setError(null);
  }, [open, editing]);

  // Esc closes.
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
    const qty = Number(form.quantity);
    const cost = Number(form.avg_cost);
    if (!symbol) {
      setError("symbol");
      return;
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      setError("qty");
      return;
    }
    if (!Number.isFinite(cost) || cost < 0) {
      setError("cost");
      return;
    }
    await upsert({
      symbol,
      market: form.market,
      display_name: form.display_name.trim(),
      quantity: qty,
      avg_cost: cost,
    });
    onClose();
  };

  const isEdit = editing !== null;
  const avgCostLabel =
    form.market === "US"
      ? t.stocks.holdings.form.avgCostUsd
      : t.stocks.holdings.form.avgCostKrw;

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
              ? t.stocks.holdings.form.titleEdit
              : t.stocks.holdings.form.titleNew}
          </h3>
        </header>

        <div className="stocks-modal-body">
          <div className="stocks-field">
            <label className="stocks-field-label">
              {t.stocks.holdings.form.symbol}
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
              disabled={isEdit}
            />
          </div>

          <div className="stocks-field">
            <label className="stocks-field-label">
              {t.stocks.holdings.form.market}
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
                    name="market"
                    value={value}
                    checked={form.market === value}
                    onChange={() =>
                      setForm((f) => ({ ...f, market: value as StockMarket }))
                    }
                    disabled={isEdit}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="stocks-field">
            <label className="stocks-field-label">
              {t.stocks.holdings.form.displayName}
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

          <div className="stocks-field-row">
            <div className="stocks-field">
              <label className="stocks-field-label">
                {t.stocks.holdings.form.qty}
              </label>
              <input
                className={`stocks-field-input ${
                  error === "qty" ? "has-error" : ""
                }`}
                type="number"
                step="any"
                min="0"
                value={form.quantity}
                onChange={(e) =>
                  setForm((f) => ({ ...f, quantity: e.target.value }))
                }
              />
            </div>
            <div className="stocks-field">
              <label className="stocks-field-label">{avgCostLabel}</label>
              <input
                className={`stocks-field-input ${
                  error === "cost" ? "has-error" : ""
                }`}
                type="number"
                step="any"
                min="0"
                value={form.avg_cost}
                onChange={(e) =>
                  setForm((f) => ({ ...f, avg_cost: e.target.value }))
                }
              />
            </div>
          </div>
        </div>

        <footer className="stocks-modal-footer">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
          >
            {t.stocks.holdings.form.cancel}
          </button>
          <button type="submit" className="btn btn-primary btn-sm">
            {t.stocks.holdings.form.save}
          </button>
        </footer>
      </form>
    </div>
  );
}
