import { useEffect, useRef } from "react";
import type { RenderEditCellProps } from "react-data-grid";
import type { ComputedTradingDay } from "../types/trading-day";

export function NoteEditor({
  row,
  column,
  onRowChange,
  onClose,
}: RenderEditCellProps<ComputedTradingDay>) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);

  return (
    <textarea
      ref={ref}
      className="note-editor"
      defaultValue={row.note}
      onBlur={(e) => {
        onRowChange({ ...row, [column.key]: e.currentTarget.value }, true);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          onRowChange(
            { ...row, [column.key]: e.currentTarget.value },
            true,
          );
        } else if (e.key === "Escape") {
          onClose();
        }
      }}
    />
  );
}
