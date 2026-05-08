import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useWisdomNotes } from "../hooks/useWisdomNotes";
import { useT } from "../i18n";
import type { WisdomNote } from "../types/wisdom";
import { joinTags, parseTags } from "../types/wisdom";

interface Props {
  note: WisdomNote | null;
  open: boolean;
  onClose: () => void;
}

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `wn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function WisdomDrawer({ note, open, onClose }: Props) {
  const t = useT();
  const upsert = useWisdomNotes((s) => s.upsert);
  const remove = useWisdomNotes((s) => s.remove);
  const [body, setBody] = useState("");
  const [source, setSource] = useState("");
  const [tagsText, setTagsText] = useState("");
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setBody(note?.body ?? "");
    setSource(note?.source ?? "");
    setTagsText(note ? parseTags(note.tags).join(", ") : "");
  }, [open, note?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useLayoutEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(160, el.scrollHeight)}px`;
  }, [body, open]);

  if (!open) return null;

  const isNew = note == null;

  function handleSave() {
    if (!body.trim()) return;
    const tags = joinTags(parseTags(tagsText));
    void upsert({
      id: note?.id ?? newId(),
      body: body.trim(),
      source: source.trim(),
      tags,
      pinned: note?.pinned ?? 0,
    });
    onClose();
  }

  function handleDelete() {
    if (!note) return;
    if (!window.confirm(t.wisdom.deleteConfirm)) return;
    void remove(note.id);
    onClose();
  }

  return (
    <div className="day-drawer-overlay" onClick={onClose} role="presentation">
      <aside
        className="day-drawer wisdom-drawer"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="day-drawer-header">
          <div className="day-drawer-date">
            {isNew ? t.wisdom.drawerNew : t.wisdom.drawerEdit}
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

        <section className="day-drawer-section">
          <label className="day-drawer-label" htmlFor="wisdom-body">
            {t.wisdom.bodyLabel}
          </label>
          <textarea
            id="wisdom-body"
            ref={bodyRef}
            className="day-drawer-textarea day-drawer-textarea-large"
            value={body}
            placeholder={t.wisdom.bodyPlaceholder}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                handleSave();
              }
            }}
            autoFocus
          />
        </section>

        <section className="day-drawer-section">
          <label className="day-drawer-label" htmlFor="wisdom-source">
            {t.wisdom.sourceLabel}
          </label>
          <input
            id="wisdom-source"
            type="text"
            className="defi-field-input"
            value={source}
            placeholder={t.wisdom.sourcePlaceholder}
            onChange={(e) => setSource(e.target.value)}
          />
        </section>

        <section className="day-drawer-section">
          <label className="day-drawer-label" htmlFor="wisdom-tags">
            {t.wisdom.tagsLabel}
          </label>
          <input
            id="wisdom-tags"
            type="text"
            className="defi-field-input"
            value={tagsText}
            placeholder={t.wisdom.tagsHint}
            onChange={(e) => setTagsText(e.target.value)}
          />
        </section>

        <div className="defi-form-actions wisdom-actions">
          {!isNew && (
            <button
              className="btn btn-secondary btn-sm defi-delete"
              onClick={handleDelete}
            >
              {t.wisdom.delete}
            </button>
          )}
          <button className="btn btn-primary btn-sm" onClick={handleSave}>
            {t.wisdom.save}
          </button>
        </div>
      </aside>
    </div>
  );
}
