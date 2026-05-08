mod commands;
mod db;
mod error;
mod models;

use std::sync::Arc;

use parking_lot::Mutex;
use tauri::Manager;

use commands::*;
use db::Db;

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
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
