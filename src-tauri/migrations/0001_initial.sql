-- v1 schema: single table tracking one row per KST trading day.
-- trade_date: KST calendar date (YYYY-MM-DD), not UTC. PRIMARY KEY for v2 trade FK target.
-- created_at/updated_at: UTC ISO 8601.
-- v2 will add `trade` table (trade_date FK -> trading_day.trade_date) without altering this one.
-- trade_date is PK so SQLite already maintains an index on it; no extra
-- CREATE INDEX is needed (would just bloat writes).
CREATE TABLE IF NOT EXISTS trading_day (
  trade_date     TEXT PRIMARY KEY,
  deposit        REAL NOT NULL DEFAULT 0,
  withdrawal     REAL NOT NULL DEFAULT 0,
  end_balance    REAL,
  note           TEXT NOT NULL DEFAULT '',
  created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
