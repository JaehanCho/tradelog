import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DataGrid, {
  type Column,
  type RenderEditCellProps,
} from "react-data-grid";
import "react-data-grid/lib/styles.css";

import { useTradingDays } from "../hooks/useTradingDays";
import { nextDay, todayKST } from "../lib/dates";
import { NoteEditor } from "./NoteEditor";
import type { ComputedTradingDay } from "../types/trading-day";

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
        name: "날짜",
        width: 130,
        editable: true,
        renderEditCell: dateEditor,
      },
      {
        key: "deposit",
        name: "입금",
        width: 110,
        editable: true,
        renderCell: ({ row }) => <span>{fmtNum(row.deposit)}</span>,
        renderEditCell: numericEditor("deposit"),
      },
      {
        key: "start_balance",
        name: "시작금액",
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
        name: "최종금액",
        width: 130,
        editable: true,
        renderCell: ({ row }) => <span>{fmtNum(row.end_balance)}</span>,
        renderEditCell: numericEditor("end_balance"),
      },
      {
        key: "daily_pnl",
        name: "일일수익",
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
        name: "일별수익률",
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
        name: "누적수익률",
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
        name: "출금",
        width: 110,
        editable: true,
        renderCell: ({ row }) => <span>{fmtNum(row.withdrawal)}</span>,
        renderEditCell: numericEditor("withdrawal"),
      },
      {
        key: "note",
        name: "비고",
        minWidth: 240,
        editable: true,
        renderCell: ({ row }) => (
          <span className="note-cell" title={row.note}>
            {row.note}
          </span>
        ),
        renderEditCell: NoteEditor,
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
            title="이 거래일 삭제"
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
    [rows, deleteRow],
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
      };

      if (oldDate && oldDate !== row.trade_date) {
        // Date PK changed -> atomic rename (DELETE old + INSERT new).
        void renameDay(oldDate, payload);
      } else {
        void upsertOne(payload);
      }
    },
    [rows, renameDay, upsertOne],
  );

  // Cmd+Z / Cmd+Shift+Z
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;
      if (e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        void undo();
      } else if ((e.key === "z" && e.shiftKey) || e.key === "y") {
        e.preventDefault();
        void redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  return (
    <div ref={containerRef} className="trading-grid" tabIndex={0}>
      <div className="grid-toolbar">
        <div className="grid-hint">
          {monthFilter ? (
            <>
              <strong>{monthFilter}</strong> 만 보는 중
              <button
                className="grid-filter-clear"
                onClick={() => setMonthFilter(null)}
              >
                전체 보기
              </button>
            </>
          ) : (
            <>셀 더블클릭해서 편집 · ⌘Z 실행취소 · 행 끝 ✕로 삭제</>
          )}
        </div>
        <button className="btn btn-primary btn-sm" onClick={addRow}>
          + 거래일 추가
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="grid-empty">
          <div className="grid-empty-title">
            {monthFilter
              ? `${monthFilter} 에 데이터가 없어요`
              : "아직 거래 데이터가 없어요"}
          </div>
          <div className="grid-empty-msg">
            "+ 첫 거래일 추가"로 행을 만들고, 셀을 더블클릭해서 입력해.
            <br />
            첫 거래일에는 <strong>시작금액</strong> 또는 <strong>입금</strong>{" "}
            칸에 시작 자본금을 넣으면 돼.
          </div>
          <button className="btn btn-primary" onClick={addRow}>
            + 첫 거래일 추가
          </button>
        </div>
      ) : (
        <DataGrid<ComputedTradingDay>
          columns={columns}
          rows={rows}
          rowKeyGetter={(r) => r.trade_date}
          onRowsChange={onRowsChange}
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
    </div>
  );
}
