use std::path::{Path, PathBuf};
use std::time::Duration;

use rusqlite::{params, Connection};
use rusqlite_migration::{Migrations, M};
use tauri::Manager;

use crate::error::{AppError, AppResult};
use crate::models::{
    DefiPosition, DefiSnapshot, FxRate, StockHolding, StockNote, StockQuote, StockWatch,
    TradingDay, WisdomNote,
};

const MIGRATION_0001: &str = include_str!("../migrations/0001_initial.sql");
const MIGRATION_0002: &str = include_str!("../migrations/0002_settings.sql");
const MIGRATION_0003: &str = include_str!("../migrations/0003_market_note.sql");
const MIGRATION_0004: &str = include_str!("../migrations/0004_defi.sql");
const MIGRATION_0005: &str = include_str!("../migrations/0005_wisdom.sql");
const MIGRATION_0006: &str = include_str!("../migrations/0006_stocks.sql");

/// `PRAGMA user_version` after all `migrations()` apply. Bump in lock-step
/// with each new migration added below. Used to decide whether a launch
/// needs a pre-migration snapshot, and to log a useful message when an
/// older binary sees a too-new DB.
const LATEST_SCHEMA_VERSION: u32 = 6;

/// Keep this many `db.sqlite.pre-migration-*.bak` files. Snapshots are
/// tiny (a few hundred KB each) so retention is cheap; the point is
/// being able to roll back if a future release ships a bad migration.
const SNAPSHOT_RETENTION: usize = 5;

/// All migrations in order. Exposed so integration tests can apply
/// them against a fresh DB without booting the Tauri runtime.
pub fn migrations() -> Migrations<'static> {
    Migrations::new(vec![
        M::up(MIGRATION_0001),
        M::up(MIGRATION_0002),
        M::up(MIGRATION_0003),
        M::up(MIGRATION_0004),
        M::up(MIGRATION_0005),
        M::up(MIGRATION_0006),
    ])
}

pub struct Db {
    conn: Connection,
}

impl Db {
    pub fn open<R: tauri::Runtime>(app: &tauri::AppHandle<R>) -> AppResult<Self> {
        let dir = app
            .path()
            .app_data_dir()
            .map_err(|e| AppError::Other(format!("app_data_dir: {e}")))?;
        std::fs::create_dir_all(&dir)?;
        let path: PathBuf = dir.join("db.sqlite");

        // Take a defensive snapshot if the DB's `user_version` differs from
        // what this build expects — either we're about to migrate forward
        // (5 → 6) or the DB has gone _ahead_ of us (a partial auto-update,
        // a broken downgrade, etc.). Best-effort: don't fail launch if the
        // snapshot itself can't be written.
        if path.exists() {
            if let Ok(v) = read_user_version(&path) {
                if v != LATEST_SCHEMA_VERSION {
                    if let Err(e) = snapshot_db(&dir, &path) {
                        eprintln!("[tradelog] pre-migration snapshot failed: {e}");
                    }
                }
            }
        }

        let mut conn = Connection::open(&path)?;
        conn.pragma_update(None, "journal_mode", "WAL")?;
        conn.pragma_update(None, "foreign_keys", "ON")?;

        if let Err(e) = migrations().to_latest(&mut conn) {
            let observed: u32 = conn
                .query_row("PRAGMA user_version", [], |r| r.get(0))
                .unwrap_or(0);
            eprintln!("[tradelog] FATAL: migration failed: {e}");
            eprintln!("[tradelog] db path: {}", path.display());
            eprintln!(
                "[tradelog] db user_version = {observed}, this build expects {LATEST_SCHEMA_VERSION}"
            );
            eprintln!(
                "[tradelog] recovery: cp '{}/db.sqlite.pre-migration-<TS>.bak' '{}'",
                dir.display(),
                path.display()
            );
            return Err(AppError::Migration(e));
        }

        Ok(Self { conn })
    }

