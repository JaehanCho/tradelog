CREATE TABLE IF NOT EXISTS wisdom_note (
  id         TEXT PRIMARY KEY,
  body       TEXT NOT NULL,
  source     TEXT NOT NULL DEFAULT '',
  tags       TEXT NOT NULL DEFAULT '',
  pinned     INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_wisdom_pinned
  ON wisdom_note(pinned DESC, updated_at DESC);
