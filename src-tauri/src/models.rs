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
