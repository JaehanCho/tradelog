import { create } from "zustand";
import { api } from "../lib/api";
import type { WisdomNote } from "../types/wisdom";

interface State {
  notes: WisdomNote[];
  loading: boolean;
  error: string | null;

  load: () => Promise<void>;
  upsert: (n: WisdomNote) => Promise<void>;
  remove: (id: string) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
}

const sortNotes = (rows: WisdomNote[]): WisdomNote[] =>
  [...rows].sort((a, b) => {
    if (a.pinned !== b.pinned) return b.pinned - a.pinned;
    const au = a.updated_at ?? a.created_at ?? "";
    const bu = b.updated_at ?? b.created_at ?? "";
    return bu.localeCompare(au);
  });

export const useWisdomNotes = create<State>((set, get) => ({
  notes: [],
  loading: false,
  error: null,

  load: async () => {
    set({ loading: true, error: null });
    try {
      const rows = await api.getWisdomNotes();
      set({ notes: sortNotes(rows), loading: false });
    } catch (e) {
      set({ loading: false, error: String(e) });
    }
  },

  upsert: async (n) => {
    const prev = get().notes;
    const next = sortNotes([...prev.filter((x) => x.id !== n.id), n]);
    set({ notes: next });
    try {
      await api.upsertWisdomNote(n);
    } catch (e) {
      set({ notes: prev, error: String(e) });
    }
  },

  remove: async (id) => {
    const prev = get().notes;
    set({ notes: prev.filter((n) => n.id !== id) });
    try {
      await api.deleteWisdomNote(id);
    } catch (e) {
      set({ notes: prev, error: String(e) });
    }
  },

  togglePin: async (id) => {
    const note = get().notes.find((n) => n.id === id);
    if (!note) return;
    const next: WisdomNote = { ...note, pinned: note.pinned ? 0 : 1 };
    await get().upsert(next);
  },
}));