    pub fn get_all(&self) -> AppResult<Vec<TradingDay>> {
        let mut stmt = self.conn.prepare(
            "SELECT trade_date, deposit, withdrawal, end_balance, note, market_note, created_at, updated_at \
             FROM trading_day ORDER BY trade_date ASC",
        )?;
        let rows = stmt
            .query_map([], row_to_trading_day)?
            .collect::<Result<Vec<_>, _>>()?;
        Ok(rows)
    }

    pub fn get_range(&self, from: &str, to: &str) -> AppResult<Vec<TradingDay>> {
        let mut stmt = self.conn.prepare(
            "SELECT trade_date, deposit, withdrawal, end_balance, note, market_note, created_at, updated_at \
             FROM trading_day WHERE trade_date BETWEEN ?1 AND ?2 ORDER BY trade_date ASC",
        )?;
        let rows = stmt
            .query_map(params![from, to], row_to_trading_day)?
            .collect::<Result<Vec<_>, _>>()?;
        Ok(rows)
    }

    pub fn upsert(&mut self, day: &TradingDay) -> AppResult<()> {
        self.conn.execute(
            "INSERT INTO trading_day (trade_date, deposit, withdrawal, end_balance, note, market_note, updated_at) \
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, strftime('%Y-%m-%dT%H:%M:%fZ','now')) \
             ON CONFLICT(trade_date) DO UPDATE SET \
               deposit = excluded.deposit, \
               withdrawal = excluded.withdrawal, \
               end_balance = excluded.end_balance, \
               note = excluded.note, \
               market_note = excluded.market_note, \
               updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')",
            params![
                day.trade_date,
                day.deposit,
                day.withdrawal,
                day.end_balance,
                day.note,
                day.market_note,
            ],
        )?;
        Ok(())
    }

    pub fn upsert_many(&mut self, days: &[TradingDay]) -> AppResult<()> {
        let tx = self.conn.transaction()?;
        {
            let mut stmt = tx.prepare(
                "INSERT INTO trading_day (trade_date, deposit, withdrawal, end_balance, note, market_note, updated_at) \
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, strftime('%Y-%m-%dT%H:%M:%fZ','now')) \
                 ON CONFLICT(trade_date) DO UPDATE SET \
                   deposit = excluded.deposit, \
                   withdrawal = excluded.withdrawal, \
                   end_balance = excluded.end_balance, \
                   note = excluded.note, \
                   market_note = excluded.market_note, \
                   updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')",
            )?;
            for day in days {
                stmt.execute(params![
                    day.trade_date,
                    day.deposit,
                    day.withdrawal,
                    day.end_balance,
                    day.note,
                    day.market_note,
                ])?;
            }
        }
        tx.commit()?;
        Ok(())
    }

