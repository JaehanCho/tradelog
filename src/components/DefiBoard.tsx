import { useEffect, useMemo, useState } from "react";
import { useDefiPositions } from "../hooks/useDefiPositions";
import { useT } from "../i18n";
import type { DefiPosition } from "../types/defi";
import { DefiPositionCard } from "./DefiPositionCard";
import { DefiPositionDrawer } from "./DefiPositionDrawer";

export function DefiBoard() {
  const t = useT();
  const positions = useDefiPositions((s) => s.positions);
  const load = useDefiPositions((s) => s.load);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    load();
  }, [load]);

  const { active, closed } = useMemo(() => {
    const active: DefiPosition[] = [];
    const closed: DefiPosition[] = [];
    for (const p of positions) {
      (p.closed_date ? closed : active).push(p);
    }
    return { active, closed };
  }, [positions]);

  const editing = editingId
    ? positions.find((p) => p.id === editingId) ?? null
    : null;
  const drawerOpen = creating || editingId != null;

  return (
    <section className="defi-board">
      <header className="defi-board-header">
        <h2 className="defi-board-title">{t.defi.title}</h2>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => {
            setEditingId(null);
            setCreating(true);
          }}
        >
          {t.defi.addPosition}
        </button>
      </header>

      {positions.length === 0 ? (
        <div className="defi-empty">
          <div className="defi-empty-title">{t.defi.emptyTitle}</div>
          <div className="defi-empty-msg">{t.defi.emptyMsg}</div>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <div className="defi-section">
              <h3 className="defi-section-heading">{t.defi.activeHeading}</h3>
              <div className="defi-grid">
                {active.map((p) => (
                  <DefiPositionCard
                    key={p.id}
                    position={p}
                    onClick={() => {
                      setCreating(false);
                      setEditingId(p.id);
                    }}
                  />
                ))}
              </div>
            </div>
          )}
          {closed.length > 0 && (
            <div className="defi-section">
              <h3 className="defi-section-heading">{t.defi.closedHeading}</h3>
              <div className="defi-grid">
                {closed.map((p) => (
                  <DefiPositionCard
                    key={p.id}
                    position={p}
                    onClick={() => {
                      setCreating(false);
                      setEditingId(p.id);
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <DefiPositionDrawer
        open={drawerOpen}
        position={editing}
        onClose={() => {
          setEditingId(null);
          setCreating(false);
        }}
      />
    </section>
  );
}
