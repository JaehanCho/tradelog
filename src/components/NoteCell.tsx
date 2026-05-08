import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Note cell renderer — keeps row height uniform by showing a single line, but
 * surfaces multi-line content via a hover popover (portal'd to body so it
 * escapes RDG's overflow:hidden).
 */
export function NoteCell({ note }: { note: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [hover, setHover] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  const trimmed = note ?? "";
  const hasMultiline = trimmed.includes("\n");
  const firstLine = trimmed.split("\n")[0];
  const extraLines = hasMultiline
    ? trimmed.split("\n").length - 1
    : 0;

  useLayoutEffect(() => {
    if (!hover || !trimmed || !ref.current) {
      setPos(null);
      return;
    }
    const r = ref.current.getBoundingClientRect();
    setPos({ left: r.left, top: r.bottom + 6 });
  }, [hover, trimmed]);

  return (
    <>
      <span
        ref={ref}
        className="note-cell"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <span className="note-cell-text">{firstLine}</span>
        {hasMultiline && (
          <span className="note-multiline-badge" aria-label={`${extraLines}줄 더`}>
            +{extraLines}
          </span>
        )}
      </span>
      {pos &&
        trimmed &&
        createPortal(
          <div
            className="note-popover"
            style={{ left: pos.left, top: pos.top }}
            role="tooltip"
          >
            {trimmed}
          </div>,
          document.body,
        )}
    </>
  );
}