    pub fn get_settings(&self) -> AppResult<std::collections::HashMap<String, String>> {
        let mut stmt = self.conn.prepare("SELECT key, value FROM app_setting")?;
        let rows = stmt.query_map([], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
        })?;
        let mut map = std::collections::HashMap::new();
        for r in rows {
            let (k, v) = r?;
            map.insert(k, v);
        }
        Ok(map)
    }

    pub fn set_setting(&mut self, key: &str, value: &str) -> AppResult<()> {
        self.conn.execute(
            "INSERT INTO app_setting (key, value, updated_at) \
             VALUES (?1, ?2, strftime('%Y-%m-%dT%H:%M:%fZ','now')) \
             ON CONFLICT(key) DO UPDATE SET \
               value = excluded.value, \
               updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')",
            params![key, value],
        )?;
        Ok(())
    }

    pub fn delete(&mut self, trade_date: &str) -> AppResult<()> {
        self.conn
            .execute("DELETE FROM trading_day WHERE trade_date = ?1", params![trade_date])?;
        Ok(())
    }

    /// Atomic rename: when the user changes a row's trade_date (the PK),
    /// delete the row at `old_trade_date` and upsert at the new key in one
    /// transaction. If the keys are equal, this is just an upsert.
    pub fn rename_or_upsert(
        &mut self,
        old_trade_date: &str,
        day: &TradingDay,
    ) -> AppResult<()> {
        let tx = self.conn.transaction()?;
        if old_trade_date != day.trade_date {
            tx.execute(
                "DELETE FROM trading_day WHERE trade_date = ?1",
                params![old_trade_date],
            )?;
        }
        tx.execute(
            "INSERT INTO trading_day (trade_date, deposit, withdrawal, end_balance, note, market_note, updated_at) \
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, strftime('%Y-%m-%dT%H:%M:%fZ','now')) \
             ON CONFLICT(trade_date) DO UPDATE SET \
               deposit = excluded.deposit, \
               withdrawal = excluded.withdrawal, \
               end_balance = excluded.end_balance, \
               note = excluded.note, \
               market_note = excluded.market_note, \
               updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')",
            params![
                day.trade_date,
                day.deposit,
                day.withdrawal,
                day.end_balance,
                day.note,
                day.market_note,
            ],
        )?;
        tx.commit()?;
        Ok(())
    }

    // ─── DeFi positions ────────────────────────────────────────────

    pub fn get_defi_positions(&self) -> AppResult<Vec<DefiPosition>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, protocol, chain, asset, principal_usd, opened_date, \
                    closed_date, note, created_at, updated_at \
             FROM defi_position \
             ORDER BY (closed_date IS NOT NULL), opened_date DESC",
        )?;
        let rows = stmt
            .query_map([], row_to_defi_position)?
            .collect::<Result<Vec<_>, _>>()?;
        Ok(rows)
    }

    pub fn upsert_defi_position(&mut self, p: &DefiPosition) -> AppResult<()> {
        self.conn.execute(
            "INSERT INTO defi_position \
                 (id, protocol, chain, asset, principal_usd, opened_date, closed_date, note, updated_at) \
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, strftime('%Y-%m-%dT%H:%M:%fZ','now')) \
             ON CONFLICT(id) DO UPDATE SET \
                 protocol = excluded.protocol, \
                 chain = excluded.chain, \
                 asset = excluded.asset, \
                 principal_usd = excluded.principal_usd, \
                 opened_date = excluded.opened_date, \
                 closed_date = excluded.closed_date, \
                 note = excluded.note, \
                 updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')",
            params![
                p.id,
                p.protocol,
                p.chain,
                p.asset,
                p.principal_usd,
                p.opened_date,
                p.closed_date,
                p.note,
            ],
        )?;
        Ok(())
    }

    pub fn delete_defi_position(&mut self, id: &str) -> AppResult<()> {
        self.conn.execute(
            "DELETE FROM defi_position WHERE id = ?1",
            params![id],
        )?;
        Ok(())
    }

    pub fn get_position_snapshots(&self, position_id: &str) -> AppResult<Vec<DefiSnapshot>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, position_id, snapshot_date, value_usd, fees_earned_usd, note, created_at \
             FROM defi_snapshot WHERE position_id = ?1 \
             ORDER BY snapshot_date DESC",
        )?;
        let rows = stmt
            .query_map(params![position_id], row_to_defi_snapshot)?
            .collect::<Result<Vec<_>, _>>()?;
        Ok(rows)
    }

    pub fn add_position_snapshot(&mut self, s: &DefiSnapshot) -> AppResult<()> {
        self.conn.execute(
            "INSERT INTO defi_snapshot \
                 (id, position_id, snapshot_date, value_usd, fees_earned_usd, note) \
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                s.id,
                s.position_id,
                s.snapshot_date,
                s.value_usd,
                s.fees_earned_usd,
                s.note,
            ],
        )?;
        Ok(())
    }

    pub fn delete_position_snapshot(&mut self, id: &str) -> AppResult<()> {
        self.conn.execute(
            "DELETE FROM defi_snapshot WHERE id = ?1",
            params![id],
        )?;
        Ok(())
    }

    // ─── Wisdom notes ──────────────────────────────────────────────

    pub fn get_wisdom_notes(&self) -> AppResult<Vec<WisdomNote>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, body, source, tags, pinned, created_at, updated_at \
             FROM wisdom_note \
             ORDER BY pinned DESC, updated_at DESC",
        )?;
        let rows = stmt
            .query_map([], row_to_wisdom_note)?
            .collect::<Result<Vec<_>, _>>()?;
        Ok(rows)
    }

    pub fn upsert_wisdom_note(&mut self, n: &WisdomNote) -> AppResult<()> {
        self.conn.execute(
            "INSERT INTO wisdom_note (id, body, source, tags, pinned, updated_at) \
             VALUES (?1, ?2, ?3, ?4, ?5, strftime('%Y-%m-%dT%H:%M:%fZ','now')) \
             ON CONFLICT(id) DO UPDATE SET \
                 body = excluded.body, \
                 source = excluded.source, \
                 tags = excluded.tags, \
                 pinned = excluded.pinned, \
                 updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')",
            params![n.id, n.body, n.source, n.tags, n.pinned],
        )?;
        Ok(())
    }

    pub fn delete_wisdom_note(&mut self, id: &str) -> AppResult<()> {
        self.conn.execute(
            "DELETE FROM wisdom_note WHERE id = ?1",
            params![id],
        )?;
        Ok(())
    }

    /// Atomically replaces the entire `trading_day` table contents with `days`.
    /// Used by undo/redo so that rows that existed only in the redone-away
    /// state actually disappear from disk.
    pub fn replace_all(&mut self, days: &[TradingDay]) -> AppResult<()> {
        let tx = self.conn.transaction()?;
        tx.execute("DELETE FROM trading_day", [])?;
        {
            let mut stmt = tx.prepare(
                "INSERT INTO trading_day (trade_date, deposit, withdrawal, end_balance, note, market_note, updated_at) \
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, strftime('%Y-%m-%dT%H:%M:%fZ','now'))",
            )?;
            for day in days {
                stmt.execute(params![
                    day.trade_date,
                    day.deposit,
                    day.withdrawal,
                    day.end_balance,
                    day.note,
                    day.market_note,
                ])?;
            }
        }
        tx.commit()?;
        Ok(())
    }

    // ─── Stock holdings ────────────────────────────────────────────

    pub fn get_stock_holdings(&self) -> AppResult<Vec<StockHolding>> {
        let mut stmt = self.conn.prepare(
            "SELECT symbol, market, display_name, quantity, avg_cost, created_at, updated_at \
             FROM stock_holding ORDER BY symbol ASC",
        )?;
        let rows = stmt
            .query_map([], row_to_stock_holding)?
            .collect::<Result<Vec<_>, _>>()?;
        Ok(rows)
    }

    pub fn upsert_stock_holding(&mut self, h: &StockHolding) -> AppResult<()> {
        self.conn.execute(
            "INSERT INTO stock_holding (symbol, market, display_name, quantity, avg_cost, updated_at) \
             VALUES (?1, ?2, ?3, ?4, ?5, strftime('%Y-%m-%dT%H:%M:%fZ','now')) \
             ON CONFLICT(symbol, market) DO UPDATE SET \
                 display_name = excluded.display_name, \
                 quantity = excluded.quantity, \
                 avg_cost = excluded.avg_cost, \
                 updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')",
            params![h.symbol, h.market, h.display_name, h.quantity, h.avg_cost],
        )?;
        Ok(())
    }

    pub fn delete_stock_holding(&mut self, symbol: &str, market: &str) -> AppResult<()> {
        self.conn.execute(
            "DELETE FROM stock_holding WHERE symbol = ?1 AND market = ?2",
            params![symbol, market],
        )?;
        Ok(())
    }

    // ─── Stock watches ─────────────────────────────────────────────

    pub fn get_stock_watches(&self) -> AppResult<Vec<StockWatch>> {
        let mut stmt = self.conn.prepare(
            "SELECT symbol, market, display_name, created_at, updated_at \
             FROM stock_watch ORDER BY symbol ASC",
        )?;
        let rows = stmt
            .query_map([], row_to_stock_watch)?
            .collect::<Result<Vec<_>, _>>()?;
        Ok(rows)
    }

    pub fn upsert_stock_watch(&mut self, w: &StockWatch) -> AppResult<()> {
        self.conn.execute(
            "INSERT INTO stock_watch (symbol, market, display_name, updated_at) \
             VALUES (?1, ?2, ?3, strftime('%Y-%m-%dT%H:%M:%fZ','now')) \
             ON CONFLICT(symbol, market) DO UPDATE SET \
                 display_name = excluded.display_name, \
                 updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')",
            params![w.symbol, w.market, w.display_name],
        )?;
        Ok(())
    }

    pub fn delete_stock_watch(&mut self, symbol: &str, market: &str) -> AppResult<()> {
        self.conn.execute(
            "DELETE FROM stock_watch WHERE symbol = ?1 AND market = ?2",
            params![symbol, market],
        )?;
        Ok(())
    }

    // ─── Stock notes ───────────────────────────────────────────────

    pub fn get_stock_notes(
        &self,
        symbol: Option<&str>,
        market: Option<&str>,
    ) -> AppResult<Vec<StockNote>> {
        if let (Some(s), Some(m)) = (symbol, market) {
            let mut stmt = self.conn.prepare(
                "SELECT id, symbol, market, note_date, body, created_at, updated_at \
                 FROM stock_note WHERE symbol = ?1 AND market = ?2 \
                 ORDER BY note_date DESC, id DESC",
            )?;
            let rows = stmt
                .query_map(params![s, m], row_to_stock_note)?
                .collect::<Result<Vec<_>, _>>()?;
            Ok(rows)
        } else {
            let mut stmt = self.conn.prepare(
                "SELECT id, symbol, market, note_date, body, created_at, updated_at \
                 FROM stock_note ORDER BY note_date DESC, id DESC",
            )?;
            let rows = stmt
                .query_map([], row_to_stock_note)?
                .collect::<Result<Vec<_>, _>>()?;
            Ok(rows)
        }
    }

    pub fn upsert_stock_note(&mut self, n: &StockNote) -> AppResult<i64> {
        if let Some(id) = n.id {
            self.conn.execute(
                "UPDATE stock_note SET \
                     symbol = ?2, market = ?3, note_date = ?4, body = ?5, \
                     updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') \
                 WHERE id = ?1",
                params![id, n.symbol, n.market, n.note_date, n.body],
            )?;
            Ok(id)
        } else {
            self.conn.execute(
                "INSERT INTO stock_note (symbol, market, note_date, body) \
                 VALUES (?1, ?2, ?3, ?4)",
                params![n.symbol, n.market, n.note_date, n.body],
            )?;
            Ok(self.conn.last_insert_rowid())
        }
    }

    pub fn delete_stock_note(&mut self, id: i64) -> AppResult<()> {
        self.conn
            .execute("DELETE FROM stock_note WHERE id = ?1", params![id])?;
        Ok(())
    }

    // ─── Stock quote cache ─────────────────────────────────────────

    pub fn get_stock_quotes(&self) -> AppResult<Vec<StockQuote>> {
        let mut stmt = self.conn.prepare(
            "SELECT symbol, market, price, prev_close, currency, fetched_at \
             FROM stock_quote_cache",
        )?;
        let rows = stmt
            .query_map([], row_to_stock_quote)?
            .collect::<Result<Vec<_>, _>>()?;
        Ok(rows)
    }

    /// Bulk upsert quotes in a single transaction. Called after a Yahoo
    /// batch fetch completes (Phase 5).
    pub fn upsert_stock_quotes(&mut self, quotes: &[StockQuote]) -> AppResult<()> {
        let tx = self.conn.transaction()?;
        {
            let mut stmt = tx.prepare(
                "INSERT INTO stock_quote_cache (symbol, market, price, prev_close, currency, fetched_at) \
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6) \
                 ON CONFLICT(symbol, market) DO UPDATE SET \
                     price = excluded.price, \
                     prev_close = excluded.prev_close, \
                     currency = excluded.currency, \
                     fetched_at = excluded.fetched_at",
            )?;
            for q in quotes {
                stmt.execute(params![
                    q.symbol,
                    q.market,
                    q.price,
                    q.prev_close,
                    q.currency,
                    q.fetched_at,
                ])?;
            }
        }
        tx.commit()?;
        Ok(())
    }

    // ─── FX cache ──────────────────────────────────────────────────

    pub fn get_fx_rate(&self, pair: &str) -> AppResult<Option<FxRate>> {
        let mut stmt = self
            .conn
            .prepare("SELECT pair, rate, fetched_at FROM fx_cache WHERE pair = ?1")?;
        let mut rows = stmt.query(params![pair])?;
        if let Some(row) = rows.next()? {
            Ok(Some(FxRate {
                pair: row.get(0)?,
                rate: row.get(1)?,
                fetched_at: row.get(2)?,
            }))
        } else {
            Ok(None)
        }
    }

    pub fn upsert_fx_rate(&mut self, r: &FxRate) -> AppResult<()> {
        self.conn.execute(
            "INSERT INTO fx_cache (pair, rate, fetched_at) VALUES (?1, ?2, ?3) \
             ON CONFLICT(pair) DO UPDATE SET \
                 rate = excluded.rate, \
                 fetched_at = excluded.fetched_at",
            params![r.pair, r.rate, r.fetched_at],
        )?;
        Ok(())
    }
}

