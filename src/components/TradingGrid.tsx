import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

/**
 * For the very first row only, "시작금액" is editable as a way to set the
 * initial capital. Internally we write to `deposit` because compute.ts
 * treats the first row's deposit as start_balance when there's no prior
 * end_balance to chain from.
 */
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
  const upsertOne = useTradingDays((s) => s.upsertOne);
  const upsertMany = useTradingDays((s) => s.upsertMany);
  const undo = useTradingDays((s) => s.undo);
  const redo = useTradingDays((s) => s.redo);

  const containerRef = useRef<HTMLDivElement>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = useCallback((t: Toast) => {
    setToast(t);
    window.setTimeout(() => setToast(null), 3500);
  }, []);

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
        // First row only: editable as a shortcut for "initial capital".
        editable: (row) => rows[0]?.trade_date === row.trade_date,
        cellClass: (row) =>
          rows[0]?.trade_date === row.trade_date ? "" : "readonly-cell",
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
        renderEditCell: NoteEditor,
      },
    ],
    [rows],
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

  // Window-level paste listener so it fires regardless of focus location.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      // Don't swallow paste when an inline cell editor is active — it may
      // be pasting a single value into an <input>.
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      const text = e.clipboardData?.getData("text/plain") ?? "";
      if (!text.includes("\t") && !text.includes("\n")) return;
      e.preventDefault();

      const today = new Date();
      const parsed = parseClipboardTsv(text, {
        defaultYear: today.getFullYear(),
        defaultMonth: today.getMonth() + 1,
      });
      if (parsed.length === 0) {
        showToast({
          kind: "warn",
          msg: "붙여넣은 데이터에서 거래일을 못 읽었어. 첫 컬럼이 날짜인지 확인해줘.",
        });
        return;
      }
      void upsertMany(parsed);
      showToast({ kind: "ok", msg: `${parsed.length}개 거래일 추가됨` });
    };

    window.addEventListener("paste", onPaste, true);
    return () => window.removeEventListener("paste", onPaste, true);
  }, [upsertMany, showToast]);

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
          셀 더블클릭해서 편집 · 엑셀에서 row 복사 후 어디서든 ⌘V · ⌘Z 실행취소
        </div>
        <button className="btn btn-primary btn-sm" onClick={addRow}>
          + 거래일 추가
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="grid-empty">
          <div className="grid-empty-title">아직 거래 데이터가 없어요</div>
          <div className="grid-empty-msg">
            <strong>방법 1.</strong> 아래 버튼으로 첫 거래일을 추가하고
            셀 더블클릭으로 입력
            <br />
            <strong>방법 2.</strong> 엑셀에서 9개 컬럼{" "}
            <code>[날짜 / 입금 / 시작금액 / 최종금액 / 일일수익 /
              일별수익률 / 누적수익률 / 출금 / 비고]</code>{" "}
            을 row 단위로 복사한 뒤 어디서든 ⌘V
          </div>
          <button className="btn btn-primary" onClick={addRow}>
            + 첫 거래일 추가
          </button>
          <div className="grid-empty-tip">
            첫 거래일은 <strong>시작금액</strong> 또는 <strong>입금</strong>{" "}
            칸에 시작 자본금을 넣으면 돼 (둘 다 동일).
          </div>
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
