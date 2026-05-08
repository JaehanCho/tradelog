use std::path::PathBuf;

use rusqlite::{params, Connection};
use rusqlite_migration::{Migrations, M};
use tauri::Manager;

use crate::error::{AppError, AppResult};
use crate::models::{DefiPosition, DefiSnapshot, TradingDay, WisdomNote};

const MIGRATION_0001: &str = include_str!("../migrations/0001_initial.sql");
const MIGRATION_0002: &str = include_str!("../migrations/0002_settings.sql");
const MIGRATION_0003: &str = include_str!("../migrations/0003_market_note.sql");
const MIGRATION_0004: &str = include_str!("../migrations/0004_defi.sql");
const MIGRATION_0005: &str = include_str!("../migrations/0005_wisdom.sql");

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
        let mut conn = Connection::open(&path)?;
        conn.pragma_update(None, "journal_mode", "WAL")?;
        conn.pragma_update(None, "foreign_keys", "ON")?;

        let migrations = Migrations::new(vec![
            M::up(MIGRATION_0001),
            M::up(MIGRATION_0002),
            M::up(MIGRATION_0003),
            M::up(MIGRATION_0004),
            M::up(MIGRATION_0005),
        ]);
        migrations.to_latest(&mut conn)?;

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
