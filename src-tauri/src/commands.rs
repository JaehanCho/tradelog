use tauri::State;

use crate::error::AppResult;
use crate::models::{
    DefiPosition, DefiSnapshot, StockHolding, StockNote, StockQuote, StockWatch, TradingDay,
    WisdomNote,
};
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

// ─── Wisdom notes ────────────────────────────────────────────────────────

#[tauri::command]
pub fn get_wisdom_notes(state: State<'_, AppState>) -> AppResult<Vec<WisdomNote>> {
    let db = state.db.lock();
    db.get_wisdom_notes()
}

#[tauri::command]
pub fn upsert_wisdom_note(state: State<'_, AppState>, note: WisdomNote) -> AppResult<()> {
    let mut db = state.db.lock();
    db.upsert_wisdom_note(&note)
}

#[tauri::command]
pub fn delete_wisdom_note(state: State<'_, AppState>, id: String) -> AppResult<()> {
    let mut db = state.db.lock();
    db.delete_wisdom_note(&id)
}

// ─── Stocks: holdings ────────────────────────────────────────────────────

#[tauri::command]
pub fn get_stock_holdings(state: State<'_, AppState>) -> AppResult<Vec<StockHolding>> {
    let db = state.db.lock();
    db.get_stock_holdings()
}

#[tauri::command]
pub fn upsert_stock_holding(
    state: State<'_, AppState>,
    holding: StockHolding,
) -> AppResult<()> {
    let mut db = state.db.lock();
    db.upsert_stock_holding(&holding)
}

#[tauri::command]
pub fn delete_stock_holding(
    state: State<'_, AppState>,
    symbol: String,
    market: String,
) -> AppResult<()> {
    let mut db = state.db.lock();
    db.delete_stock_holding(&symbol, &market)
}

// ─── Stocks: watchlist ───────────────────────────────────────────────────

#[tauri::command]
pub fn get_stock_watches(state: State<'_, AppState>) -> AppResult<Vec<StockWatch>> {
    let db = state.db.lock();
    db.get_stock_watches()
}

#[tauri::command]
pub fn upsert_stock_watch(state: State<'_, AppState>, watch: StockWatch) -> AppResult<()> {
    let mut db = state.db.lock();
    db.upsert_stock_watch(&watch)
}

#[tauri::command]
pub fn delete_stock_watch(
    state: State<'_, AppState>,
    symbol: String,
    market: String,
) -> AppResult<()> {
    let mut db = state.db.lock();
    db.delete_stock_watch(&symbol, &market)
}

// ─── Stocks: per-ticker note timeline ────────────────────────────────────

#[tauri::command]
pub fn get_stock_notes(
    state: State<'_, AppState>,
    symbol: Option<String>,
    market: Option<String>,
) -> AppResult<Vec<StockNote>> {
    let db = state.db.lock();
    db.get_stock_notes(symbol.as_deref(), market.as_deref())
}

#[tauri::command]
pub fn upsert_stock_note(state: State<'_, AppState>, note: StockNote) -> AppResult<i64> {
    let mut db = state.db.lock();
    db.upsert_stock_note(&note)
}

#[tauri::command]
pub fn delete_stock_note(state: State<'_, AppState>, id: i64) -> AppResult<()> {
    let mut db = state.db.lock();
    db.delete_stock_note(id)
}

// ─── Stocks: quote cache (read-only from front-end; refresh added in Phase 5) ──

#[tauri::command]
pub fn get_stock_quotes(state: State<'_, AppState>) -> AppResult<Vec<StockQuote>> {
    let db = state.db.lock();
    db.get_stock_quotes()
}
