//! Live stock-quote integration for the Stocks tab.
//!
//! Yahoo Finance's free quote endpoint started returning 429 from most
//! consumer IPs in 2024–2026 (cookie + crumb required), so we use:
//!
//!   - **Stooq**  for US tickers + the USDKRW pair (CSV, no auth, daily
//!     close-of-business resolution — good enough for buy-and-hold).
//!   - **Naver Finance** for Korean tickers (`/api/stock/{code}/integration`),
//!     which gives us both today's close and yesterday's close from the
//!     `dealTrendInfos` history array.
//!
//! Cache policy: 5-minute freshness window per row in `stock_quote_cache`
//! and `fx_cache`. `force=false` skips fresh rows entirely; `force=true`
//! refetches everything. All HTTP happens with the DB lock released.

use std::collections::BTreeSet;
use std::time::Duration;

use chrono::Utc;
use futures::future::join_all;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use tauri::State;

use crate::db::Db;
use crate::error::{AppError, AppResult};
use crate::models::{FxRate, StockQuote};
use crate::AppState;

const QUOTE_FRESHNESS_SECS: i64 = 300;
const HTTP_TIMEOUT: Duration = Duration::from_secs(8);
const STOOQ_QUOTE_URL: &str = "https://stooq.com/q/l/";
const NAVER_KR_URL: &str = "https://m.stock.naver.com/api/stock/";
const FX_PAIR: &str = "USDKRW";
const FX_STOOQ_SYMBOL: &str = "usdkrw";

const USER_AGENT: &str = concat!(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ",
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 ",
    "TradeLog/",
    env!("CARGO_PKG_VERSION"),
);

#[derive(Debug, Serialize, Clone)]
pub struct FailedTicker {
    pub symbol: String,
    pub market: String,
}

#[derive(Debug, Serialize)]
pub struct QuoteRefreshResult {
    pub quotes: Vec<StockQuote>,
    pub fx_rate: Option<f64>,
    pub fx_fetched_at: Option<String>,
    pub fetched: i32,
    pub skipped: i32,
    pub failed_symbols: Vec<FailedTicker>,
}

struct RefreshPlan {
    tickers: Vec<(String, String)>,
    skipped: i32,
    need_fx: bool,
}

struct FetchOutcome {
    quotes: Vec<StockQuote>,
    fx_rate: Option<f64>,
    failed: Vec<FailedTicker>,
}

fn now_iso() -> String {
    Utc::now().format("%Y-%m-%dT%H:%M:%S%.3fZ").to_string()
}

fn is_fresh(fetched_at: &str, now: i64) -> bool {
    chrono::DateTime::parse_from_rfc3339(fetched_at)
        .map(|t| (now - t.timestamp()) < QUOTE_FRESHNESS_SECS)
        .unwrap_or(false)
}

/// Stooq US ticker convention: lowercase, dots → dashes, `.us` suffix.
/// e.g. "BRK.B" → "brk-b.us", "AAPL" → "aapl.us".
fn stooq_us_symbol(symbol: &str) -> String {
    format!("{}.us", symbol.to_lowercase().replace('.', "-"))
}

fn plan_refresh(db: &Db, force: bool) -> AppResult<RefreshPlan> {
    let holdings = db.get_stock_holdings()?;
    let watches = db.get_stock_watches()?;
    let cache = db.get_stock_quotes()?;
    let fx = db.get_fx_rate(FX_PAIR)?;

    let mut unique: BTreeSet<(String, String)> = BTreeSet::new();
    for h in &holdings {
        unique.insert((h.symbol.clone(), h.market.clone()));
    }
    for w in &watches {
        unique.insert((w.symbol.clone(), w.market.clone()));
    }
    let has_kr = unique.iter().any(|(_, m)| m.starts_with("KR_"));

    let now = Utc::now().timestamp();
    let mut to_fetch: Vec<(String, String)> = Vec::new();
    let mut skipped = 0;
    for (sym, mkt) in unique {
        let cached = cache.iter().find(|q| q.symbol == sym && q.market == mkt);
        let stale = match cached {
            Some(c) if !force => !is_fresh(&c.fetched_at, now),
            _ => true,
        };
        if stale {
            to_fetch.push((sym, mkt));
        } else {
            skipped += 1;
        }
    }

    let fx_stale = match (&fx, force) {
        (Some(f), false) => !is_fresh(&f.fetched_at, now),
        _ => true,
    };
    let need_fx = has_kr && fx_stale;

    Ok(RefreshPlan {
        tickers: to_fetch,
        skipped,
        need_fx,
    })
}

