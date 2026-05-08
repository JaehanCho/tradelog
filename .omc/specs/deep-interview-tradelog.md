# Deep Interview Spec: TradeLog (매매일지 데스크탑 앱)

## Metadata
- **Interview ID:** dintv-tradelog-2026-05-06
- **Rounds:** 9
- **Final Ambiguity Score:** 5.9%
- **Type:** greenfield (코드 0) + data context (기존 엑셀 1년+)
- **Generated:** 2026-05-06
- **Threshold:** 20%
- **Status:** PASSED (사용자 요청에 따라 임계 한참 아래로 추가 추진)
- **Source data:** `/Users/al03030164/Library/Mobile Documents/com~apple~CloudDocs/Documents/매매_일지_달러.xlsx` (3 monthly sheets: 2024-12, 2026-04, 2026-05)
- **Tentative project name:** `tradelog` (final 추후 결정)

## Clarity Breakdown
| Dimension | Score | Weight | Weighted |
|-----------|-------|--------|----------|
| Goal Clarity | 0.95 | 40% | 0.380 |
| Constraint Clarity | 0.95 | 30% | 0.285 |
| Success Criteria | 0.92 | 30% | 0.276 |
| **Total Clarity** | | | **0.941** |
| **Ambiguity** | | | **5.9%** |

---

## Goal

**v1: macOS 데스크탑 앱(Tauri)으로, 기존 엑셀 매매일지를 대체하는 일별 P&L 트래커. 자산곡선 + 현재잔액 hero, 스프레드시트-스타일 grid 입력(엑셀 row 복붙 100% 호환), 누적 수익률은 시작일부터 끊김 없이 연속 누적, Apple-native 톤(SF Pro · 시스템 컬러 · vibrancy), GitHub Releases 기반 자동업데이트.**

데이터 스키마는 처음부터 v1.5(클라우드 sync) 및 v2(거래별 입력) 호환되게 설계.

### 단계별 진화 (R1, R6 결정)
- **v1 (현재 spec):** Mac Tauri only, local SQLite, 일별 P&L + 자유텍스트 비고, 자동업데이트
- **v1.5:** Cloudflare Workers + D1(SQLite) + Hono 백엔드, iPhone PWA, 양방향 sync (Mac↔iPhone read-write)
- **v2:** 거래별 입력 (코인 · 방향 · 진입가 · 청산가 · 수량 · 레버리지 · 전략 태그), 일별 P&L 자동 합산, 코인별/전략별 통계 시각화

## Constraints

### v1 Constraints (구속)
- **OS:** macOS only (Apple Silicon + Intel)
- **Framework:** Tauri (v2, stable) — Rust core + TypeScript/React 또는 Svelte 프론트엔드
- **Storage:** Local SQLite — 위치는 macOS Application Support / `~/Library/Application Support/tradelog/db.sqlite`
- **iCloud Drive 의존성 0** (사용자가 R3에서 명시 거부 — 파일시스템 sync 회피)
- **외부 BaaS 의존성 0** — Supabase 등 SaaS lock-in 회피 (R3 사용자 거부)
- **xlsx 파서 의존성 0** — calamine/xlsx 라이브러리 안 들어감 (R8 사용자 결정 — paste-based migration이 더 우아하고 범용적)
- **Bundle size 목표:** ≤ 15MB (Tauri 본체 ~5-10MB + grid lib ~100-200KB + 차트 lib + Apple-native styling)
- **자동업데이트:** Tauri updater plugin + GitHub Releases (public repo) — stable 채널 1개
- **인증/계정:** v1엔 없음 (Mac local 단일 사용자)
- **거래일 cutoff:** 00:00 Asia/Seoul (KST) — 저장은 UTC, 표시·그룹핑은 KST
- **통화:** USD 표시 고정 (KRW 변환 v1 미포함)
- **App 코드사이닝:** Apple Developer 계정 ($99/yr) — 자동업데이트가 정상 작동하려면 notarization 필수. v1 출시 시 결정.