fn row_to_defi_position(row: &rusqlite::Row<'_>) -> rusqlite::Result<DefiPosition> {
    Ok(DefiPosition {
        id: row.get(0)?,
        protocol: row.get(1)?,
        chain: row.get(2)?,
        asset: row.get(3)?,
        principal_usd: row.get(4)?,
        opened_date: row.get(5)?,
        closed_date: row.get(6)?,
        note: row.get(7)?,
        created_at: row.get(8)?,
        updated_at: row.get(9)?,
    })
}

fn row_to_defi_snapshot(row: &rusqlite::Row<'_>) -> rusqlite::Result<DefiSnapshot> {
    Ok(DefiSnapshot {
        id: row.get(0)?,
        position_id: row.get(1)?,
        snapshot_date: row.get(2)?,
        value_usd: row.get(3)?,
        fees_earned_usd: row.get(4)?,
        note: row.get(5)?,
        created_at: row.get(6)?,
    })
}

fn row_to_wisdom_note(row: &rusqlite::Row<'_>) -> rusqlite::Result<WisdomNote> {
    Ok(WisdomNote {
        id: row.get(0)?,
        body: row.get(1)?,
        source: row.get(2)?,
        tags: row.get(3)?,
        pinned: row.get(4)?,
        created_at: row.get(5)?,
        updated_at: row.get(6)?,
    })
}

