use tauri::State;

use crate::error::AppResult;
use crate::models::TradingDay;
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
