-- Stocks tab: long-position holdings + watchlist + per-ticker note
-- timeline + Yahoo quote/FX cache. KOSPI/KOSDAQ each carry a market
-- tag so we can suffix `.KS`/`.KQ` on Yahoo Finance lookups.

CREATE TABLE IF NOT EXISTS stock_holding (
  symbol       TEXT NOT NULL,
  market       TEXT NOT NULL,                  -- 'KR_KOSPI' | 'KR_KOSDAQ' | 'US'
  display_name TEXT NOT NULL DEFAULT '',
  quantity     REAL NOT NULL,
  avg_cost     REAL NOT NULL,                  -- native currency
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  PRIMARY KEY (symbol, market)
);

CREATE TABLE IF NOT EXISTS stock_watch (
  symbol       TEXT NOT NULL,
  market       TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  PRIMARY KEY (symbol, market)
);

CREATE TABLE IF NOT EXISTS stock_note (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol     TEXT NOT NULL,
  market     TEXT NOT NULL,
  note_date  TEXT NOT NULL,                    -- YYYY-MM-DD
  body       TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_stock_note_symbol
  ON stock_note(symbol, market, note_date DESC);

-- Persisted Yahoo Finance quote cache. Survives restarts so we hit the
-- network only when the freshness window (5 min) lapses.
CREATE TABLE IF NOT EXISTS stock_quote_cache (
  symbol      TEXT NOT NULL,
  market      TEXT NOT NULL,
  price       REAL NOT NULL,                   -- native currency
  prev_close  REAL,                            -- for day-change calc
  currency    TEXT NOT NULL,                   -- 'USD' | 'KRW'
  fetched_at  TEXT NOT NULL,
  PRIMARY KEY (symbol, market)
);

-- Single-row-per-pair FX cache (currently only USDKRW is needed).
CREATE TABLE IF NOT EXISTS fx_cache (
  pair       TEXT PRIMARY KEY,                 -- 'USDKRW'
  rate       REAL NOT NULL,                    -- KRW per 1 USD
  fetched_at TEXT NOT NULL
);

INSERT OR IGNORE INTO app_setting (key, value) VALUES
  ('stocks_goal_balance', '100000'),
  ('stocks_goal_date',    '2028-12-31');