fn row_to_trading_day(row: &rusqlite::Row<'_>) -> rusqlite::Result<TradingDay> {
    Ok(TradingDay {
        trade_date: row.get(0)?,
        deposit: row.get(1)?,
        withdrawal: row.get(2)?,
        end_balance: row.get(3)?,
        note: row.get(4)?,
        market_note: row.get(5)?,
        created_at: row.get(6)?,
        updated_at: row.get(7)?,
    })
}

fn row_to_stock_holding(row: &rusqlite::Row<'_>) -> rusqlite::Result<StockHolding> {
    Ok(StockHolding {
        symbol: row.get(0)?,
        market: row.get(1)?,
        display_name: row.get(2)?,
        quantity: row.get(3)?,
        avg_cost: row.get(4)?,
        created_at: row.get(5)?,
        updated_at: row.get(6)?,
    })
}

fn row_to_stock_watch(row: &rusqlite::Row<'_>) -> rusqlite::Result<StockWatch> {
    Ok(StockWatch {
        symbol: row.get(0)?,
        market: row.get(1)?,
        display_name: row.get(2)?,
        created_at: row.get(3)?,
        updated_at: row.get(4)?,
    })
}

fn row_to_stock_note(row: &rusqlite::Row<'_>) -> rusqlite::Result<StockNote> {
    Ok(StockNote {
        id: row.get(0)?,
        symbol: row.get(1)?,
        market: row.get(2)?,
        note_date: row.get(3)?,
        body: row.get(4)?,
        created_at: row.get(5)?,
        updated_at: row.get(6)?,
    })
}