### v1 디자인 톤 Constraints (R7)
- **레퍼런스:** Apple Native macOS HIG
- **폰트:** SF Pro (시스템 폰트 직접 사용)
- **색:** 시스템 다이나믹 컬러 (라이트/다크 자동, 시스템 prefs 따름)
- **효과:** Tauri의 macOS vibrancy plugin 사용
- **컴포넌트:** shadcn/ui primitives + Apple HIG 디자인 토큰 커스터마이즈 (또는 react-aria-components 기반 빌드)
- **밀도:** 미니멀, 정보 밀도는 hero 외엔 낮게 유지

### Non-Goals (R3, R8 등 명시 거부)
- ❌ iCloud Drive 파일 동기화
- ❌ Supabase / Firebase 등 BaaS
- ❌ Windows / Linux / Android 지원 (v1)
- ❌ iPhone (v1 — v1.5에서 추가)
- ❌ 거래소 API 연동 (Binance/Upbit 등 — v2도 안함, v3+ 후보)
- ❌ KRW 환산 / 다중 통화
- ❌ AI/LLM 분석 기능
- ❌ 멀티 유저 / 공유
- ❌ Beta 자동업데이트 채널 (stable 1개만)
- ❌ xlsx 파일 자동 import (대신 grid에 paste)

## Acceptance Criteria

v1을 "끝났다"고 인정할 수 있는 검증 가능 항목:

- [ ] Tauri Mac 앱이 빌드되고 .app 번들이 ≤ 15MB
- [ ] 첫 실행 시 빈 메인 화면(자산곡선 placeholder + 잔액 $0 + grid 빈 상태) 표시
- [ ] 메인 화면 hero에 다음이 표시됨:
  - 현재 잔액 (가장 최근 row의 `end_balance`) — 큰 숫자 (SF Pro Display semibold)
  - 시작일~오늘 자산곡선 (라인 차트, area fill)
  - 목표선 ($500,000 @ 2028년 12월) 점선 overlay
  - 누적 수익률 % (시작일부터 끊김 없이 연속 — 월별 리셋 X)
- [ ] 입력 화면 = spreadsheet-like grid (컬럼: 날짜 / 입금 / 시작금액 / 최종금액 / 일일수익 / 일별수익률 / 누적수익률 / 출금 / 비고)
- [ ] 엑셀에서 직접 row 복사 → 앱 grid에 paste 시 TSV 자동 파싱 → 모든 row 자동 입력
- [ ] paste된 데이터의 `시작금액 / 일일수익 / 일별수익률 / 누적수익률`은 자동 계산 (사용자가 입력한 `최종금액 / 입금 / 출금 / 비고`만 신뢰 source)
- [ ] 누적 수익률 계산: `SUM(daily_pnl from very first day to current day) / (initial_capital + SUM(deposits))`
- [ ] 키보드 네비게이션: Tab/Enter 셀 이동, Cmd+C/V copy/paste, Cmd+Z undo
- [ ] 비고 셀은 멀티라인 텍스트 입력 (Notion-like inline edit)
- [ ] 라이트/다크 모드 자동 전환 (시스템 prefs 따름)
- [ ] macOS vibrancy 사이드바 적용
- [ ] Apple Developer 계정으로 코드사이닝 + notarization 통과
- [ ] GitHub Releases에 새 버전 업로드 시 앱이 자동 감지 → 사용자 동의 후 자동 업데이트 → 재시작
- [ ] 사용자가 엑셀의 2026-04, 2026-05 시트 데이터를 grid paste로 마이그레이션 가능 (≤ 5분 작업)
- [ ] 데이터 .sqlite 파일을 사용자가 직접 백업 가능한 경로에 저장 (`Application Support/tradelog/`)
- [ ] 첫 launch부터 종료까지 RSS 메모리 ≤ 200MB
- [ ] 콜드 스타트 ≤ 1.5초

