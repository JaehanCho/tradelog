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