/// Parses a Stooq snapshot CSV. Returns the Close column if present.
/// The first line is the header; the second has the data.
/// "N/D" markers (unknown ticker / no data) yield None.
fn parse_stooq_close(text: &str) -> Option<f64> {
    let line = text.lines().nth(1)?;
    let fields: Vec<&str> = line.split(',').collect();
    if fields.len() < 7 || fields[1] == "N/D" {
        return None;
    }
    fields[6].parse::<f64>().ok()
}

async fn fetch_stooq_us(client: &Client, symbol: &str) -> Option<f64> {
    let url = format!(
        "{}?s={}&f=sd2t2ohlcv&h&e=csv",
        STOOQ_QUOTE_URL,
        stooq_us_symbol(symbol)
    );
    let resp = client.get(&url).send().await.ok()?;
    if !resp.status().is_success() {
        return None;
    }
    let text = resp.text().await.ok()?;
    parse_stooq_close(&text)
}

async fn fetch_stooq_fx(client: &Client) -> Option<f64> {
    let url = format!(
        "{}?s={}&f=sd2t2ohlcv&h&e=csv",
        STOOQ_QUOTE_URL, FX_STOOQ_SYMBOL
    );
    let resp = client.get(&url).send().await.ok()?;
    if !resp.status().is_success() {
        return None;
    }
    let text = resp.text().await.ok()?;
    parse_stooq_close(&text)
}

fn parse_kr_amount(s: &str) -> Option<f64> {
    s.replace(',', "").parse::<f64>().ok()
}

/// Returns (current_close, prev_close) — both in native KRW.
/// Reads from Naver's `dealTrendInfos` history; `[0]` is the most recent
/// trading day, `[1]` the prior one.
async fn fetch_naver_kr(client: &Client, symbol: &str) -> Option<(f64, Option<f64>)> {
    let url = format!("{}{}/integration", NAVER_KR_URL, symbol);
    let resp = client.get(&url).send().await.ok()?;
    if !resp.status().is_success() {
        return None;
    }
    let json: Value = resp.json().await.ok()?;
    let trends = json.get("dealTrendInfos")?.as_array()?;
    if trends.is_empty() {
        return None;
    }
    let today = trends[0]
        .get("closePrice")
        .and_then(|v| v.as_str())
        .and_then(parse_kr_amount)?;
    let prev = trends
        .get(1)
        .and_then(|t| t.get("closePrice"))
        .and_then(|v| v.as_str())
        .and_then(parse_kr_amount);
    Some((today, prev))
}

async fn fetch_quotes(plan: &RefreshPlan) -> Result<FetchOutcome, AppError> {
    let client = Client::builder()
        .timeout(HTTP_TIMEOUT)
        .user_agent(USER_AGENT)
        .build()
        .map_err(|e| AppError::Other(format!("reqwest build: {e}")))?;

    let now = now_iso();

    // Each per-ticker future yields (sym, market, Option<StockQuote>).
    let quote_futures = plan.tickers.iter().map(|(sym, mkt)| {
        let sym = sym.clone();
        let mkt = mkt.clone();
        let client = client.clone();
        let now = now.clone();
        async move {
            let result: Option<StockQuote> = if mkt == "US" {
                fetch_stooq_us(&client, &sym).await.map(|price| StockQuote {
                    symbol: sym.clone(),
                    market: mkt.clone(),
                    price,
                    prev_close: None,
                    currency: "USD".to_string(),
                    fetched_at: now.clone(),
                })
            } else {
                fetch_naver_kr(&client, &sym)
                    .await
                    .map(|(price, prev)| StockQuote {
                        symbol: sym.clone(),
                        market: mkt.clone(),
                        price,
                        prev_close: prev,
                        currency: "KRW".to_string(),
                        fetched_at: now.clone(),
                    })
            };
            (sym, mkt, result)
        }
    });

    let quote_fut = join_all(quote_futures);
    let fx_fut = async {
        if plan.need_fx {
            fetch_stooq_fx(&client).await
        } else {
            None
        }
    };
    let (quote_results, fx_rate) = futures::future::join(quote_fut, fx_fut).await;

    let mut quotes: Vec<StockQuote> = Vec::new();
    let mut failed: Vec<FailedTicker> = Vec::new();
    for (sym, mkt, res) in quote_results {
        match res {
            Some(q) => quotes.push(q),
            None => failed.push(FailedTicker {
                symbol: sym,
                market: mkt,
            }),
        }
    }

    Ok(FetchOutcome {
        quotes,
        fx_rate,
        failed,
    })
}

