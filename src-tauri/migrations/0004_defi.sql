CREATE TABLE IF NOT EXISTS defi_position (
  id            TEXT PRIMARY KEY,
  protocol      TEXT NOT NULL,
  chain         TEXT NOT NULL DEFAULT '',
  asset         TEXT NOT NULL,
  principal_usd REAL NOT NULL,
  opened_date   TEXT NOT NULL,
  closed_date   TEXT,
  note          TEXT NOT NULL DEFAULT '',
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS defi_snapshot (
  id              TEXT PRIMARY KEY,
  position_id     TEXT NOT NULL REFERENCES defi_position(id) ON DELETE CASCADE,
  snapshot_date   TEXT NOT NULL,
  value_usd       REAL NOT NULL,
  fees_earned_usd REAL NOT NULL DEFAULT 0,
  note            TEXT NOT NULL DEFAULT '',
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_defi_snapshot_position
  ON defi_snapshot(position_id, snapshot_date);
