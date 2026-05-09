import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useTradingDays } from "../hooks/useTradingDays";
import { useT } from "../i18n";

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const POPOVER_WIDTH = 280;

interface Props {
  anchor: HTMLElement;
  onClose: () => void;
}

export function MonthPickerPopover({ anchor, onClose }: Props) {
  const computed = useTradingDays((s) => s.computed);
  const monthFilter = useTradingDays((s) => s.monthFilter);
  const setMonthFilter = useTradingDays((s) => s.setMonthFilter);
  const t = useT();
  const containerRef = useRef<HTMLDivElement>(null);

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of computed) {
      const ym = r.trade_date.slice(0, 7);
      m.set(ym, (m.get(ym) ?? 0) + 1);
    }
    return m;
  }, [computed]);

  const years = useMemo(() => {
    const set = new Set<string>();
    for (const ym of counts.keys()) set.add(ym.slice(0, 4));
    return Array.from(set).sort().reverse();
  }, [counts]);

  const [focus, setFocus] = useState<{ year: string; month: number } | null>(
    () => {
      if (monthFilter) {
        return {
          year: monthFilter.slice(0, 4),
          month: parseInt(monthFilter.slice(5, 7), 10),
        };
      }
      if (years.length === 0) return null;
      const y = years[0];
      for (let mm = 12; mm >= 1; mm--) {
        const key = `${y}-${String(mm).padStart(2, "0")}`;
        if (counts.has(key)) return { year: y, month: mm };
      }
      return { year: y, month: 1 };
    },
  );

  const [position, setPosition] = useState<CSSProperties>({});

  useLayoutEffect(() => {
    function place() {
      const rect = anchor.getBoundingClientRect();
      const margin = 8;
      let left = rect.right + margin;
      if (left + POPOVER_WIDTH > window.innerWidth - margin) {
        left = Math.max(margin, rect.left - POPOVER_WIDTH - margin);
      }
      const top = Math.min(
        Math.max(margin, rect.top),
        window.innerHeight - 320,
      );
      setPosition({ top, left, width: POPOVER_WIDTH });
    }
    place();
    window.addEventListener("resize", onClose);
    window.addEventListener("scroll", onClose, true);
    return () => {
      window.removeEventListener("resize", onClose);
      window.removeEventListener("scroll", onClose, true);
    };
  }, [anchor, onClose]);

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "Enter" && focus) {
        e.preventDefault();
        const ym = `${focus.year}-${String(focus.month).padStart(2, "0")}`;
        if (counts.has(ym)) {
          setMonthFilter(monthFilter === ym ? null : ym);
          onClose();
        }
        return;
      }
      if (
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight" ||
        e.key === "ArrowUp" ||
        e.key === "ArrowDown"
      ) {
        if (!focus || years.length === 0) return;
        e.preventDefault();
        setFocus((f) => {
          if (!f) return f;
          let { year, month } = f;
          if (e.key === "ArrowLeft") month = month === 1 ? 12 : month - 1;
          if (e.key === "ArrowRight") month = month === 12 ? 1 : month + 1;
          if (e.key === "ArrowUp") {
            const idx = years.indexOf(year);
            if (idx > 0) year = years[idx - 1];
          }
          if (e.key === "ArrowDown") {
            const idx = years.indexOf(year);
            if (idx >= 0 && idx < years.length - 1) year = years[idx + 1];
          }
          return { year, month };
        });
      }
    }
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (!containerRef.current) return;
      if (containerRef.current.contains(target)) return;
      if (anchor.contains(target)) return;
      onClose();
    }
    window.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleClick);
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [focus, years, counts, monthFilter, setMonthFilter, onClose, anchor]);

  return (
    <div
      ref={containerRef}
      className="month-picker-popover"
      role="dialog"
      tabIndex={-1}
      aria-label={t.monthPicker.title}
      style={position}
    >
      <header className="month-picker-header">
        <span className="month-picker-title">{t.monthPicker.title}</span>
        <button
          type="button"
          className="month-picker-all"
          onClick={() => {
            setMonthFilter(null);
            onClose();
          }}
        >
          {t.sidebar.all}
        </button>
      </header>
      {years.length === 0 ? (
        <div className="month-picker-empty">{t.sidebar.noData}</div>
      ) : (
        <div className="month-picker-grid" role="grid">
          <div className="month-picker-row month-picker-headrow" aria-hidden="true">
            <span className="month-picker-yearcell" />
            {MONTHS.map((m) => (
              <span key={m} className="month-picker-monthhead">
                {m}
              </span>
            ))}
          </div>
          {years.map((y) => (
            <div key={y} className="month-picker-row" role="row">
              <span className="month-picker-yearcell">{y}</span>
              {MONTHS.map((m) => {
                const ym = `${y}-${String(m).padStart(2, "0")}`;
                const count = counts.get(ym) ?? 0;
                const has = count > 0;
                const active = monthFilter === ym;
                const focused = focus?.year === y && focus?.month === m;
                return (
                  <button
                    key={m}
                    type="button"
                    role="gridcell"
                    className={[
                      "month-picker-cell",
                      has ? "has-data" : "empty",
                      active ? "is-active" : "",
                      focused ? "is-focused" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    disabled={!has}
                    onMouseEnter={() => setFocus({ year: y, month: m })}
                    onClick={() => {
                      if (!has) return;
                      setMonthFilter(monthFilter === ym ? null : ym);
                      onClose();
                    }}
                    title={has ? t.monthPicker.cellTooltip(ym, count) : ym}
                    aria-label={
                      has
                        ? t.monthPicker.cellTooltip(ym, count)
                        : `${ym} ${t.monthPicker.noData}`
                    }
                  >
                    <span className="month-picker-dot" aria-hidden="true" />
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
      <footer className="month-picker-footer">
        <span className="month-picker-hint">{t.monthPicker.hint}</span>
      </footer>
    </div>
  );
}
