import { useMemo, useState } from "react";
import DataGrid, { type Column } from "react-data-grid";

import { useStockHoldings } from "../hooks/useStockHoldings";
import { useStockQuotes } from "../hooks/useStockQuotes";
import { useT } from "../i18n";
import {
  computeHoldings,
  formatNative,
  formatPct,
  formatPctSigned,
  formatSignedUsd,
  toneOf,
  type ComputedHolding,
} from "../lib/stocksCompute";
import type { StockHolding } from "../types/stocks";
import { StocksHoldingDrawer } from "./StocksHoldingDrawer";
import { StocksHoldingForm } from "./StocksHoldingForm";

export function StocksHoldingsTable() {
  const t = useT();
  const holdings = useStockHoldings((s) => s.holdings);
  const quotes = useStockQuotes((s) => s.quotes);
  const fxRate = useStockQuotes((s) => s.fxRate);

  const [creating, setCreating] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [openKey, setOpenKey] = useState<string | null>(null);

  const computed = useMemo(
    () => computeHoldings(holdings, quotes, fxRate),
    [holdings, quotes, fxRate],
  );

  const editing = useMemo(() => {
    if (!editingKey) return null;
    return (
      holdings.find((h) => `${h.symbol}::${h.market}` === editingKey) ?? null
    );
  }, [editingKey, holdings]);

  const openRow = useMemo(() => {
    if (!openKey) return null;
    return computed.find((h) => `${h.symbol}::${h.market}` === openKey) ?? null;
  }, [openKey, computed]);

  const columns = useMemo<Column<ComputedHolding>[]>(
    () => [
      {
        key: "ticker",
        name: t.stocks.holdings.col.ticker,
        minWidth: 140,
        renderCell: ({ row }) => (
          <div className="stocks-cell-ticker">
            <span className="stocks-cell-symbol">{row.symbol}</span>
            {row.display_name && (
              <span className="stocks-cell-name">{row.display_name}</span>
            )}
          </div>
        ),
      },
      {
        key: "quantity",
        name: t.stocks.holdings.col.qty,
        width: 80,
        renderCell: ({ row }) => (
          <span className="stocks-cell-num">{formatQty(row.quantity)}</span>
        ),
      },
      {
        key: "avg_cost",
        name: t.stocks.holdings.col.avgCost,
        width: 110,
        renderCell: ({ row }) => (
          <span className="stocks-cell-num">
            {formatNative(row.avg_cost, row.market)}
          </span>
        ),
      },
      {
        key: "current_price",
        name: t.stocks.holdings.col.currentPrice,
        width: 130,
        renderCell: ({ row }) => (
          <div className="stocks-cell-price">
            <span className="stocks-cell-num">
              {formatNative(row.current_price, row.market)}
            </span>
            {row.day_change_pct != null && (
              <span
                className={`stocks-cell-day tone-${toneOf(row.day_change_pct)}`}
              >
                {row.day_change_pct >= 0 ? "▲" : "▼"}{" "}
                {formatPct(Math.abs(row.day_change_pct))}
              </span>
            )}
          </div>
        ),
      },
      {
        key: "market_value",
        name: t.stocks.holdings.col.marketValue,
        width: 140,
        renderCell: ({ row }) => (
          <span className="stocks-cell-num">
            {formatNative(row.market_value_native, row.market)}
          </span>
        ),
      },
      {
        key: "pnl",
        name: t.stocks.holdings.col.pnl,
        width: 130,
        renderCell: ({ row }) => (
          <div className={`stocks-cell-pnl tone-${toneOf(row.pnl_usd)}`}>
            <span className="stocks-cell-num">
              {formatSignedUsd(row.pnl_usd)}
            </span>
            <span className="stocks-cell-day">
              {formatPctSigned(row.pnl_pct)}
            </span>
          </div>
        ),
      },
      {
        key: "weight",
        name: t.stocks.holdings.col.weight,
        width: 80,
        renderCell: ({ row }) => (
          <span className="stocks-cell-num">{formatPct(row.weight)}</span>
        ),
      },
    ],
    [t],
  );

  return (
    <section className="stocks-section">
      <header className="stocks-section-header">
        <h3 className="stocks-section-title">{t.stocks.holdings.title}</h3>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => {
            setEditingKey(null);
            setCreating(true);
          }}
        >
          {t.stocks.holdings.addCta}
        </button>
      </header>

      {computed.length === 0 ? (
        <div className="stocks-empty">
          <div className="stocks-empty-title">{t.stocks.holdings.empty}</div>
          <div className="stocks-empty-msg">{t.stocks.holdings.emptyMsg}</div>
        </div>
      ) : (
        <div className="stocks-grid">
          <DataGrid<ComputedHolding>
            columns={columns}
            rows={computed}
            rowKeyGetter={(r) => `${r.symbol}::${r.market}`}
            onCellClick={({ row }) =>
              setOpenKey(`${row.symbol}::${row.market}`)
            }
            className="rdg-light-dark"
            rowHeight={48}
            headerRowHeight={36}
          />
        </div>
      )}

      <StocksHoldingForm
        open={creating || editing !== null}
        editing={editing}
        onClose={() => {
          setCreating(false);
          setEditingKey(null);
        }}
      />

      <StocksHoldingDrawer
        holding={openRow}
        onClose={() => setOpenKey(null)}
        onEdit={(h: StockHolding) => {
          setOpenKey(null);
          setEditingKey(`${h.symbol}::${h.market}`);
        }}
      />
    </section>
  );
}

function formatQty(n: number): string {
  // Show up to 4 decimals, trim trailing zeros.
  if (Number.isInteger(n)) return n.toLocaleString();
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  });
}
