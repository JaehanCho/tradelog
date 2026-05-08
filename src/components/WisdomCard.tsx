import { useWisdomNotes } from "../hooks/useWisdomNotes";
import { useT } from "../i18n";
import type { WisdomNote } from "../types/wisdom";
import { parseTags } from "../types/wisdom";

interface Props {
  note: WisdomNote;
  onEdit: () => void;
}

export function WisdomCard({ note, onEdit }: Props) {
  const t = useT();
  const togglePin = useWisdomNotes((s) => s.togglePin);
  const tags = parseTags(note.tags);

  return (
    <article
      className={`wisdom-card ${note.pinned ? "is-pinned" : ""}`}
      onClick={onEdit}
    >
      <header className="wisdom-card-head">
        <button
          type="button"
          className="wisdom-pin"
          aria-label={t.wisdom.pinAria}
          onClick={(e) => {
            e.stopPropagation();
            void togglePin(note.id);
          }}
          aria-pressed={!!note.pinned}
        >
          {note.pinned ? "📌" : "📎"}
        </button>
      </header>
      <div className="wisdom-body">{note.body}</div>
      {note.source && <div className="wisdom-source">— {note.source}</div>}
      {tags.length > 0 && (
        <div className="wisdom-tags">
          {tags.map((tag) => (
            <span key={tag} className="wisdom-tag">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
