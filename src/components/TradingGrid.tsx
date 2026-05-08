import { useCallback, useEffect, useMemo, useRef } from "react";
import DataGrid, {
  type Column,
  type RenderEditCellProps,
} from "react-data-grid";
import "react-data-grid/lib/styles.css";

import { useTradingDays } from "../hooks/useTradingDays";
import { nextDay, todayKST } from "../lib/dates";
import { parseClipboardTsv } from "../lib/paste-parser";
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

export function TradingGrid() {
  const computed = useTradingDays((s) => s.computed);
  const upsertOne = useTradingDays((s) => s.upsertOne);
  const upsertMany = useTradingDays((s) => s.upsertMany);
  const undo = useTradingDays((s) => s.undo);
  const redo = useTradingDays((s) => s.redo);

  const containerRef = useRef<HTMLDivElement>(null);

  const rows = computed;

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

  const columns = useMemo<Column<ComputedTradingDay>[]>(
    () => [
      {
        key: "trade_date",
        name: "날짜",
        width: 120,
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
        editable: false,
        renderCell: ({ row }) => (
          <span className="readonly-cell">{fmtNum(row.start_balance)}</span>
        ),
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
        renderEditCell: NoteEditor,
      },
    ],
    [],
  );

  const onRowsChange = useCallback(
    (
      next: readonly ComputedTradingDay[],
      data: { indexes: readonly number[] },
    ) => {
      const idx = data.indexes[0];
      const row = next[idx];
      if (!row || !row.trade_date) return;
      void upsertOne({
        trade_date: row.trade_date,
        deposit: Number(row.deposit) || 0,
        withdrawal: Number(row.withdrawal) || 0,
        end_balance:
          row.end_balance === null || Number.isNaN(Number(row.end_balance))
            ? null
            : Number(row.end_balance),
        note: row.note ?? "",
      });
    },
    [upsertOne],
  );

  // Custom paste handler: native onPaste fired on the grid container.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onPaste = (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData("text/plain") ?? "";
      // Single-cell paste (no tabs, no newlines): let RDG editor handle it.
      if (!text.includes("\t") && !text.includes("\n")) return;
      e.preventDefault();
      e.stopPropagation();

      const today = new Date();
      const parsed = parseClipboardTsv(text, {
        defaultYear: today.getFullYear(),
        defaultMonth: today.getMonth() + 1,
      });
      if (parsed.length > 0) void upsertMany(parsed);
    };

    el.addEventListener("paste", onPaste, true);
    return () => el.removeEventListener("paste", onPaste, true);
  }, [upsertMany]);

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
          셀 더블클릭해서 편집 · 엑셀에서 row 복사 후 ⌘V로 일괄 입력 · ⌘Z 실행취소
        </div>
        <button className="btn btn-primary btn-sm" onClick={addRow}>
          + 거래일 추가
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="grid-empty">
          <div className="grid-empty-title">아직 거래 데이터가 없어요</div>
          <div className="grid-empty-msg">
            엑셀 시트에서 row를 복사한 뒤 이 영역에 ⌘V로 붙여넣거나,
            <br />
            아래 버튼으로 첫 거래일을 추가해보세요.
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
    </div>
  );
}