fn row_to_stock_quote(row: &rusqlite::Row<'_>) -> rusqlite::Result<StockQuote> {
    Ok(StockQuote {
        symbol: row.get(0)?,
        market: row.get(1)?,
        price: row.get(2)?,
        prev_close: row.get(3)?,
        currency: row.get(4)?,
        fetched_at: row.get(5)?,
    })
}

fn read_user_version(path: &Path) -> AppResult<u32> {
    let conn = Connection::open(path)?;
    let v: u32 = conn.query_row("PRAGMA user_version", [], |r| r.get(0))?;
    Ok(v)
}

/// Snapshot `db.sqlite` into a timestamped `.pre-migration-<TS>.bak` file
/// in the same directory, then prune to `SNAPSHOT_RETENTION` newest copies.
/// Uses SQLite's online backup API so the WAL is handled correctly.
fn snapshot_db(dir: &Path, db_path: &Path) -> AppResult<PathBuf> {
    let ts = chrono::Utc::now().format("%Y%m%d-%H%M%S").to_string();
    let snap_path = dir.join(format!("db.sqlite.pre-migration-{ts}.bak"));

    let src = Connection::open(db_path)?;
    let mut dst = Connection::open(&snap_path)?;
    let backup = rusqlite::backup::Backup::new(&src, &mut dst)?;
    backup.run_to_completion(100, Duration::ZERO, None)?;

    prune_snapshots(dir, SNAPSHOT_RETENTION);
    Ok(snap_path)
}