#[tauri::command]
pub async fn refresh_stock_quotes(
    state: State<'_, AppState>,
    force: bool,
) -> AppResult<QuoteRefreshResult> {
    // 1. Lock briefly → build the plan (no .await while locked).
    let plan = {
        let db = state.db.lock();
        plan_refresh(&db, force)?
    };

    // 2. Lock-free HTTP fan-out.
    let outcome = if plan.tickers.is_empty() && !plan.need_fx {
        FetchOutcome {
            quotes: vec![],
            fx_rate: None,
            failed: vec![],
        }
    } else {
        fetch_quotes(&plan).await?
    };

    // 3. Lock briefly → upsert results.
    if !outcome.quotes.is_empty() || outcome.fx_rate.is_some() {
        let mut db = state.db.lock();
        if !outcome.quotes.is_empty() {
            db.upsert_stock_quotes(&outcome.quotes)?;
        }
        if let Some(rate) = outcome.fx_rate {
            db.upsert_fx_rate(&FxRate {
                pair: FX_PAIR.to_string(),
                rate,
                fetched_at: now_iso(),
            })?;
        }
    }

    // 4. Read merged state.
    let db = state.db.lock();
    let quotes = db.get_stock_quotes()?;
    let fx = db.get_fx_rate(FX_PAIR)?;
    let fetched = outcome.quotes.len() as i32;
    Ok(QuoteRefreshResult {
        quotes,
        fx_rate: fx.as_ref().map(|f| f.rate),
        fx_fetched_at: fx.as_ref().map(|f| f.fetched_at.clone()),
        fetched,
        skipped: plan.skipped,
        failed_symbols: outcome.failed,
    })
}

// Yahoo response types kept around for potential future use; current
// fetchers use Stooq + Naver. Suppressed to avoid dead-code warnings.
#[allow(dead_code)]
#[derive(Deserialize, Debug)]
struct YahooQuoteResponse {
    #[serde(rename = "quoteResponse")]
    quote_response: YahooQuoteEnvelope,
}

#[allow(dead_code)]
#[derive(Deserialize, Debug)]
struct YahooQuoteEnvelope {
    #[serde(default)]
    result: Vec<YahooQuoteItem>,
}

#[allow(dead_code)]
#[derive(Deserialize, Debug)]
struct YahooQuoteItem {
    symbol: String,
    #[serde(rename = "regularMarketPrice")]
    regular_market_price: Option<f64>,
    #[serde(rename = "regularMarketPreviousClose")]
    regular_market_previous_close: Option<f64>,
    #[serde(default)]
    currency: Option<String>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn stooq_us_lowercase_and_dash() {
        assert_eq!(stooq_us_symbol("AAPL"), "aapl.us");
        assert_eq!(stooq_us_symbol("BRK.B"), "brk-b.us");
        assert_eq!(stooq_us_symbol("spy"), "spy.us");
    }

    #[test]
    fn parse_stooq_close_extracts_seventh_field() {
        let csv =
            "Symbol,Date,Time,Open,High,Low,Close,Volume\nAAPL.US,2026-05-12,22:00:19,292.56,295.27,292.56,294.87,45682641";
        assert_eq!(parse_stooq_close(csv), Some(294.87));
    }

    #[test]
    fn parse_stooq_close_handles_no_data() {
        let csv = "Symbol,Date,Time,Open,High,Low,Close,Volume\n005930.KR,N/D,N/D,N/D,N/D,N/D,N/D,N/D";
        assert_eq!(parse_stooq_close(csv), None);
    }

    #[test]
    fn parse_kr_amount_strips_commas() {
        assert_eq!(parse_kr_amount("279,000"), Some(279_000.0));
        assert_eq!(parse_kr_amount("1,234,567"), Some(1_234_567.0));
        assert_eq!(parse_kr_amount("not-a-number"), None);
    }

    #[test]
    fn is_fresh_true_for_recent() {
        let now = Utc::now().timestamp();
        let recent = now_iso();
        assert!(is_fresh(&recent, now));
    }

    #[test]
    fn is_fresh_false_for_stale() {
        let now = Utc::now().timestamp();
        let stale = (Utc::now() - chrono::Duration::seconds(QUOTE_FRESHNESS_SECS + 60))
            .format("%Y-%m-%dT%H:%M:%S%.3fZ")
            .to_string();
        assert!(!is_fresh(&stale, now));
    }

    #[test]
    fn is_fresh_false_for_unparseable() {
        let now = Utc::now().timestamp();
        assert!(!is_fresh("not-a-date", now));
    }
}
