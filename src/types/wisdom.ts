/** Trading wisdom note: quote, tip, or personal insight. */
export interface WisdomNote {
  id: string;
  body: string;
  source: string;
  /** Comma-separated, e.g. "psychology,risk". Stored as a string for simplicity. */
  tags: string;
  /** 0 or 1. */
  pinned: number;
  created_at?: string;
  updated_at?: string;
}

export const parseTags = (tags: string): string[] =>
  tags
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

export const joinTags = (tags: string[]): string => tags.join(",");
