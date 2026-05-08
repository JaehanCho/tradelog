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
    // place cursor at end so user can keep typing
    const len = ref.current?.value.length ?? 0;
    ref.current?.setSelectionRange(len, len);
  }, []);

  return (
    <textarea
      ref={ref}
      className="note-editor"
      defaultValue={row.note}
      // Plain Enter must insert a newline. Stop propagation so RDG's
      // grid-level keydown handler doesn't treat it as a commit.
      onKeyDownCapture={(e) => {
        if (e.key === "Enter" && !(e.metaKey || e.ctrlKey)) {
          e.stopPropagation();
        }
      }}
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
