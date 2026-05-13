mod commands;
mod db;
mod error;
mod models;
mod stock_quotes;

use std::sync::Arc;

use parking_lot::Mutex;
use tauri::Manager;

use commands::*;
use db::Db;
use stock_quotes::refresh_stock_quotes;

pub struct AppState {
    pub db: Arc<Mutex<Db>>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .setup(|app| {
            let db = Db::open(app.handle())?;
            app.manage(AppState {
                db: Arc::new(Mutex::new(db)),
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_all_trading_days,
            get_trading_days_range,
            upsert_trading_day,
            upsert_trading_days,
            delete_trading_day,
            replace_all_trading_days,
            rename_or_upsert_trading_day,
            get_settings,
            set_setting,
            get_defi_positions,
            upsert_defi_position,
            delete_defi_position,
            get_position_snapshots,
            add_position_snapshot,
            delete_position_snapshot,
            get_wisdom_notes,
            upsert_wisdom_note,
            delete_wisdom_note,
            get_stock_holdings,
            upsert_stock_holding,
            delete_stock_holding,
            get_stock_watches,
            upsert_stock_watch,
            delete_stock_watch,
            get_stock_notes,
            upsert_stock_note,
            delete_stock_note,
            get_stock_quotes,
            refresh_stock_quotes,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
