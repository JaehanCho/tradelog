use tauri::State;

use crate::error::AppResult;
use crate::models::{DefiPosition, DefiSnapshot, TradingDay};
use crate::AppState;

#[tauri::command]
pub fn get_all_trading_days(state: State<'_, AppState>) -> AppResult<Vec<TradingDay>> {
    let db = state.db.lock();
    db.get_all()
}

#[tauri::command]
pub fn get_trading_days_range(
    state: State<'_, AppState>,
    from: String,
    to: String,
) -> AppResult<Vec<TradingDay>> {
    let db = state.db.lock();
    db.get_range(&from, &to)
}

#[tauri::command]
pub fn upsert_trading_day(state: State<'_, AppState>, day: TradingDay) -> AppResult<()> {
    let mut db = state.db.lock();
    db.upsert(&day)
}

#[tauri::command]
pub fn rename_or_upsert_trading_day(
    state: State<'_, AppState>,
    old_trade_date: String,
    day: TradingDay,
) -> AppResult<()> {
    let mut db = state.db.lock();
    db.rename_or_upsert(&old_trade_date, &day)
}

#[tauri::command]
pub fn get_settings(
    state: State<'_, AppState>,
) -> AppResult<std::collections::HashMap<String, String>> {
    let db = state.db.lock();
    db.get_settings()
}

#[tauri::command]
pub fn set_setting(
    state: State<'_, AppState>,
    key: String,
    value: String,
) -> AppResult<()> {
    let mut db = state.db.lock();
    db.set_setting(&key, &value)
}

#[tauri::command]
pub fn upsert_trading_days(
    state: State<'_, AppState>,
    days: Vec<TradingDay>,
) -> AppResult<()> {
    let mut db = state.db.lock();
    db.upsert_many(&days)
}

#[tauri::command]
pub fn delete_trading_day(state: State<'_, AppState>, trade_date: String) -> AppResult<()> {
    let mut db = state.db.lock();
    db.delete(&trade_date)
}

#[tauri::command]
pub fn replace_all_trading_days(
    state: State<'_, AppState>,
    days: Vec<TradingDay>,
) -> AppResult<()> {
    let mut db = state.db.lock();
    db.replace_all(&days)
}

// ─── DeFi positions / snapshots ──────────────────────────────────────────

#[tauri::command]
pub fn get_defi_positions(state: State<'_, AppState>) -> AppResult<Vec<DefiPosition>> {
    let db = state.db.lock();
    db.get_defi_positions()
}

#[tauri::command]
pub fn upsert_defi_position(
    state: State<'_, AppState>,
    position: DefiPosition,
) -> AppResult<()> {
    let mut db = state.db.lock();
    db.upsert_defi_position(&position)
}

#[tauri::command]
pub fn delete_defi_position(state: State<'_, AppState>, id: String) -> AppResult<()> {
    let mut db = state.db.lock();
    db.delete_defi_position(&id)
}

#[tauri::command]
pub fn get_position_snapshots(
    state: State<'_, AppState>,
    position_id: String,
) -> AppResult<Vec<DefiSnapshot>> {
    let db = state.db.lock();
    db.get_position_snapshots(&position_id)
}

#[tauri::command]
pub fn add_position_snapshot(
    state: State<'_, AppState>,
    snapshot: DefiSnapshot,
) -> AppResult<()> {
    let mut db = state.db.lock();
    db.add_position_snapshot(&snapshot)
}

#[tauri::command]
pub fn delete_position_snapshot(state: State<'_, AppState>, id: String) -> AppResult<()> {
    let mut db = state.db.lock();
    db.delete_position_snapshot(&id)
}
