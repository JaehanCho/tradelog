import { useEffect, useMemo, useRef, useState } from "react";
import { useWisdomNotes } from "../hooks/useWisdomNotes";
import { useT } from "../i18n";
import { parseTags } from "../types/wisdom";
import { WisdomCard } from "./WisdomCard";
import { WisdomDrawer } from "./WisdomDrawer";

export function WisdomBoard() {
  const t = useT();
  const notes = useWisdomNotes((s) => s.notes);
  const load = useWisdomNotes((s) => s.load);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState("");
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const searchRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    load();
  }, [load]);

  // ⌘N: new note. ⌘F: focus search. Only while view===wisdom (this board mounts only then).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key === "n") {
        e.preventDefault();
        setEditingId(null);
        setCreating(true);
      } else if (e.key === "f") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const allTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const n of notes) {
      for (const tag of parseTags(n.tags)) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([t]) => t);
  }, [notes]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notes.filter((n) => {
      if (pinnedOnly && !n.pinned) return false;
      if (activeTags.size > 0) {
        const tags = parseTags(n.tags);
        if (!tags.some((tag) => activeTags.has(tag))) return false;
      }
      if (!q) return true;
      return (
        n.body.toLowerCase().includes(q) ||
        n.source.toLowerCase().includes(q) ||
        n.tags.toLowerCase().includes(q)
      );
    });
  }, [notes, query, activeTags, pinnedOnly]);

  const editing = editingId
    ? notes.find((n) => n.id === editingId) ?? null
    : null;
  const drawerOpen = creating || editingId != null;

  function toggleTag(tag: string) {
    setActiveTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }

  return (
    <section className="wisdom-board">
      <header className="wisdom-board-header">
        <h2 className="wisdom-board-title">{t.wisdom.title}</h2>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => {
            setEditingId(null);
            setCreating(true);
          }}
        >
          {t.wisdom.newButton}
        </button>
      </header>

      <div className="wisdom-controls">
        <input
          ref={searchRef}
          type="search"
          className="wisdom-search"
          placeholder={t.wisdom.searchPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <label className="wisdom-pin-toggle">
          <input
            type="checkbox"
            checked={pinnedOnly}
            onChange={(e) => setPinnedOnly(e.target.checked)}
          />
          <span>{t.wisdom.pinFilterLabel}</span>
        </label>
      </div>

      {allTags.length > 0 && (
        <div className="wisdom-tag-row">
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              className={`wisdom-tag-chip ${
                activeTags.has(tag) ? "is-active" : ""
              }`}
              onClick={() => toggleTag(tag)}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {notes.length === 0 ? (
        <div className="defi-empty">
          <div className="defi-empty-title">{t.wisdom.emptyTitle}</div>
          <div className="defi-empty-msg">{t.wisdom.emptyMsg}</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="wisdom-no-matches">{t.wisdom.noMatches}</div>
      ) : (
        <div className="wisdom-grid">
          {filtered.map((n) => (
            <WisdomCard
              key={n.id}
              note={n}
              onEdit={() => {
                setCreating(false);
                setEditingId(n.id);
              }}
            />
          ))}
        </div>
      )}

      <WisdomDrawer
        open={drawerOpen}
        note={editing}
        onClose={() => {
          setEditingId(null);
          setCreating(false);
        }}
      />
    </section>
  );
}
