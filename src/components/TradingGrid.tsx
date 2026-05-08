import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DataGrid, {
  type Column,
  type RenderEditCellProps,
} from "react-data-grid";
import "react-data-grid/lib/styles.css";

import { useTradingDays } from "../hooks/useTradingDays";
import { useT } from "../i18n";
import { api } from "../lib/api";
import { nextDay, todayKST } from "../lib/dates";
import { NoteCell } from "./NoteCell";
import { NoteEditor } from "./NoteEditor";
import type { ComputedTradingDay } from "../types/trading-day";
import { DayDetailDrawer } from "./DayDetailDrawer";

const ROW_CLIP_KIND = "tradelog_row_v1";
type RowClip = {
  _kind: typeof ROW_CLIP_KIND;
  trade_date: string;
  deposit: number;
  end_balance: number | null;
  withdrawal: number;
  note: string;
  market_note?: string;
};

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});
const pct = new Intl.NumberFormat("ko-KR", {
  style: "percent",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numericEditor =
  (key: keyof ComputedTradingDay) =>
  ({ row, onRowChange, onClose }: RenderEditCellProps<ComputedTradingDay>) => (
    <input
      autoFocus
      className="cell-editor"
      type="number"
      step="any"
      defaultValue={(row[key] as number | null) ?? ""}
      onBlur={(e) => {
        const v = e.currentTarget.value;
        onRowChange(
          {
            ...row,
            [key]: v === "" ? (key === "end_balance" ? null : 0) : Number(v),
          },
          true,
        );
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") onClose();
      }}
    />
  );

const startBalanceFirstRowEditor = ({
  row,
  onRowChange,
  onClose,
}: RenderEditCellProps<ComputedTradingDay>) => (
  <input
    autoFocus
    className="cell-editor"
    type="number"
    step="any"
    defaultValue={(row.start_balance ?? row.deposit) || ""}
    onBlur={(e) => {
      const v = e.currentTarget.value;
      const num = v === "" ? 0 : Number(v);
      onRowChange({ ...row, deposit: num, start_balance: num }, true);
    }}
    onKeyDown={(e) => {
      if (e.key === "Enter") (e.target as HTMLInputElement).blur();
      if (e.key === "Escape") onClose();
    }}
  />
);

const dateEditor = ({
  row,
  onRowChange,
  onClose,
}: RenderEditCellProps<ComputedTradingDay>) => (
  <input
    autoFocus
    className="cell-editor"
    type="date"
    defaultValue={row.trade_date}
    onBlur={(e) => {
      onRowChange({ ...row, trade_date: e.currentTarget.value }, true);
    }}
    onKeyDown={(e) => {
      if (e.key === "Enter") (e.target as HTMLInputElement).blur();
      if (e.key === "Escape") onClose();
    }}
  />
);

const fmtNum = (v: number | null | undefined) =>
  v === null || v === undefined ? "" : usd.format(v);
const fmtPct = (v: number | null | undefined) =>
  v === null || v === undefined ? "" : pct.format(v);
const signClass = (v: number | null | undefined) =>
  v === null || v === undefined ? "" : v > 0 ? "positive" : v < 0 ? "negative" : "";

type Toast = { kind: "ok" | "warn"; msg: string };

type SelectedCell = { rowIdx: number; columnKey: string } | null;

const EDITABLE_COLS = new Set(["trade_date", "deposit", "end_balance", "withdrawal", "note"]);

export function TradingGrid() {
  const computed = useTradingDays((s) => s.computed);
  const monthFilter = useTradingDays((s) => s.monthFilter);
  const setMonthFilter = useTradingDays((s) => s.setMonthFilter);
  const upsertOne = useTradingDays((s) => s.upsertOne);
  const renameDay = useTradingDays((s) => s.renameDay);
  const remove = useTradingDays((s) => s.remove);
  const undo = useTradingDays((s) => s.undo);
  const redo = useTradingDays((s) => s.redo);

  const containerRef = useRef<HTMLDivElement>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [hintOpen, setHintOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<SelectedCell>(null);
  const selectedCellRef = useRef<SelectedCell>(null);
  selectedCellRef.current = selectedCell;
  const [drawerDate, setDrawerDate] = useState<string | null>(null);
  const t = useT();

  const showToast = useCallback((t: Toast) => {
    setToast(t);
    window.setTimeout(() => setToast(null), 3500);
  }, []);

  // Track previous trade_date per row index so we can detect PK rename in
  // onRowsChange (RDG's callback gives us the new state, not the diff).
  const prevDateByIndex = useRef<string[]>([]);
  useEffect(() => {
    prevDateByIndex.current = computed.map((r) => r.trade_date);
  }, [computed]);

  // Display-filtered rows. Underlying compute always uses the full series so
  // start_balance / cumulative_pnl etc. stay correct even when user filters.
  const rows = useMemo(() => {
    if (!monthFilter) return computed;
    return computed.filter((r) => r.trade_date.startsWith(monthFilter));
  }, [computed, monthFilter]);

  const addRow = useCallback(() => {
    const last = computed[computed.length - 1];
    const date = last ? nextDay(last.trade_date) : todayKST();
    void upsertOne({
      trade_date: date,
      deposit: 0,
      withdrawal: 0,
      end_balance: null,
      note: "",
      market_note: "",
    });
  }, [computed, upsertOne]);

  const deleteRow = useCallback(
    (tradeDate: string) => {
      void remove(tradeDate);
    },
    [remove],
  );

  const columns = useMemo<Column<ComputedTradingDay>[]>(
    () => [
      {
        key: "trade_date",
        name: t.grid.headerDate,
        width: 130,
        editable: true,
        renderEditCell: dateEditor,
      },
      {
        key: "deposit",
        name: t.grid.headerDeposit,
        width: 110,
        editable: true,
        renderCell: ({ row }) => <span>{fmtNum(row.deposit)}</span>,
        renderEditCell: numericEditor("deposit"),
      },
      {
        key: "start_balance",
        name: t.grid.headerStart,
        width: 130,
        editable: (row) => rows[0]?.trade_date === row.trade_date,
        renderCell: ({ row }) => (
          <span
            className={
              rows[0]?.trade_date === row.trade_date ? "" : "readonly-cell"
            }
          >
            {fmtNum(row.start_balance)}
          </span>
        ),
        renderEditCell: startBalanceFirstRowEditor,
      },
      {
        key: "end_balance",
        name: t.grid.headerEnd,
        width: 130,
        editable: true,
        renderCell: ({ row }) => <span>{fmtNum(row.end_balance)}</span>,
        renderEditCell: numericEditor("end_balance"),
      },
      {
        key: "daily_pnl",
        name: t.grid.headerDailyPnl,
        width: 120,
        editable: false,
        renderCell: ({ row }) => (
          <span className={`readonly-cell ${signClass(row.daily_pnl)}`}>
            {fmtNum(row.daily_pnl)}
          </span>
        ),
      },
      {
        key: "daily_return_pct",
        name: t.grid.headerDailyReturn,
        width: 110,
        editable: false,
        renderCell: ({ row }) => (
          <span className={`readonly-cell ${signClass(row.daily_return_pct)}`}>
            {fmtPct(row.daily_return_pct)}
          </span>
        ),
      },
      {
        key: "cumulative_return_pct",
        name: t.grid.headerCumReturn,
        width: 120,
        editable: false,
        renderCell: ({ row }) => (
          <span
            className={`readonly-cell ${signClass(row.cumulative_return_pct)}`}
          >
            {fmtPct(row.cumulative_return_pct)}
          </span>
        ),
      },
      {
        key: "withdrawal",
        name: t.grid.headerWithdrawal,
        width: 110,
        editable: true,
        renderCell: ({ row }) => <span>{fmtNum(row.withdrawal)}</span>,
        renderEditCell: numericEditor("withdrawal"),
      },
      {
        key: "note",
        name: t.grid.headerNote,
        minWidth: 240,
        editable: true,
        renderCell: ({ row }) => <NoteCell note={row.note ?? ""} />,
        renderEditCell: NoteEditor,
      },
      {
        key: "_open",
        name: "",
        width: 36,
        editable: false,
        cellClass: "row-actions",
        renderCell: ({ row }) => (
          <button
            className="row-open"
            title={t.drawer.openAria}
            aria-label={t.drawer.openAria}
            onClick={(e) => {
              e.stopPropagation();
              setDrawerDate(row.trade_date);
            }}
          >
            ▶
          </button>
        ),
      },
      {
        key: "_actions",
        name: "",
        width: 44,
        editable: false,
        cellClass: "row-actions",
        renderCell: ({ row }) => (
          <button
            className="row-delete"
            title={t.grid.deleteRowTitle}
            onClick={(e) => {
              e.stopPropagation();
              deleteRow(row.trade_date);
            }}
          >
            ✕
          </button>
        ),
      },
    ],
    [rows, deleteRow, t],
  );

  const onRowsChange = useCallback(
    (
      next: readonly ComputedTradingDay[],
      data: { indexes: readonly number[] },
    ) => {
      const idx = data.indexes[0];
      const row = next[idx];
      if (!row || !row.trade_date) return;

      const oldRow = rows[idx];
      const oldDate = oldRow?.trade_date;
      const payload = {
        trade_date: row.trade_date,
        deposit: Number(row.deposit) || 0,
        withdrawal: Number(row.withdrawal) || 0,
        end_balance:
          row.end_balance === null || Number.isNaN(Number(row.end_balance))
            ? null
            : Number(row.end_balance),
        note: row.note ?? "",
        market_note: row.market_note ?? "",
      };

      if (oldDate && oldDate !== row.trade_date) {
        // Date PK changed. If the new date already belongs to another row,
        // overwrite it (rename_or_upsert deletes old + ON CONFLICT updates).
        // User explicitly asked for overwrite semantics — they can ⌘Z.
        const overwrote = computed.some(
          (r) => r.trade_date === row.trade_date && r.trade_date !== oldDate,
        );
        void renameDay(oldDate, payload);
        if (overwrote) {
          showToast({
            kind: "ok",
            msg: t.toast.overwrote(row.trade_date),
          });
        }
      } else {
        void upsertOne(payload);
      }
    },
    [rows, computed, renameDay, upsertOne, showToast, t],
  );

  // Cmd+Z / Cmd+Shift+Z + Cmd+C / Cmd+V on selected cell.
  // Cmd+Shift+C / Cmd+Shift+V copy/paste the entire row.
  useEffect(() => {
    const onKey = async (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;

      // Don't hijack copy/paste while user is inside an editor input/textarea.
      const tag = (e.target as HTMLElement | null)?.tagName;
      const inEditor = tag === "INPUT" || tag === "TEXTAREA";

      if (e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        void undo();
      } else if ((e.key === "z" && e.shiftKey) || e.key === "y") {
        e.preventDefault();
        void redo();
      } else if ((e.key === "c" || e.key === "C") && !inEditor) {
        const sel = selectedCellRef.current;
        if (!sel) return;
        const row = rows[sel.rowIdx];
        if (!row) return;
        e.preventDefault();
        if (e.shiftKey) {
          await copyRow(row);
        } else {
          await copyCell(row, sel.columnKey);
        }
      } else if ((e.key === "v" || e.key === "V") && !inEditor) {
        const sel = selectedCellRef.current;
        if (!sel) return;
        const row = rows[sel.rowIdx];
        if (!row) return;
        e.preventDefault();
        if (e.shiftKey) {
          await pasteRow(row);
        } else {
          if (!EDITABLE_COLS.has(sel.columnKey)) {
            showToast({
              kind: "warn",
              msg: t.toast.notEditable,
            });
            return;
          }
          let text: string;
          try {
            text = (await api.clipboardRead()).trim();
          } catch {
            showToast({ kind: "warn", msg: t.toast.clipboardReadFail });
            return;
          }
          await applyCellPaste(row, sel.columnKey, text);
        }
      }
    };

    async function copyCell(row: ComputedTradingDay, col: string) {
      const raw = (row as unknown as Record<string, unknown>)[col];
      const text = raw === null || raw === undefined ? "" : String(raw);
      try {
        await api.clipboardWrite(text);
        showToast({ kind: "ok", msg: t.toast.copied });
      } catch {
        showToast({ kind: "warn", msg: t.toast.copyFail });
      }
    }

    async function copyRow(row: ComputedTradingDay) {
      const clip: RowClip = {
        _kind: ROW_CLIP_KIND,
        trade_date: row.trade_date,
        deposit: row.deposit ?? 0,
        end_balance: row.end_balance ?? null,
        withdrawal: row.withdrawal ?? 0,
        note: row.note ?? "",
        market_note: row.market_note ?? "",
      };
      try {
        await api.clipboardWrite(JSON.stringify(clip));
        showToast({ kind: "ok", msg: t.toast.rowCopied });
      } catch {
        showToast({ kind: "warn", msg: t.toast.copyFail });
      }
    }

    async function pasteRow(_target: ComputedTradingDay) {
      let raw: string;
      try {
        raw = (await api.clipboardRead()).trim();
      } catch {
        showToast({ kind: "warn", msg: t.toast.clipboardReadFail });
        return;
      }
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        showToast({
          kind: "warn",
          msg: t.toast.noRowData,
        });
        return;
      }
      if (
        !parsed ||
        typeof parsed !== "object" ||
        (parsed as { _kind?: string })._kind !== ROW_CLIP_KIND
      ) {
        showToast({
          kind: "warn",
          msg: t.toast.noRowData,
        });
        return;
      }
      const src = parsed as RowClip;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(src.trade_date)) {
        showToast({ kind: "warn", msg: t.toast.invalidRowDate });
        return;
      }
      // Always duplicate (never destroy). If src's date is already taken,
      // walk forward day-by-day until we find a free slot.
      const occupied = new Set(computed.map((r) => r.trade_date));
      let date = src.trade_date;
      while (occupied.has(date)) date = nextDay(date);

      await upsertOne({
        trade_date: date,
        deposit: Number(src.deposit) || 0,
        withdrawal: Number(src.withdrawal) || 0,
        end_balance:
          src.end_balance === null || src.end_balance === undefined
            ? null
            : Number(src.end_balance),
        note: String(src.note ?? ""),
        market_note: String(src.market_note ?? ""),
      });
      showToast({
        kind: "ok",
        msg:
          date === src.trade_date
            ? t.toast.rowDuplicated(date)
            : t.toast.rowDuplicatedShifted(src.trade_date, date),
      });
    }

    async function applyCellPaste(
      row: ComputedTradingDay,
      col: string,
      text: string,
    ) {
      let updated: ComputedTradingDay = { ...row };
      let renamedFrom: string | null = null;

      if (col === "trade_date") {
        const iso = text.match(/^\d{4}-\d{2}-\d{2}$/)?.[0];
        if (!iso) {
          showToast({ kind: "warn", msg: t.toast.invalidDateFormat });
          return;
        }
        if (iso === row.trade_date) return;
        renamedFrom = row.trade_date;
        updated = { ...updated, trade_date: iso };
      } else if (col === "note") {
        updated = { ...updated, note: text };
      } else {
        const cleaned = text.replace(/[$,\s]/g, "");
        const n = Number(cleaned);
        if (cleaned !== "" && !Number.isFinite(n)) {
          showToast({ kind: "warn", msg: t.toast.numbersOnly });
          return;
        }
        if (col === "end_balance") {
          updated = { ...updated, end_balance: cleaned === "" ? null : n };
        } else if (col === "deposit") {
          updated = { ...updated, deposit: cleaned === "" ? 0 : n };
        } else if (col === "withdrawal") {
          updated = { ...updated, withdrawal: cleaned === "" ? 0 : n };
        }
      }

      const payload = {
        trade_date: updated.trade_date,
        deposit: updated.deposit ?? 0,
        withdrawal: updated.withdrawal ?? 0,
        end_balance: updated.end_balance ?? null,
        note: updated.note ?? "",
        market_note: updated.market_note ?? "",
      };

      if (renamedFrom) {
        const overwrote = computed.some(
          (r) =>
            r.trade_date === updated.trade_date &&
            r.trade_date !== renamedFrom,
        );
        await renameDay(renamedFrom, payload);
        showToast({
          kind: "ok",
          msg: overwrote
            ? t.toast.overwrote(updated.trade_date)
            : t.toast.pasted,
        });
      } else {
        await upsertOne(payload);
        showToast({ kind: "ok", msg: t.toast.pasted });
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo, rows, computed, renameDay, upsertOne, showToast, t]);

  return (
    <div ref={containerRef} className="trading-grid" tabIndex={0}>
      <div className="grid-toolbar">
        <div className="grid-hint">
          {monthFilter ? (
            <>
              <strong>{monthFilter}</strong>
              {t.grid.filteringPrefix}
              <button
                className="grid-filter-clear"
                onClick={() => setMonthFilter(null)}
              >
                {t.grid.filterClear}
              </button>
            </>
          ) : (
            <span
              className="grid-hint-anchor"
              onMouseEnter={() => setHintOpen(true)}
              onMouseLeave={() => setHintOpen(false)}
            >
              <button
                type="button"
                className="grid-hint-icon"
                aria-label={t.grid.hint.ariaLabel}
                onClick={() => setHintOpen((o) => !o)}
                onFocus={() => setHintOpen(true)}
                onBlur={() => setHintOpen(false)}
              >
                ?
              </button>
              {hintOpen && (
                <div className="grid-hint-popover" role="tooltip">
                  <div className="grid-hint-row">
                    <kbd>⌘C</kbd> <kbd>⌘V</kbd>
                    <span>{t.grid.hint.copyCell}</span>
                  </div>
                  <div className="grid-hint-row">
                    <kbd>⌘⇧C</kbd> <kbd>⌘⇧V</kbd>
                    <span>{t.grid.hint.copyRow}</span>
                  </div>
                  <div className="grid-hint-row">
                    <kbd>{t.grid.hint.doubleClick}</kbd>
                    <span>{t.grid.hint.editCell}</span>
                  </div>
                  <div className="grid-hint-row">
                    <kbd>⌘Z</kbd>
                    <span>{t.grid.hint.undo}</span>
                  </div>
                  <div className="grid-hint-row">
                    <kbd>✕</kbd>
                    <span>{t.grid.hint.deleteRow}</span>
                  </div>
                </div>
              )}
            </span>
          )}
        </div>
        <button className="btn btn-primary btn-sm" onClick={addRow}>
          {t.grid.addDay}
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="grid-empty">
          <div className="grid-empty-title">
            {monthFilter
              ? t.grid.emptyTitleMonth(monthFilter)
              : t.grid.emptyTitleAll}
          </div>
          <div className="grid-empty-msg">
            {t.grid.emptyMsgPart1}
            <br />
            {t.grid.emptyMsgPart2Before}
            <strong>{t.grid.emptyMsgStart}</strong>
            {t.grid.emptyMsgPart2Mid}
            <strong>{t.grid.emptyMsgDeposit}</strong>
            {t.grid.emptyMsgPart2After}
          </div>
          <button className="btn btn-primary" onClick={addRow}>
            {t.grid.addFirstDay}
          </button>
        </div>
      ) : (
        <DataGrid<ComputedTradingDay>
          columns={columns}
          rows={rows}
          rowKeyGetter={(r) => r.trade_date}
          onRowsChange={onRowsChange}
          onCellClick={({ row, column }) => {
            const idx = rows.findIndex((r) => r.trade_date === row.trade_date);
            if (idx >= 0) setSelectedCell({ rowIdx: idx, columnKey: column.key });
          }}
          className="rdg-light-dark"
          rowHeight={36}
          headerRowHeight={36}
        />
      )}

      {toast && (
        <div className={`grid-toast grid-toast-${toast.kind}`} role="status">
          {toast.msg}
        </div>
      )}

      <DayDetailDrawer
        row={
          drawerDate ? rows.find((r) => r.trade_date === drawerDate) ?? null : null
        }
        onClose={() => setDrawerDate(null)}
      />
    </div>
  );
}
