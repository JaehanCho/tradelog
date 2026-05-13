import { useEffect, useState } from "react";
import { useSettings } from "../hooks/useSettings";
import { useT } from "../i18n";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function StocksGoalEditModal({ open, onClose }: Props) {
  const t = useT();
  const goalBalance = useSettings((s) => s.stocksGoalBalance);
  const goalDate = useSettings((s) => s.stocksGoalDate);
  const setStocksGoal = useSettings((s) => s.setStocksGoal);

  const [balance, setBalance] = useState(String(goalBalance));
  const [date, setDate] = useState(goalDate);

  useEffect(() => {
    if (open) {
      setBalance(String(goalBalance));
      setDate(goalDate);
    }
  }, [open, goalBalance, goalDate]);

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
    const b = Number(balance);
    if (!Number.isFinite(b) || b <= 0) return;
    await setStocksGoal(b, date);
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
          <h3 className="stocks-modal-title">{t.stocks.goal.title}</h3>
        </header>
        <div className="stocks-modal-body">
          <div className="stocks-field">
            <label className="stocks-field-label">
              {t.stocks.goal.balanceLabel}
            </label>
            <input
              className="stocks-field-input"
              type="number"
              step="any"
              min="0"
              autoFocus
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
            />
          </div>
          <div className="stocks-field">
            <label className="stocks-field-label">
              {t.stocks.goal.dateLabel}
            </label>
            <input
              className="stocks-field-input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>
        <footer className="stocks-modal-footer">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
          >
            {t.stocks.goal.cancel}
          </button>
          <button type="submit" className="btn btn-primary btn-sm">
            {t.stocks.goal.save}
          </button>
        </footer>
      </form>
    </div>
  );
}