### v1.5 (deferred — 미래 acceptance)
- [ ] Cloudflare Workers + Hono API + D1(SQLite) 백엔드 배포
- [ ] iPhone Safari에서 PWA 설치 가능 (Add to Home Screen)
- [ ] iPhone PWA에서 grid view + paste 입력 가능 (read-write)
- [ ] Mac↔iPhone 양방향 sync (offline-first, last-write-wins for single user)
- [ ] PIN/passcode 인증 (단일 사용자, 간단한 로컬 잠금)

### v2 (deferred)
- [ ] 거래별 입력 추가 (코인 · 방향 · 진입가 · 청산가 · 수량 · 레버리지 · 전략 태그 · 거래소)
- [ ] 거래별 데이터 → 일별 P&L 자동 합산
- [ ] 코인별 / 전략별 누적 수익 시각화
- [ ] 비고에서 거래 정보 추출 LLM 보조 (선택적)

## Assumptions Exposed & Resolved

| 라운드 | 가정 | 도전 | 해결 |
|--------|------|------|------|
| R1 | "엑셀처럼 가져가고 싶어" = 엑셀 그대로 복제 | 그러면 거래별 입력은? | 단계적 확장 — v1 일별 P&L, v2 거래별 |
| R2 | 데스크탑 = native Swift | TS 익숙한 LINE 개발자 | Tauri (Rust+TS) 단일 코드베이스 |
| R3 | 엑셀이 iCloud에 있으니 동기화도 iCloud Drive | 마이그레이션 lock-in 우려 | iCloud + Supabase 둘 다 거부 → 자체 백엔드로 |
| R4 (Contrarian) | "Mac↔iPhone 실시간 sync 필수" | 정말 실시간 필요한가? 그냥 가끔 보기? | Cloudflare Workers + D1 자체 백엔드 (SQLite, lock-in 0) |
| R5 | "예쁜 시각화" = 풍부한 차트 다수 | hero 자리에 단 한 가지만 둘 수 있다면? | 자산곡선 + 잔액 + 목표선 hero |
| R6 (Simplifier) | v1에 백엔드+iPhone+sync 다 포함 | 가장 작은 가치 있는 v1은? | Mac-only v1 + local SQLite, 백엔드+iPhone은 v1.5 |
| R7 | "깔끔하게 예쁨" = broad | 머릿속 레퍼런스 앱은? | Apple Native macOS HIG (SF Pro · vibrancy · 시스템 컬러) |
| R8 | "엑셀 → 앱 자동 import 기능 필요" | xlsx 파서 의존성이 정말 필요한가? | grid+paste UX가 일상 입력 + 마이그레이션 둘 다 해결 (xlsx 파서 제거 → 앱 더 가벼움) |
| R8b | 누적 수익률 월별 리셋 (엑셀 형식 그대로) | 사용자가 명시 변경 요청 | 시작일부터 연속 누적 — `MonthlySheet`는 모델 엔티티에서 강등(UI 라벨링만) |
| R9 | 거래일 cutoff 모호 | 24/7 자산이라 명시 필요 | KST 자정 (Asia/Seoul) |

## Technical Context

### v1 Stack (확정)
- **Framework:** Tauri 2.x (stable)
- **Backend (Rust):** sqlx + sqlite (또는 rusqlite)
- **Frontend:** TypeScript + React 18 (또는 Svelte 5 — 결정 deferred)
- **Build:** pnpm + Vite + Tauri CLI
- **State:** TanStack Query + Zustand (간단)
- **Grid lib:** AG Grid Community (~150KB) 또는 react-spreadsheet 또는 자체 SVG/HTML grid
- **Chart lib:** Recharts (간단) 또는 Visx (커스터마이즈 강함) — Apple HIG와 잘 맞는 라인+area fill
- **Component lib:** shadcn/ui primitives + Apple HIG 디자인 토큰 커스텀
- **Font:** SF Pro (system, no embed)
- **Update:** `tauri-plugin-updater` + GitHub Releases public repo
- **Vibrancy:** `tauri-plugin-decorum` 또는 native window flags