fn prune_snapshots(dir: &Path, keep: usize) {
    let Ok(entries) = std::fs::read_dir(dir) else {
        return;
    };
    let mut snaps: Vec<_> = entries
        .filter_map(|e| e.ok())
        .filter(|e| {
            e.file_name()
                .to_string_lossy()
                .starts_with("db.sqlite.pre-migration-")
        })
        .collect();
    snaps.sort_by_key(|e| {
        e.metadata()
            .and_then(|m| m.modified())
            .unwrap_or(std::time::SystemTime::UNIX_EPOCH)
    });
    if snaps.len() > keep {
        for old in &snaps[..snaps.len() - keep] {
            let _ = std::fs::remove_file(old.path());
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Catches "binary panics on startup with a fresh DB" — the failure
    /// mode that hit v0.3.5 → v0.4.0 users. `cargo test` runs this on
    /// every CI build, so a broken migration can't slip through.
    #[test]
    fn migrations_apply_cleanly_to_fresh_db() {
        let tmp = tempfile::Builder::new()
            .prefix("tradelog-test-")
            .suffix(".sqlite")
            .tempfile()
            .expect("tempfile");
        let mut conn = Connection::open(tmp.path()).expect("open");
        conn.pragma_update(None, "foreign_keys", "ON").unwrap();
        migrations()
            .to_latest(&mut conn)
            .expect("migrations should apply cleanly to a fresh DB");
        let v: u32 = conn
            .query_row("PRAGMA user_version", [], |r| r.get(0))
            .unwrap();
        assert_eq!(v, LATEST_SCHEMA_VERSION);

        // Sanity: tables from each migration exist.
        for table in &[
            "trading_day",
            "app_setting",
            "defi_position",
            "defi_snapshot",
            "wisdom_note",
            "stock_holding",
            "stock_watch",
            "stock_note",
            "stock_quote_cache",
            "fx_cache",
        ] {
            let count: i64 = conn
                .query_row(
                    "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name=?1",
                    params![table],
                    |r| r.get(0),
                )
                .unwrap();
            assert_eq!(count, 1, "table {table} should exist");
        }
    }

    /// Running migrations a second time must be a no-op — guards against
    /// non-idempotent migration SQL (e.g. missing `IF NOT EXISTS`).
    #[test]
    fn migrations_are_idempotent() {
        let tmp = tempfile::Builder::new()
            .prefix("tradelog-test-")
            .suffix(".sqlite")
            .tempfile()
            .expect("tempfile");
        let mut conn = Connection::open(tmp.path()).unwrap();
        migrations().to_latest(&mut conn).unwrap();
        migrations()
            .to_latest(&mut conn)
            .expect("re-running migrations should be a no-op");
    }
}
