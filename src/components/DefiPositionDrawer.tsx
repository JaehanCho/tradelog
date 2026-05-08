import { useEffect, useState } from "react";
import { useDefiPositions } from "../hooks/useDefiPositions";
import { useT } from "../i18n";
import type { DefiPosition, DefiSnapshot } from "../types/defi";

interface Props {
  /** Position being edited, or `null` for a new draft. */
  position: DefiPosition | null;
  open: boolean;
  onClose: () => void;
}

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `pos-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function DefiPositionDrawer({ position, open, onClose }: Props) {
  const t = useT();
  const upsertPosition = useDefiPositions((s) => s.upsertPosition);
  const deletePosition = useDefiPositions((s) => s.deletePosition);
  const addSnapshot = useDefiPositions((s) => s.addSnapshot);
  const deleteSnapshot = useDefiPositions((s) => s.deleteSnapshot);
  const snapshots = useDefiPositions((s) =>
    position ? s.snapshotsByPosition[position.id] : undefined,
  );

  const [draft, setDraft] = useState<DefiPosition>(emptyDraft);
  const [newSnap, setNewSnap] = useState<{
    snapshot_date: string;
    value_usd: string;
    fees_earned_usd: string;
    note: string;
  }>(emptySnapDraft);

  // Reset draft on open / position change.
  useEffect(() => {
    if (!open) return;
    setDraft(position ?? emptyDraft());
    setNewSnap(emptySnapDraft());
  }, [open, position?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ESC closes.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const isNew = position == null;

  function handleSave() {
    if (!draft.protocol.trim() || !draft.asset.trim()) return;
    void upsertPosition({
      ...draft,
      id: draft.id || newId(),
      protocol: draft.protocol.trim(),
      chain: draft.chain.trim(),
      asset: draft.asset.trim(),
      principal_usd: Number(draft.principal_usd) || 0,
      opened_date: draft.opened_date || todayISO(),
      closed_date: draft.closed_date?.trim() ? draft.closed_date : null,
      note: draft.note,
    });
    onClose();
  }

  function handleDelete() {
    if (!position) return;
    if (!window.confirm(t.defi.deletePositionConfirm)) return;
    void deletePosition(position.id);
    onClose();
  }

  function handleAddSnapshot() {
    if (!position) return;
    const value = Number(newSnap.value_usd);
    if (!newSnap.snapshot_date || !Number.isFinite(value)) return;
    void addSnapshot({
      id: newId(),
      position_id: position.id,
      snapshot_date: newSnap.snapshot_date,
      value_usd: value,
      fees_earned_usd: Number(newSnap.fees_earned_usd) || 0,
      note: newSnap.note,
    });
    setNewSnap(emptySnapDraft());
  }

  return (
    <div className="day-drawer-overlay" onClick={onClose} role="presentation">
      <aside
        className="day-drawer defi-drawer"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="day-drawer-header">
          <div className="day-drawer-date">
            {isNew
              ? t.defi.drawerNew
              : `${draft.protocol || t.defi.drawerEdit} · ${draft.asset || ""}`}
          </div>
          <button
            type="button"
            className="day-drawer-close"
            onClick={onClose}
            aria-label={t.drawer.closeAria}
          >
            ✕
          </button>
        </header>

        <section className="defi-form">
          <Field label={t.defi.fieldProtocol}>
            <input
              type="text"
              value={draft.protocol}
              onChange={(e) =>
                setDraft({ ...draft, protocol: e.target.value })
              }
              placeholder="Aave, Curve, GMX..."
            />
          </Field>
          <Field label={t.defi.fieldChain}>
            <input
              type="text"
              value={draft.chain}
              onChange={(e) => setDraft({ ...draft, chain: e.target.value })}
              placeholder="Ethereum, Arbitrum..."
            />
          </Field>
          <Field label={t.defi.fieldAsset}>
            <input
              type="text"
              value={draft.asset}
              onChange={(e) => setDraft({ ...draft, asset: e.target.value })}
              placeholder="USDC, ETH-USDC LP..."
            />
          </Field>
          <Field label={t.defi.fieldPrincipal}>
            <input
              type="number"
              inputMode="decimal"
              value={draft.principal_usd}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  principal_usd: Number(e.target.value) || 0,
                })
              }
            />
          </Field>
          <Field label={t.defi.fieldOpened}>
            <input
              type="date"
              value={draft.opened_date}
              onChange={(e) =>
                setDraft({ ...draft, opened_date: e.target.value })
              }
            />
          </Field>
          <Field label={t.defi.fieldClosed}>
            <input
              type="date"
              value={draft.closed_date ?? ""}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  closed_date: e.target.value || null,
                })
              }
            />
          </Field>
          <Field label={t.defi.fieldNote}>
            <textarea
              value={draft.note}
              onChange={(e) => setDraft({ ...draft, note: e.target.value })}
              rows={3}
              className="day-drawer-textarea"
            />
          </Field>
        </section>

        <div className="defi-form-actions">
          <button className="btn btn-primary btn-sm" onClick={handleSave}>
            {t.defi.save}
          </button>
        </div>

        {!isNew && (
          <section className="defi-snapshots">
            <div className="defi-snapshots-head">
              <h3>{t.defi.snapshotsHeading}</h3>
            </div>
            <div className="defi-snapshot-add">
              <input
                type="date"
                value={newSnap.snapshot_date}
                onChange={(e) =>
                  setNewSnap({ ...newSnap, snapshot_date: e.target.value })
                }
                aria-label={t.defi.snapshotDate}
              />
              <input
                type="number"
                inputMode="decimal"
                placeholder={t.defi.snapshotValue}
                value={newSnap.value_usd}
                onChange={(e) =>
                  setNewSnap({ ...newSnap, value_usd: e.target.value })
                }
              />
              <input
                type="number"
                inputMode="decimal"
                placeholder={t.defi.snapshotFees}
                value={newSnap.fees_earned_usd}
                onChange={(e) =>
                  setNewSnap({
                    ...newSnap,
                    fees_earned_usd: e.target.value,
                  })
                }
              />
              <input
                type="text"
                placeholder={t.defi.snapshotNote}
                value={newSnap.note}
                onChange={(e) =>
                  setNewSnap({ ...newSnap, note: e.target.value })
                }
              />
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleAddSnapshot}
                disabled={
                  !newSnap.snapshot_date || !Number.isFinite(Number(newSnap.value_usd))
                }
              >
                {t.defi.addSnapshot}
              </button>
            </div>
            <ul className="defi-snapshot-list">
              {(snapshots ?? []).map((s: DefiSnapshot) => (
                <li key={s.id} className="defi-snapshot-row">
                  <span className="defi-snapshot-date">{s.snapshot_date}</span>
                  <span className="defi-snapshot-value">
                    {usd.format(s.value_usd)}
                  </span>
                  <span className="defi-snapshot-fees">
                    +{usd.format(s.fees_earned_usd)}
                  </span>
                  <span className="defi-snapshot-note" title={s.note}>
                    {s.note}
                  </span>
                  <button
                    className="row-delete"
                    onClick={() => void deleteSnapshot(s.position_id, s.id)}
                    aria-label="Delete snapshot"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
            <div className="defi-form-actions">
              <button
                className="btn btn-secondary btn-sm defi-delete"
                onClick={handleDelete}
              >
                {t.defi.deletePosition}
              </button>
            </div>
          </section>
        )}
      </aside>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="defi-field">
      <span className="defi-field-label">{label}</span>
      {children}
    </label>
  );
}

function emptyDraft(): DefiPosition {
  return {
    id: "",
    protocol: "",
    chain: "",
    asset: "",
    principal_usd: 0,
    opened_date: todayISO(),
    closed_date: null,
    note: "",
  };
}

function emptySnapDraft() {
  return {
    snapshot_date: todayISO(),
    value_usd: "",
    fees_earned_usd: "",
    note: "",
  };
}