### v1.5 Stack (deferred)
- **Backend:** Hono on Cloudflare Workers
- **DB:** Cloudflare D1 (SQLite at edge)
- **ORM:** Drizzle (D1 호환, type-safe)
- **iPhone:** Same React/Svelte UI → Vite PWA build → Safari Add to Home Screen
- **Sync:** REST API + offline queue, conflict = last-write-wins (single user)
- **Auth:** 단일 사용자 PIN/passcode (로컬 lock) + API에 client-issued token

### Existing Excel Data Schema (참고)
- 파일: `매매_일지_달러.xlsx` (iCloud Drive)
- 시트: 월별 (`YYYY-MM`)
- 시트당 영역:
  - Row 1: 헤더(목표·원칙)
  - Row 2: 컬럼 헤더
  - Row 3-32: 일별 데이터 (1일~30/31일)
  - Row 34-35: 월간 합계
- 컬럼 (B-J):
  - B: 날짜 (`1일`, `2일`, ...)
  - C: 입금
  - D: 시작 금액 — `=IF(ISBLANK(E[t-1]),"",E[t-1]+C[t]-I[t-1])` 자동
  - E: 최종 금액 — **수동 입력**
  - F: 일일 수익 — `=E-D`
  - G: 일별 수익률 — `=(E-D)/D`
  - H: 누적 수익률 — `=SUM(F$3:F)/(D$3+SUM(C$3:C))` (시트 내부만)
  - I: 출금
  - J: 비고 (자유 텍스트, 거래 정보 포함)
- **마이그레이션 대상:** 2026-04, 2026-05 시트만 (사용자 결정, R8). 2024-12 스킵.

### v1 Data Model (SQLite)

```sql
CREATE TABLE trading_day (
  trade_date     TEXT PRIMARY KEY,    -- ISO date in KST (YYYY-MM-DD)
  deposit        REAL DEFAULT 0,      -- USD
  withdrawal     REAL DEFAULT 0,      -- USD
  end_balance    REAL,                -- USD, manually entered. NULL = 미입력 (휴장/미기입)
  note           TEXT DEFAULT '',     -- free-form Markdown
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_trading_day_date ON trading_day(trade_date);

-- Computed in app layer (not stored), per row:
--   start_balance(t)         = end_balance(t-1) + deposit(t) - withdrawal(t-1)
--   daily_pnl(t)             = end_balance(t) - start_balance(t)
--   daily_return_pct(t)      = daily_pnl(t) / start_balance(t)
--   cumulative_pnl(t)        = SUM(daily_pnl from very first row to t)
--   cumulative_return_pct(t) = cumulative_pnl(t) / (initial_capital + SUM(deposits up to t))
--   initial_capital          = first non-null end_balance row's start_balance (또는 첫 deposit)

-- v2 미래 호환 (지금은 안 만듦, 스키마만 예약)
-- CREATE TABLE trade (
--   id           INTEGER PRIMARY KEY AUTOINCREMENT,
--   trade_date   TEXT NOT NULL,
--   asset        TEXT NOT NULL,           -- e.g. "BTC", "AIXBT"
--   direction    TEXT NOT NULL,           -- "long" | "short"
--   entry_price  REAL NOT NULL,
--   exit_price   REAL,
--   size         REAL NOT NULL,
--   leverage     REAL DEFAULT 1,
--   strategy_tag TEXT,                    -- e.g. "scalping", "swing", "session-coin"
--   pnl          REAL,
--   note         TEXT,
--   FOREIGN KEY (trade_date) REFERENCES trading_day(trade_date)
-- );
```

### Auto-Update Flow
1. 앱 시작 시 `tauri-plugin-updater`가 GitHub Releases latest 확인
2. 새 버전 있으면 native 다이얼로그 표시 (사용자 동의)
3. 동의 시 background 다운로드 → 설치 → 재시작
4. signing은 Apple notarization + Tauri pubkey signing 둘 다 필요

## Ontology (Key Entities)

