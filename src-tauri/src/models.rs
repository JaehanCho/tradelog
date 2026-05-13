use serde::{Deserialize, Serialize};

/// One row per KST calendar date.
/// `trade_date` is `YYYY-MM-DD` in KST (Asia/Seoul).
/// `created_at` and `updated_at` are UTC ISO 8601 timestamps.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TradingDay {
    pub trade_date: String,
    #[serde(default)]
    pub deposit: f64,
    #[serde(default)]
    pub withdrawal: f64,
    pub end_balance: Option<f64>,
    #[serde(default)]
    pub note: String,
    #[serde(default)]
    pub market_note: String,
    #[serde(default)]
    pub created_at: Option<String>,
    #[serde(default)]
    pub updated_at: Option<String>,
}

/// A long-lived DeFi / yield-farming position. Identity is the user-supplied
/// `id` (UUID generated client-side).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DefiPosition {
    pub id: String,
    pub protocol: String,
    #[serde(default)]
    pub chain: String,
    pub asset: String,
    pub principal_usd: f64,
    pub opened_date: String,
    #[serde(default)]
    pub closed_date: Option<String>,
    #[serde(default)]
    pub note: String,
    #[serde(default)]
    pub created_at: Option<String>,
    #[serde(default)]
    pub updated_at: Option<String>,
}

/// A point-in-time valuation of a `DefiPosition`. The position's current
/// value is the latest snapshot's `value_usd`.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DefiSnapshot {
    pub id: String,
    pub position_id: String,
    pub snapshot_date: String,
    pub value_usd: f64,
    #[serde(default)]
    pub fees_earned_usd: f64,
    #[serde(default)]
    pub note: String,
    #[serde(default)]
    pub created_at: Option<String>,
}

/// A trading-wisdom note: quote, tip, or personal insight. `tags` is a
/// comma-separated list (e.g. "psychology,risk"). `pinned` is 0 or 1.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WisdomNote {
    pub id: String,
    pub body: String,
    #[serde(default)]
    pub source: String,
    #[serde(default)]
    pub tags: String,
    #[serde(default)]
    pub pinned: i64,
    #[serde(default)]
    pub created_at: Option<String>,
    #[serde(default)]
    pub updated_at: Option<String>,
}

/// Long-position stock holding. PK is the (`symbol`, `market`) pair so
/// the same ticker on different markets stays distinct. `avg_cost` is in
/// the position's native currency (USD for `US`, KRW for `KR_*`).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StockHolding {
    pub symbol: String,
    pub market: String,
    #[serde(default)]
    pub display_name: String,
    pub quantity: f64,
    pub avg_cost: f64,
    #[serde(default)]
    pub created_at: Option<String>,
    #[serde(default)]
    pub updated_at: Option<String>,
}

/// A watched ticker (no position yet). Same PK as `StockHolding`.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StockWatch {
    pub symbol: String,
    pub market: String,
    #[serde(default)]
    pub display_name: String,
    #[serde(default)]
    pub created_at: Option<String>,
    #[serde(default)]
    pub updated_at: Option<String>,
}

/// One entry in a per-ticker note timeline. `id` is `None` for new notes
/// (autoincrement). Notes have no FK to holdings/watches — the history
/// outlives the position.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StockNote {
    #[serde(default)]
    pub id: Option<i64>,
    pub symbol: String,
    pub market: String,
    pub note_date: String,
    pub body: String,
    #[serde(default)]
    pub created_at: Option<String>,
    #[serde(default)]
    pub updated_at: Option<String>,
}

/// Cached Yahoo Finance quote. `price` and `prev_close` are in native
/// currency; the FX conversion happens in the UI.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StockQuote {
    pub symbol: String,
    pub market: String,
    pub price: f64,
    pub prev_close: Option<f64>,
    pub currency: String,
    pub fetched_at: String,
}

/// Cached FX rate, currently only `USDKRW` is used.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FxRate {
    pub pair: String,
    pub rate: f64,
    pub fetched_at: String,
}
