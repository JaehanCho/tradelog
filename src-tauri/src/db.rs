use std::path::PathBuf;

use rusqlite::{params, Connection};
use rusqlite_migration::{Migrations, M};
use tauri::Manager;

use crate::error::{AppError, AppResult};
use crate::models::TradingDay;

const MIGRATION_0001: &str = include_str!("../migrations/0001_initial.sql");
const MIGRATION_0002: &str = include_str!("../migrations/0002_settings.sql");

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

        let migrations = Migrations::new(vec![M::up(MIGRATION_0001), M::up(MIGRATION_0002)]);
        migrations.to_latest(&mut conn)?;

        Ok(Self { conn })
    }

    pub fn get_all(&self) -> AppResult<Vec<TradingDay>> {
        let mut stmt = self.conn.prepare(
            "SELECT trade_date, deposit, withdrawal, end_balance, note, created_at, updated_at \
             FROM trading_day ORDER BY trade_date ASC",
        )?;
        let rows = stmt
            .query_map([], row_to_trading_day)?
            .collect::<Result<Vec<_>, _>>()?;
        Ok(rows)
    }

    pub fn get_range(&self, from: &str, to: &str) -> AppResult<Vec<TradingDay>> {
        let mut stmt = self.conn.prepare(
            "SELECT trade_date, deposit, withdrawal, end_balance, note, created_at, updated_at \
             FROM trading_day WHERE trade_date BETWEEN ?1 AND ?2 ORDER BY trade_date ASC",
        )?;
        let rows = stmt
            .query_map(params![from, to], row_to_trading_day)?
            .collect::<Result<Vec<_>, _>>()?;
        Ok(rows)
    }

    pub fn upsert(&mut self, day: &TradingDay) -> AppResult<()> {
        self.conn.execute(
            "INSERT INTO trading_day (trade_date, deposit, withdrawal, end_balance, note, updated_at) \
             VALUES (?1, ?2, ?3, ?4, ?5, strftime('%Y-%m-%dT%H:%M:%fZ','now')) \
             ON CONFLICT(trade_date) DO UPDATE SET \
               deposit = excluded.deposit, \
               withdrawal = excluded.withdrawal, \
               end_balance = excluded.end_balance, \
               note = excluded.note, \
               updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')",
            params![
                day.trade_date,
                day.deposit,
                day.withdrawal,
                day.end_balance,
                day.note,
            ],
        )?;
        Ok(())
    }

    pub fn upsert_many(&mut self, days: &[TradingDay]) -> AppResult<()> {
        let tx = self.conn.transaction()?;
        {
            let mut stmt = tx.prepare(
                "INSERT INTO trading_day (trade_date, deposit, withdrawal, end_balance, note, updated_at) \
                 VALUES (?1, ?2, ?3, ?4, ?5, strftime('%Y-%m-%dT%H:%M:%fZ','now')) \
                 ON CONFLICT(trade_date) DO UPDATE SET \
                   deposit = excluded.deposit, \
                   withdrawal = excluded.withdrawal, \
                   end_balance = excluded.end_balance, \
                   note = excluded.note, \
                   updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')",
            )?;
            for day in days {
                stmt.execute(params![
                    day.trade_date,
                    day.deposit,
                    day.withdrawal,
                    day.end_balance,
                    day.note,
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
            "INSERT INTO trading_day (trade_date, deposit, withdrawal, end_balance, note, updated_at) \
             VALUES (?1, ?2, ?3, ?4, ?5, strftime('%Y-%m-%dT%H:%M:%fZ','now')) \
             ON CONFLICT(trade_date) DO UPDATE SET \
               deposit = excluded.deposit, \
               withdrawal = excluded.withdrawal, \
               end_balance = excluded.end_balance, \
               note = excluded.note, \
               updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')",
            params![
                day.trade_date,
                day.deposit,
                day.withdrawal,
                day.end_balance,
                day.note,
            ],
        )?;
        tx.commit()?;
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
                "INSERT INTO trading_day (trade_date, deposit, withdrawal, end_balance, note, updated_at) \
                 VALUES (?1, ?2, ?3, ?4, ?5, strftime('%Y-%m-%dT%H:%M:%fZ','now'))",
            )?;
            for day in days {
                stmt.execute(params![
                    day.trade_date,
                    day.deposit,
                    day.withdrawal,
                    day.end_balance,
                    day.note,
                ])?;
            }
        }
        tx.commit()?;
        Ok(())
    }
}

fn row_to_trading_day(row: &rusqlite::Row<'_>) -> rusqlite::Result<TradingDay> {
    Ok(TradingDay {
        trade_date: row.get(0)?,
        deposit: row.get(1)?,
        withdrawal: row.get(2)?,
        end_balance: row.get(3)?,
        note: row.get(4)?,
        created_at: row.get(5)?,
        updated_at: row.get(6)?,
    })
}