| Entity | Type | Fields | Relationships |
|--------|------|--------|---------------|
| TradingDay | core domain (v1) | trade_date, deposit, withdrawal, end_balance, note + 계산필드(start_balance, daily_pnl, daily_return_pct, cumulative_*) | 1:N (Future) Trade |
| Trade | core domain (v2 deferred) | trade_date, asset, direction, entry_price, exit_price, size, leverage, strategy_tag, pnl, note | N:1 TradingDay |
| Goal | supporting | target_amount ($500,000), target_date (2028-12-31), display_overlay (true) | N:0 (display 시 자산곡선에 overlay) |
| TauriApp | architecture (v1) | platform=macOS, framework=Tauri 2.x, bundle_size_target≤15MB | shell |
| LocalCache (LocalDB) | architecture (v1) | path=Application Support/tradelog/db.sqlite, engine=SQLite | persists TradingDay |
| AutoUpdater | architecture (v1) | channel=stable, source=GitHub Releases, plugin=tauri-plugin-updater | drives TauriApp |
| BackendAPI | architecture (v1.5 deferred) | host=Cloudflare Workers, framework=Hono | syncs LocalCache ↔ D1Database |
| D1Database | architecture (v1.5 deferred) | engine=Cloudflare D1 (SQLite) | mirrors LocalCache |
| DesignSystem | supporting | tone=Apple HIG, font=SF Pro, vibrancy=on, mode=auto(light/dark), components=shadcn-base | applied across views |
| GridInputView | UX (v1) | type=spreadsheet-like, paste_support=TSV/CSV, keyboard_nav=on | edits TradingDay |
| ~~MonthlySheet~~ | ~~core~~ → **UI grouping label only** (R8 강등) | display only, NOT a data entity | view filter |

## Ontology Convergence

| Round | Entity Count | New | Changed | Stable | Stability Ratio |
|-------|-------------|-----|---------|--------|----------------|
| 1 | 4 | 4 | - | - | N/A (첫 라운드) |
| 2 | 6 | 2 (TauriApp, AutoUpdater) | 0 | 4 | 67% |
| 3 | 6 | 0 | 0 | 6 | 100% |
| 4 | 9 | 3 (BackendAPI, D1Database, LocalCache) | 0 | 6 | 67% |
| 5 | 9 | 0 | 0 | 9 | 100% |
| 6 | 9 | 0 | 0 (v1/v1.5 카테고리만 재분류) | 9 | 100% |
| 7 | 10 | 1 (DesignSystem) | 0 | 9 | 90% |
| 8 | 10 | 1 (GridInputView), -1 (MonthlySheet 강등) | 1 (MonthlySheet) | 8 | 90% |
| 9 | 10 | 0 | 0 | 10 | 100% |

**Convergence:** 도메인 엔티티(TradingDay, Trade, Goal)는 R5 이후 완전 안정. 아키텍처 엔티티는 R4-R7 동안 채워짐. R8에서 `MonthlySheet`가 모델→UI로 강등되며 데이터 모델 단순화 (긍정적 convergence).

## Open Questions (Spec 작성 후 발생 가능)

낮은 우선순위 (v1 개발 중 해결):
1. 프론트엔드 React vs Svelte — Tauri 위에선 둘 다 OK. React는 ecosystem 깊고 (LINE 환경 매칭), Svelte는 더 가볍고 빠른 build. **추천: React** (lib 호환성·shadcn/ui 직접 사용·LINE 익숙도).
2. Grid 라이브러리 최종 결정 — AG Grid Community vs react-spreadsheet vs custom. **추천: AG Grid Community** (paste 핸들링 검증됨, 키보드 nav 완벽).
3. Chart 라이브러리 — Recharts vs Visx. **추천: Recharts 시작 → 디자인 한계 시 Visx로 마이그레이션**.
4. App 아이콘·로고 디자인 (v1 출시 직전 결정).
5. Apple Developer 계정 가입 시점 (v1 빌드 통과 후).
6. v1 첫 실행 onboarding 화면 디자인 (3-step intro 또는 skip-able).
7. 데이터 백업/복원 명시 UX (v1 단순 SQLite 파일 export 버튼만으로 충분?).

## Interview Transcript

