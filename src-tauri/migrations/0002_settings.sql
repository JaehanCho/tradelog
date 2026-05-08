-- App-wide key/value settings (goal target, etc).
-- Stays in the same .sqlite file so backup/restore covers it.
CREATE TABLE IF NOT EXISTS app_setting (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

INSERT OR IGNORE INTO app_setting (key, value) VALUES
  ('goal_balance', '500000'),
  ('goal_date', '2028-12-31');