<details>
<summary>Full Q&A (9 라운드)</summary>

### Round 1 — Goal Clarity / Entry Unit
**Q:** 비고(J열)에 들어가 있는 거래별 자유 텍스트를 어떻게 다룰까? (앱의 데이터 모델·자동업데이트 범위·시각화 종류·앱 무게를 통째로 결정)
**A:** 1번부터 시작 → 2번 단계적 확장 (MVP 분리). v1=일별 P&L+자유 비고, v2=거래별 입력. 스키마는 v2 호환 설계.
**Ambiguity:** 100% → 57.5%

### Round 2 — Constraint / Tech Stack
**Q:** 맥북 우선 + iPhone 확장 + 가벼움 + 자동업데이트 + 깔끔 디자인을 만족하는 기술 스택?
**A:** Tauri (Rust + React/Svelte) 단일 코드베이스.
**Ambiguity:** 57.5% → 48.5%

### Round 3 — Constraint / Data Sync
**Q:** 동기화 메커니즘은 iCloud Drive vs Supabase vs 로컬?
**A:** 사용자 거부 — iCloud Drive (파일시스템 X), Supabase (lock-in 우려). 대안 요청.
**Ambiguity:** 48.5% → 51.5% (거부 명시는 됐지만 positive direction 미정으로 약간 후퇴)

### Round 4 (Contrarian Mode) — Sync Model
**Q:** Mac↔iPhone 실시간 sync가 정말 필요한가? 가끔 보기로 충분한가? (파일시스템 X / Supabase X 제약 안에서 4가지 대안)
**A:** Cloudflare Workers + D1 (SQLite) + Hono — 자체 백엔드 풀 동기화 (Recommended).
**Ambiguity:** 51.5% → 44%

### Round 5 — Success Criteria / Hero View
**Q:** v1 메인 화면 첫인상으로 가장 보고 싶은 것?
**A:** 자산곡선 + 현재 잔액 큰 숫자 (Robinhood/Bloomberg 톤).
**Ambiguity:** 44% → 31.3%

### Round 6 (Simplifier Mode) — MVP Cut
**Q:** v1 가장 작은 가치 있는 cut?
**A:** Mac only + 로컬 SQLite + 자동업데이트만. 백엔드+iPhone+sync는 v1.5 (Recommended).
**Ambiguity:** 31.3% → 21.9%

### Round 7 — Design Tone
**Q:** "깔끔하게 예쁨"의 머릿속 레퍼런스 앱?
**A:** Apple Native (macOS HIG) — vibrancy, SF Pro, 시스템 컬러.
**Ambiguity:** 21.9% → 13.8%

### Round 8 — Migration & Input UX
**Q:** 1년+ 엑셀 데이터 마이그레이션 path?
**A (refined):** Spreadsheet-like grid (paste 100% 호환). xlsx 파서 의존성 제거. 일상 입력 = 마이그레이션 = 같은 grid+paste UX.
**🆕 새 요구:** 누적 수익률을 월별 리셋이 아니라 시작일부터 연속 누적되게.
**Ambiguity:** 13.8% → 8.8%

### Round 9 — Final Locks
**Q:** 거래일 cutoff timezone, 통화, 자동업데이트 채널, 이름?
**A:** 다 기본값 채택. KST 자정, USD 고정, stable 1채널, 이름 'tradelog' 임시.
**Ambiguity:** 8.8% → 5.9%

</details>

---

## Next Steps

이 spec을 다음 중 하나로 처리:
1. **Recommended:** `omc-plan --consensus --direct` → Planner/Architect/Critic consensus → autopilot
2. autopilot 직접 (Phase 1부터)
3. ralph (verification loop)
4. team (병렬 N agents)
5. 추가 인터뷰

**Note:** 코드 시작 전에 결정해야 할 것:
- 프로젝트 디렉토리 위치 (예: `~/Projects/tradelog`)
- GitHub repo 생성 (자동업데이트 source)
- 프론트엔드 React vs Svelte 최종 선택 (위 Open Question 참고)
