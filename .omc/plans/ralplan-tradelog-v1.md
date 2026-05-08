# RALPLAN: TradeLog v1 — macOS 매매일지 데스크탑 앱

**Plan ID:** ralplan-tradelog-v1
**Date:** 2026-05-06
**Source Spec:** `.omc/specs/deep-interview-tradelog.md` (9 라운드, ambiguity 5.9%)
**Scope:** v1 only (v1.5/v2 호환 스키마 설계 포함, 구현은 제외)

---

## 1. RALPLAN-DR Summary

### Principles (5)

1. **Spec의 Non-Goals 절대 위반 금지** — iCloud Drive, Supabase, xlsx 파서, Windows/iPhone v1, 거래소 API, KRW 변환, AI 분석, 멀티유저, Beta 채널 일체 포함 불가
2. **v1.5/v2 호환 스키마 유지** — `trading_day` 테이블은 v2의 `trade` 테이블 FK 대상. 스키마 설계 시 `trade_date TEXT PRIMARY KEY` 형식 유지, v2 컬럼 예약은 주석으로만
3. **Apple HIG 톤 준수** — SF Pro 시스템 폰트, 시스템 다이나믹 컬러, macOS vibrancy, 라이트/다크 자동 전환. 커스텀 디자인 토큰은 Apple HIG 기반
4. **Bundle size <= 15MB** — Tauri 본체 ~5-10MB 내에서 프론트엔드 JS 번들은 ~1-3MB 이내 유지 (gzip 기준 ~300-500KB)
5. **Cold start <= 1.5초, RSS <= 200MB** — 무거운 런타임/프레임워크 배제, 가상화(virtualization) 적용

### Decision Drivers (Top 3)

1. **Bundle size & 성능** — 15MB 앱 번들 제약 + 1.5초 콜드스타트. 프론트엔드 프레임워크와 grid/chart 라이브러리 선택에 직접 영향
2. **마이그레이션 UX (grid + paste)** — 엑셀에서 복사 -> 앱 grid에 paste로 TSV 자동 파싱. 이것이 일상 입력이자 마이그레이션 경로. clipboard paste 지원이 grid 라이브러리 선택의 최우선 기준
3. **Apple-native 톤** — SF Pro, vibrancy, 시스템 컬러. 컴포넌트 라이브러리와 차트 라이브러리의 커스터마이즈 자유도가 중요

### Viable Options

#### A. 프론트엔드 프레임워크: React vs Svelte

| 기준 | React 18 | Svelte 5 |
|------|----------|----------|
| **Bundle size** | ~140KB min (react+react-dom) | ~1.6KB (컴파일러, 런타임 거의 0) |
| **Tauri 호환성** | 공식 템플릿 지원 | 공식 템플릿 지원 |
| **Grid lib 생태계** | react-data-grid, AG Grid, TanStack Table 등 풍부 | 선택지 제한적 (svelte-data-grid 미성숙) |
| **Chart lib 생태계** | Recharts, Visx, Nivo 등 풍부 | LayerCake (제한적), D3 직접 사용 필요 |
| **shadcn/ui 호환** | 직접 사용 가능 | shadcn-svelte 존재하나 React 대비 뒤처짐 |
| **사용자 익숙도** | LINE Corp TS/React 환경 매칭 | 학습 필요 |
| **콜드스타트** | 약간 느림 (VDOM 초기화) | 더 빠름 (컴파일 출력) |

**추천: React 18**
- 이유: grid/chart 라이브러리 생태계가 압도적. Svelte에서 spreadsheet-like grid + TSV paste를 구현하려면 대부분 커스텀 빌드 필요. 사용자가 LINE Corp에서 React/TS 환경에 익숙. shadcn/ui 직접 사용으로 Apple HIG 디자인 토큰 커스텀이 수월. Bundle size 차이(~140KB)는 15MB 앱 번들 제약 내에서 무시 가능 수준.
- Svelte 비선택 이유: grid 라이브러리 생태계 부재가 치명적. paste handler를 처음부터 직접 구현해야 하며, 이는 v1 출시 일정에 큰 리스크.

#### B. Grid 라이브러리: react-data-grid vs Custom (TanStack Table + paste handler) vs AG Grid Community

| 기준 | react-data-grid (RDG) | Custom (TanStack Table base) | AG Grid Community |
|------|----------------------|------------------------------|-------------------|
| **TSV paste 지원** | 셀 간 copy/paste 내장 + 외부 TSV paste는 커스텀 핸들러 필요 (onPaste 이벤트 서피스 제공) | 직접 구현 (clipboard API + TSV 파서) | **Enterprise 전용** (Community에서 paste 불가) |
| **키보드 nav** | 내장 (Tab, Enter, Arrow) | 직접 구현 | 내장 |
| **Bundle size (min)** | ~40-60KB | TanStack ~15KB + 커스텀 코드 | ~300-400KB (전체 Community) |
| **라이선스** | MIT | MIT | MIT (Community) |
| **셀 에디팅** | 내장 인라인 에디터 | 직접 구현 | 내장 |
| **멀티라인 비고** | 커스텀 에디터로 확장 | 커스텀 에디터로 확장 | 커스텀 에디터로 확장 |
| **개발 비용** | 낮음 | 높음 (2-3일 추가) | 중간 (paste 직접 구현 필요) |
| **유지보수** | Supabase fork 활발 | 자체 유지보수 | 활발 |

**추천: react-data-grid (RDG)** (Phase 3.0 spike 검증 통과 조건부)
- 이유: 셀 에디팅 + 키보드 네비게이션(Tab/Enter/Arrow) + 가상화가 내장. 외부 TSV paste는 `onPaste` 이벤트 서피스를 통해 커스텀 핸들러로 구현 필요하나, RDG의 row model과 에디팅 인프라 위에 구축하면 headless 대비 통합 비용이 낮음. MIT 라이선스. 번들 ~40-60KB로 가벼움.
- **Phase 3.0 spike gate 필수:** RDG 채택 전 30분 PoC로 엑셀 30-row TSV -> onPaste -> grid 채움 검증. Spike 실패 시 fallback 경로 발동 (아래 참조).
- AG Grid Community 비선택 이유: **clipboard paste가 Enterprise 전용 기능** (연구 결과 확인). Community 에디션에서는 paste 이벤트를 직접 처리해야 하므로 RDG 대비 이점 없음. 번들도 300-400KB로 6-8배 무거움.
- Custom 비선택 이유: TanStack Table은 headless라 paste handler, 키보드 nav, 인라인 에디팅 전부 직접 구현해야 함. 단, **RDG spike 실패 시 fallback 경로로 채택 가능** (아래 ADR-002 참조).
- Handsontable: 상업 라이선스 ($899+/dev/yr). Non-commercial만 무료. 불채택.

#### C. Chart 라이브러리: Recharts vs Visx

| 기준 | Recharts | Visx (@visx/xychart) |
|------|----------|---------------------|
| **Bundle size (min)** | ~150-200KB | @visx/xychart ~390KB (단, 필요 모듈만 import 시 ~50-80KB) |
| **API 복잡도** | 선언적, 높은 수준 | 낮은 수준 primitives, D3 지식 필요 |
| **커스터마이즈** | 제한적 (프리셋 스타일) | 무제한 (SVG 직접 제어) |
| **Apple HIG 톤 호환** | 보통 (기본 스타일이 generic) | 높음 (SVG 직접 제어로 정밀 스타일링) |
| **Area fill + 라인 차트** | 내장 (`<AreaChart>`) | 내장 (`<AreaSeries>`) |
| **목표선 overlay** | `<ReferenceLine>` 컴포넌트 | 커스텀 `<Line>` + annotation |
| **개발 속도** | 빠름 (1-2시간) | 느림 (반나절-1일) |
| **라이선스** | MIT | MIT |

**추천: Recharts (v1 시작) -> 디자인 한계 시 Visx로 교체**
- 이유: v1 hero에 필요한 차트는 단 1개 (자산곡선 area fill + 목표선 점선 overlay). Recharts의 `<AreaChart>` + `<ReferenceLine>` 으로 30분 내 구현 가능. Apple HIG 톤은 색상/폰트/stroke 커스텀으로 충분히 맞출 수 있음. 번들도 더 가벼움.
- Visx 비선택 이유: 차트 1개에 D3 수준의 low-level API는 과잉 투자. v1.5/v2에서 복잡한 시각화 (코인별/전략별 통계) 추가 시 재평가.

---

## 2. Implementation Plan

### Phase 0: 프로젝트 부트스트랩
**목표:** Tauri v2 + React + Vite + pnpm 프로젝트 스캐폴딩, 빌드 파이프라인 확인

**영향 파일:**
- `package.json`, `pnpm-lock.yaml`
- `vite.config.ts`
- `tsconfig.json`, `tsconfig.node.json`
- `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json`, `src-tauri/src/lib.rs`, `src-tauri/src/main.rs`
- `src/main.tsx`, `src/App.tsx`
- `index.html`
- `.gitignore`

**작업:**
1. `pnpm create tauri-app tradelog --template react-ts` (또는 Tauri CLI v2 해당 명령)
2. Vite config에 React plugin 설정 확인
3. `tauri.conf.json`에 앱 메타데이터 설정 (identifier: `com.tradelog.app`, window title, 기본 크기 등)
4. `pnpm tauri dev` 로 빈 윈도우 뜨는지 확인
5. `pnpm tauri build` 로 .app 번들 생성 확인 (이 시점에서 번들 사이즈 baseline 측정)

**의존성:** 없음 (첫 단계)
**검증:**
- `pnpm tauri dev` 실행 -> 빈 Tauri 윈도우 표시
- `pnpm tauri build --target aarch64-apple-darwin` -> `.app` 번들 생성
- **[Measurement Gate]** 번들 베이스라인 측정: `du -sh src-tauri/target/release/bundle/macos/tradelog.app` -> 목표 < 10MB (이 값을 이후 phase에서 delta 추적 기준으로 기록)
**추정:** 낙관 30분 / 현실 1시간

---

### Phase 1: 데이터 레이어 (SQLite + Tauri Commands)
**목표:** SQLite 스키마 생성, Rust Tauri command로 CRUD 래퍼, 프론트엔드에서 invoke 가능

**영향 파일:**
- `src-tauri/Cargo.toml` (rusqlite + rusqlite_migration 의존성 추가)
- `src-tauri/src/db.rs` (신규 — DB 초기화, 마이그레이션 러너, CRUD)
- `src-tauri/src/commands.rs` (신규 — Tauri command 정의)
- `src-tauri/src/models.rs` (신규 — TradingDay struct + serde)
- `src-tauri/src/lib.rs` (모듈 등록, command 핸들러 등록)
- `src-tauri/migrations/0001_initial.sql` (신규 — v1 스키마)
- `src/lib/api.ts` (신규 — Tauri invoke 래퍼)
- `src/types/trading-day.ts` (신규 — TypeScript 타입)

**작업:**
1. `rusqlite` (bundled feature) + `rusqlite_migration` crate 추가 — SQLite를 바이너리에 포함, 시스템 의존성 0, 스키마 진화 자동화
2. `migrations/0001_initial.sql` 작성:
   ```sql
   -- trade_date: KST 기준 ISO date (YYYY-MM-DD). UTC가 아님.
   -- created_at/updated_at: UTC ISO 8601 timestamp.
   -- v2에서 trade 테이블 추가 시 trade_date를 FK로 참조.
   CREATE TABLE IF NOT EXISTS trading_day (
     trade_date     TEXT PRIMARY KEY,    -- KST date (YYYY-MM-DD)
     deposit        REAL DEFAULT 0,
     withdrawal     REAL DEFAULT 0,
     end_balance    REAL,
     note           TEXT DEFAULT '',
     created_at     TEXT NOT NULL DEFAULT (datetime('now')),
     updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
   );
   CREATE INDEX IF NOT EXISTS idx_trading_day_date ON trading_day(trade_date);
   ```
   마이그레이션 파일 네이밍 컨벤션: `0001_initial.sql`, `0002_v1_5_sync.sql`, `0003_v2_trades.sql` 등 순차 번호. v1.5/v2 스키마 진화 시 새 파일 추가만으로 자동 업그레이드.
3. `db.rs` 마이그레이션 러너 구현:
   - `rusqlite_migration::Migrations::new(vec![...])` 로 마이그레이션 목록 등록
   - 앱 시작 시 `~/Library/Application Support/tradelog/db.sqlite` 경로에 DB 생성
   - `migrations.to_latest(&mut conn)` 호출 — 자동으로 pending 마이그레이션 실행
   - 내부적으로 `PRAGMA user_version` 기반으로 현재 스키마 버전 추적
   - v1.5/v2에서 새 마이그레이션 파일 추가 시 기존 사용자 DB 자동 업그레이드 보장
4. `commands.rs`: Tauri commands 정의
   - `get_all_trading_days() -> Vec<TradingDay>` (trade_date ASC 정렬)
   - `upsert_trading_day(day: TradingDay)` (INSERT OR REPLACE)
   - `upsert_trading_days(days: Vec<TradingDay>)` (batch — paste용)
   - `delete_trading_day(trade_date: String)`
   - `get_trading_days_range(from: String, to: String) -> Vec<TradingDay>`
5. `models.rs`: `TradingDay` struct (Serialize/Deserialize) — `trade_date, deposit, withdrawal, end_balance, note, created_at, updated_at`
6. `api.ts`: `invoke` 래퍼 함수 (타입 안전)
7. `types/trading-day.ts`: 프론트엔드 타입 + 계산 필드 타입 (`ComputedTradingDay` — start_balance, daily_pnl, daily_return_pct, cumulative_pnl, cumulative_return_pct 포함)

**의존성:** Phase 0 완료
**검증:**
- Acceptance Criteria: "데이터 .sqlite 파일을 사용자가 직접 백업 가능한 경로에 저장 (`Application Support/tradelog/`)" 충족
- `pnpm tauri dev` 실행 후 devtools 콘솔에서 `invoke('get_all_trading_days')` 호출 -> 빈 배열 반환
- upsert 1건 -> get_all -> 1건 반환 확인
- batch upsert 30건 -> 정상 저장 확인
- DB 파일이 `~/Library/Application Support/tradelog/db.sqlite`에 생성 확인
- 마이그레이션 러너 검증: DB 삭제 후 재시작 -> 스키마 자동 생성. `PRAGMA user_version` 값 = 1 확인
- **[Measurement Gate]** `pnpm tauri build` -> 번들 사이즈 측정 + Phase 0 대비 delta 기록. 목표: < 11MB (rusqlite bundled ~1MB 추가)
**추정:** 낙관 2시간 / 현실 4시간

---

### Phase 2: 계산 레이어 (Computed Fields)
**목표:** raw 데이터로부터 start_balance, daily_pnl, daily_return_pct, cumulative_pnl, cumulative_return_pct 자동 계산

**영향 파일:**
- `src/lib/compute.ts` (신규 — 순수 함수, 계산 로직)
- `src/lib/compute.test.ts` (신규 — 단위 테스트)
- `src/types/trading-day.ts` (계산 필드 타입 보완)

**작업:**
1. `computeTradingDays(days: TradingDay[]): ComputedTradingDay[]` 순수 함수 구현
   - `days`는 trade_date ASC 정렬 전제
   - `start_balance(t)` = `end_balance(t-1) + deposit(t) - withdrawal(t-1)` (첫 row는 deposit이 start_balance)
   - `daily_pnl(t)` = `end_balance(t) - start_balance(t)`
   - `daily_return_pct(t)` = `daily_pnl(t) / start_balance(t)` (start_balance가 0이면 0)
   - `cumulative_pnl(t)` = `SUM(daily_pnl from first to t)`
   - `cumulative_return_pct(t)` = `cumulative_pnl(t) / (initial_capital + SUM(deposits up to t))`
   - `initial_capital` = 첫 번째 non-null end_balance row의 start_balance (또는 첫 deposit)
2. **KST cutoff 처리**: trade_date는 ISO date (YYYY-MM-DD) in KST. 계산은 날짜 순 정렬만 의존하므로 timezone 로직 불필요 (저장 시 KST date로 저장됨)
3. **end_balance가 null인 row 처리**: 미입력일은 계산 체인에서 스킵 (이전 row의 end_balance를 다음 row의 start_balance 계산에 사용)
4. 단위 테스트: spec의 엑셀 수식과 동일한 결과 나오는지 검증
   - 빈 데이터 -> 빈 배열
   - 1건 (첫 deposit + end_balance) -> start_balance = deposit, daily_pnl 계산 확인
   - 3건 연속 -> cumulative 값 체인 확인
   - 중간에 null end_balance -> 스킵 후 연속 계산 확인
   - deposit/withdrawal이 있는 케이스 -> start_balance 계산 확인

**의존성:** Phase 1의 타입 정의
**검증:**
- Acceptance Criteria: "paste된 데이터의 시작금액/일일수익/일별수익률/누적수익률은 자동 계산" 충족
- Acceptance Criteria: "누적 수익률 계산: SUM(daily_pnl from very first day to current day) / (initial_capital + SUM(deposits))" 충족
- 테스트 100% pass
**추정:** 낙관 1.5시간 / 현실 3시간

---

### Phase 3.0: RDG Paste PoC Spike (spike gate)
**목표:** react-data-grid의 외부 클립보드 TSV paste가 multi-row 시나리오에서 동작하는지 30분 내 검증

**작업:**
1. 빈 React + RDG 환경에서 최소 grid (5 컬럼, 빈 30 row) 구성
2. 엑셀에서 30 row (B-J 컬럼) 복사 -> 앱의 grid 영역에 Cmd+V
3. `onPaste` 이벤트에서 `event.clipboardData.getData('text/plain')` 수신 확인
4. TSV 텍스트를 `\n` + `\t` 분리 -> multi-row 배열로 파싱 -> grid rows에 반영
5. 키보드 nav (Tab/Enter/Arrow) 동작 확인, 셀 단위 selection이 엑셀과 호환되는지 확인

**성공 기준 (30분 내):**
- 엑셀 30-row TSV가 `onPaste`로 수신되고, row 분리가 정상적으로 동작
- 파싱된 데이터가 grid의 각 셀에 올바르게 반영됨
- Tab/Enter 키보드 nav로 셀 간 이동 동작

**Fail 조건:**
- TSV multi-row paste가 row 분리 안 됨 (single-cell만 지원)
- `onPaste` 이벤트가 RDG 내부에서 swallow되어 `clipboardData` 접근 불가
- cell-level paste만 지원하여 bulk insert 패턴과 호환 불가

**Fail 시 fallback 경로:**
- **(a) Custom HTML grid + 자체 paste handler:** TanStack Table v8 (headless) + react-aria `useTable` 기반. 키보드 nav/인라인 에디팅/paste handler 직접 구현. 추가 비용: +2-3일 (현실 +6-8시간). 번들: TanStack ~15KB + 커스텀 코드.
- **(b) glide-data-grid:** Canvas 기반 고성능 grid. 외부 paste handler 통합 용이. 번들 ~80KB. 추가 비용: +1일 (현실 +4시간). API 학습 필요.
- 양쪽 모두 ADR-002a를 작성하여 전환 이유와 새 trade-off 기록.

**의존성:** Phase 0 완료 (React 환경만 필요)
**추정:** 30분 (hard limit)

---

### Phase 3: Grid 입력 컴포넌트 + Paste Handler
**목표:** spreadsheet-like grid UI, 엑셀에서 TSV paste 시 자동 파싱 + 저장, 키보드 네비게이션
**전제:** Phase 3.0 spike 통과 (RDG 채택 확정) 또는 fallback 라이브러리 결정 완료

**영향 파일:**
- `package.json` (react-data-grid 추가 — spike 통과 시. fallback 시 해당 라이브러리)
- `src/components/TradingGrid.tsx` (신규 — 메인 grid 컴포넌트)
- `src/components/NoteEditor.tsx` (신규 — 비고 멀티라인 에디터)
- `src/lib/paste-parser.ts` (신규 — TSV 파싱 + 엑셀 컬럼 매핑)
- `src/lib/paste-parser.test.ts` (신규 — paste 파싱 테스트)
- `src/hooks/useTradingDays.ts` (신규 — Zustand 상태 관리)
- `src/App.tsx` (grid 컴포넌트 배치)

**작업:**
1. `pnpm add react-data-grid` 설치 (spike 통과 시)
2. `TradingGrid.tsx` 구현:
   - 컬럼 정의: 날짜(editable) / 입금(editable) / 시작금액(readonly, computed) / 최종금액(editable) / 일일수익(readonly) / 일별수익률(readonly, %) / 누적수익률(readonly, %) / 출금(editable) / 비고(editable, 멀티라인)
   - 사용자 입력 source: `trade_date`, `deposit`, `end_balance`, `withdrawal`, `note`
   - 나머지: Phase 2의 `computeTradingDays`로 자동 계산 후 표시
3. `paste-parser.ts` 구현:
   - `onPaste` 이벤트 핸들러 — `clipboardData.getData('text/plain')` 에서 TSV 파싱
   - 엑셀 컬럼 매핑: B(날짜) -> trade_date, C(입금) -> deposit, E(최종금액) -> end_balance, I(출금) -> withdrawal, J(비고) -> note
   - D(시작금액), F(일일수익), G(일별수익률), H(누적수익률) 컬럼은 paste 시 무시 (자동 계산)
   - 날짜 형식 변환: "1일", "2일" 등 -> ISO date (현재 선택된 월 기준)
   - 빈 row 스킵
4. `NoteEditor.tsx` — 비고 셀 클릭 시 멀티라인 텍스트 에디터 표시 (Notion-like inline)
5. `useTradingDays.ts` — Zustand로 로컬 상태 관리 + Tauri invoke로 직접 fetch/upsert (TanStack Query 불사용 — 단일 사용자 로컬 SQLite에서 캐시 무효화 이점 없음, ~30KB 번들 절약)
6. 키보드 네비게이션: react-data-grid 내장 (Tab/Enter 셀 이동, Arrow keys)
7. Cmd+Z undo: 로컬 상태에서 이전 상태 복원 (Zustand middleware 또는 커스텀 history stack)
8. Cmd+C/V: react-data-grid 내장 copy + 커스텀 paste handler

**의존성:** Phase 1 (API), Phase 2 (계산 로직)
**검증:**
- Acceptance Criteria: "입력 화면 = spreadsheet-like grid" 충족
- Acceptance Criteria: "엑셀에서 직접 row 복사 -> 앱 grid에 paste 시 TSV 자동 파싱" 충족
- Acceptance Criteria: "키보드 네비게이션: Tab/Enter 셀 이동, Cmd+C/V copy/paste, Cmd+Z undo" 충족
- Acceptance Criteria: "비고 셀은 멀티라인 텍스트 입력" 충족
- 수동 검증: 엑셀 `매매_일지_달러.xlsx`의 2026-04 시트에서 row 복사 -> 앱에 paste -> 데이터 정확히 파싱되는지 확인
- paste 검증 스크립트: B-J 전체 컬럼 복사 전제 (Row 3-32 드래그). TSV 컬럼 인덱스: [0]=날짜, [1]=입금, [2]=시작금액(무시), [3]=최종금액, [4]=일일수익(무시), [5]=일별수익률(무시), [6]=누적수익률(무시), [7]=출금, [8]=비고
- **[Measurement Gate]** `pnpm tauri build` -> 번들 사이즈 측정 + Phase 1 대비 delta 기록. 목표: < 12MB. **12MB 초과 시 경고** — 다음 phase 진행 전 번들 최적화 검토 (RDG tree-shake, 불필요 컴포넌트 제거)
**추정:** 낙관 4시간 / 현실 8시간

---

### Phase 4: Hero 컴포넌트 (잔액 + 자산곡선 + 목표선)
**목표:** 메인 화면 상단 hero에 현재 잔액, 자산곡선(area fill), 목표선($500K @ 2028-12) overlay, 누적 수익률 표시

**영향 파일:**
- `package.json` (recharts 추가)
- `src/components/HeroSection.tsx` (신규 — hero 전체)
- `src/components/BalanceDisplay.tsx` (신규 — 잔액 큰 숫자)
- `src/components/EquityCurve.tsx` (신규 — 자산곡선 차트)
- `src/components/CumulativeReturn.tsx` (신규 — 누적 수익률 표시)
- `src/App.tsx` (hero 배치)

**작업:**
1. `pnpm add recharts` 설치
2. `HeroSection.tsx`: hero 영역 레이아웃 (잔액 + 차트 + 수익률)
3. `BalanceDisplay.tsx`: 가장 최근 row의 `end_balance` 를 큰 숫자로 표시 (SF Pro Display semibold, USD 포맷)
4. `EquityCurve.tsx`:
   - Recharts `<AreaChart>` + `<Area>` (자산곡선 — end_balance 시계열)
   - `<ReferenceLine>` 점선 (목표선: $500,000 @ 2028-12-31)
   - 시작일부터 오늘까지 X축 (trade_date)
   - Y축: USD 금액
   - Apple HIG 톤: 시스템 컬러 (accentColor), subtle area fill, 얇은 stroke
5. `CumulativeReturn.tsx`: 시작일부터 연속 누적 수익률 % 표시
6. 빈 데이터 상태: placeholder 표시 ("데이터를 입력해주세요" + 빈 차트 프레임)

**의존성:** Phase 2 (계산 로직), Phase 3 (데이터 흐름)
**검증:**
- Acceptance Criteria: "현재 잔액 (가장 최근 row의 end_balance) — 큰 숫자 (SF Pro Display semibold)" 충족
- Acceptance Criteria: "시작일~오늘 자산곡선 (라인 차트, area fill)" 충족
- Acceptance Criteria: "목표선 ($500,000 @ 2028년 12월) 점선 overlay" 충족
- Acceptance Criteria: "누적 수익률 % (시작일부터 끊김 없이 연속)" 충족
- Acceptance Criteria: "첫 실행 시 빈 메인 화면(자산곡선 placeholder + 잔액 $0 + grid 빈 상태) 표시" 충족
- **[Measurement Gate]** `pnpm tauri build` -> 번들 사이즈 측정 (Recharts 추가 후). 목표: <= 14MB. **14MB 초과 시** Recharts -> uPlot (~10KB) 또는 SVG 직접 작성(~5KB)으로 교체 검토
**추정:** 낙관 2시간 / 현실 4시간

---

### Phase 5: Apple HIG 디자인 시스템
**목표:** SF Pro, 시스템 컬러, vibrancy, 라이트/다크 자동 전환, shadcn/ui 기반 디자인 토큰

**영향 파일:**
- `package.json` (shadcn/ui 관련 패키지, tailwindcss, @radix-ui/*)
- `tailwind.config.ts` (Apple HIG 디자인 토큰)
- `src/styles/globals.css` (시스템 폰트, CSS 변수, 다크모드)
- `src/styles/tokens.css` (신규 — Apple HIG 컬러 토큰)
- `src/components/ui/*` (shadcn/ui primitives)
- `src-tauri/tauri.conf.json` (windowEffects vibrancy 설정)
- `src/components/Sidebar.tsx` (신규 — vibrancy 사이드바)
- 기존 모든 컴포넌트 파일 (스타일 적용)

**작업:**
1. Tailwind CSS + shadcn/ui 초기화 (`pnpm dlx shadcn@latest init`)
2. `globals.css`: SF Pro 시스템 폰트 스택 설정 (`-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui`)
3. `tokens.css`: macOS 시스템 다이나믹 컬러 매핑 — `@media (prefers-color-scheme: dark)` 분기
4. `tailwind.config.ts`: Apple HIG 컬러 팔레트 확장 (시스템 블루, 시스템 그린, 시스템 레드 등)
5. 라이트/다크 모드: `prefers-color-scheme` media query 자동 전환 (수동 토글 없음 — 시스템 prefs 따름)
6. macOS vibrancy: `tauri.conf.json`의 `windowEffects: ["sidebar"]` 설정 사용. **`tauri-plugin-decorum` 사용하지 않음** — decorum은 타이틀바/traffic light 커스터마이징을 포함하여 Apple HIG 표준 윈도우 크롬과 충돌. 표준 타이틀바/traffic light 위치 유지.
7. `Sidebar.tsx`: vibrancy 효과 적용된 사이드바 (월별 네비게이션 — UI 그룹핑 라벨 용도)
8. 기존 컴포넌트들 (TradingGrid, HeroSection 등)에 디자인 토큰 적용
9. 정보 밀도: hero 외에는 낮은 밀도 유지 (패딩, 여백 여유롭게)

**의존성:** Phase 3, Phase 4 (컴포넌트 존재)
**검증:**
- Acceptance Criteria: "라이트/다크 모드 자동 전환 (시스템 prefs 따름)" 충족
- Acceptance Criteria: "macOS vibrancy 사이드바 적용" 충족
- 수동 검증: 시스템 설정에서 다크모드 <-> 라이트모드 전환 시 앱이 자동 반영
- 수동 검증: 사이드바에 vibrancy 효과 적용 확인
- 폰트가 SF Pro로 렌더링되는지 devtools에서 확인
- **[Measurement Gate — Final Pre-Release]** 이 phase가 프론트엔드 마지막 의존성 추가 시점:
  - 번들 사이즈: `pnpm tauri build && du -sh src-tauri/target/release/bundle/macos/tradelog.app` -> **<= 15MB 필수**
  - 콜드스타트: `time open -W /path/to/tradelog.app` (최초 실행) + `hyperfine --warmup 3 'open -gj /path/to/tradelog.app'` (반복 측정) -> **<= 1.5초**
  - RSS 메모리: 앱 실행 후 `top -pid $(pgrep tradelog) -l 5 | grep RSS` 또는 Activity Monitor -> **<= 200MB**
  - **임계 초과 시 fallback:** (a) shadcn/ui에서 사용하는 4-5개 컴포넌트(Button, Input, Dialog, Tooltip, Sidebar)만 copy하여 Radix 전체 import 제거, (b) Recharts -> uPlot 마이그레이션, (c) 불필요한 Tailwind 유틸리티 purge 확인
**추정:** 낙관 3시간 / 현실 6시간

---

### Phase 6: Auto-Update 통합
**목표:** tauri-plugin-updater + GitHub Releases 기반 자동업데이트

**영향 파일:**
- `src-tauri/Cargo.toml` (tauri-plugin-updater 추가)
- `src-tauri/tauri.conf.json` (updater 설정 — endpoint, pubkey)
- `src-tauri/src/lib.rs` (updater plugin 등록)
- `src/components/UpdateNotification.tsx` (신규 — 업데이트 알림 UI)
- `.github/workflows/release.yml` (신규 — GitHub Actions 빌드+릴리즈)
- `src-tauri/tauri.conf.json` (버전 관리)

**작업:**
1. `tauri-plugin-updater` 의존성 추가 + Tauri plugin 등록
2. **GitHub repo + signing key 정책 결정 (사용자 확인 후 Phase 7에서 최종 잠금):**
   - **권장: public GitHub repo** — 자동업데이트 endpoint (`https://github.com/{owner}/{repo}/releases/latest/download/latest.json`)가 인증 없이 접근 가능해야 함. private repo 시 토큰 기반 pre-signed asset URL 필요 (복잡도 증가).
   - Tauri signing key 생성: `tauri signer generate -w ~/.tauri/tradelog.key`
   - **pubkey:** `tauri.conf.json`의 updater 설정에 embed
   - **privkey:** GitHub Actions secrets (`TAURI_SIGNING_PRIVATE_KEY`) + 사용자 로컬 백업 (`~/.tauri/tradelog.key`)
   - 사용자가 private repo를 선호할 경우: Phase 7에서 pre-signed URL 방식으로 전환 (추가 비용 +2시간)
3. `tauri.conf.json`에 updater 설정:
   - endpoint: GitHub Releases latest API
   - pubkey: 위에서 생성한 공개키
4. `UpdateNotification.tsx`: 앱 시작 시 업데이트 확인 -> 새 버전 있으면 다이얼로그 -> 동의 시 다운로드+설치+재시작
5. `.github/workflows/release.yml`: tag push 시 자동 빌드 (macOS **universal binary — arm64 + x86_64**) -> GitHub Release 생성 -> 서명된 .app 업로드
6. GitHub repo 생성

**의존성:** Phase 0-5 (앱이 동작해야 의미 있음)
**검증:**
- Acceptance Criteria: "GitHub Releases에 새 버전 업로드 시 앱이 자동 감지 -> 사용자 동의 후 자동 업데이트 -> 재시작" 충족
- 수동 검증: v0.1.0 빌드 -> v0.1.1 릴리즈 -> 앱에서 업데이트 감지 확인
- 참고: Apple Developer 코드사이닝 없이도 ad-hoc 서명으로 개발 단계 검증 가능. 정식 notarization은 Phase 7.
- **[Measurement Gate]** 번들 사이즈 재측정 (updater plugin 추가 후). Phase 5 대비 유의미한 delta 없어야 함.
**추정:** 낙관 2시간 / 현실 4시간

---

### Phase 7: 빌드/패키징 + 코드사이닝 (사용자 Apple Dev 계정 필요)
**목표:** 정식 코드사이닝 + notarization, 최종 번들 사이즈 검증

**영향 파일:**
- `src-tauri/tauri.conf.json` (signing identity)
- `.github/workflows/release.yml` (signing secrets)
- `Makefile` 또는 `justfile` (빌드 스크립트)

**작업:**
1. Apple Developer 계정 가입 ($99/yr) — **사용자 직접 수행**
2. Developer ID Application 인증서 생성
3. `tauri.conf.json`에 signing identity 설정
4. GitHub Actions secrets에 인증서 + Apple ID + App-specific password 추가
5. notarization 통과 확인 (`xcrun notarytool`)
6. GitHub repo public/private 최종 결정 잠금 (Phase 6에서 권장한 방식 확정)
7. Universal binary (arm64 + x86_64) 빌드 확인 — spec "Apple Silicon + Intel" 지원
8. 최종 성능 측정 (Phase 5 measurement gate와 동일 명령):
   - 번들: `du -sh src-tauri/target/release/bundle/macos/tradelog.app` -> **<= 15MB**
   - 콜드스타트: `hyperfine --warmup 3 'open -gj /path/to/tradelog.app'` -> **<= 1.5초**
   - RSS: `top -pid $(pgrep tradelog) -l 5 | grep RSS` -> **<= 200MB**

**의존성:** Phase 6, Apple Developer 계정 (사용자 action item)
**검증:**
- Acceptance Criteria: "Tauri Mac 앱이 빌드되고 .app 번들이 <= 15MB" 충족
- Acceptance Criteria: "Apple Developer 계정으로 코드사이닝 + notarization 통과" 충족
- Acceptance Criteria: "첫 launch부터 종료까지 RSS 메모리 <= 200MB" 충족
- Acceptance Criteria: "콜드 스타트 <= 1.5초" 충족
- Universal binary: arm64 + x86_64 모두 포함 확인 (`lipo -info tradelog`)
**추정:** 낙관 2시간 / 현실 4시간 (Apple 계정 설정 시간 제외)

---

### Phase 8: 사용자 마이그레이션 (수동 — 사용자 직접 수행)
**목표:** 기존 엑셀 2026-04, 2026-05 데이터를 앱으로 이전

**작업 (사용자 가이드):**
1. 엑셀에서 2026-04 시트 열기 -> Row 3-32 (데이터 영역) 선택 -> Cmd+C
2. 앱 grid에서 Cmd+V -> TSV 자동 파싱 -> 데이터 표시 확인
3. 2026-05 시트 동일 반복
4. 자산곡선이 시작일부터 연속 표시되는지 확인
5. 누적 수익률이 월별 리셋 없이 연속인지 확인

**의존성:** Phase 3 (grid + paste handler 완성)
**검증:**
- Acceptance Criteria: "사용자가 엑셀의 2026-04, 2026-05 시트 데이터를 grid paste로 마이그레이션 가능 (<= 5분 작업)" 충족

---

## 3. Open Questions Resolution

### 결정 완료 (추천 + 근거)

| # | 질문 | 결정 | 근거 |
|---|------|------|------|
| 1 | 프론트엔드 React vs Svelte | **React 18** | grid/chart 라이브러리 생태계 우위, shadcn/ui 직접 사용, LINE Corp TS/React 익숙도. Svelte는 grid 생태계 부재가 치명적 |
| 2 | Grid 라이브러리 | **react-data-grid (RDG)** (Phase 3.0 spike 조건부) | 셀 에디팅 + 키보드 nav + 가상화 내장, onPaste 이벤트 서피스로 커스텀 TSV paste handler 구축. MIT, ~40-60KB. AG Grid Community는 paste가 Enterprise 전용(유료). Spike 실패 시 TanStack Table 또는 glide-data-grid fallback. |
| 3 | Chart 라이브러리 | **Recharts (v1)** | 자산곡선 1개에 적합, AreaChart+ReferenceLine으로 빠른 구현, Apple HIG 톤은 색상/stroke 커스텀으로 충분. v1.5/v2에서 Visx 재평가 |

### v1 출시 직전 단계로 보류

| # | 질문 | Schedule | 비고 |
|---|------|----------|------|
| 4 | App 아이콘/로고 | Phase 7 직전 | 임시 아이콘으로 개발, 출시 전 디자인 |
| 5 | Apple Developer 계정 가입 시점 | Phase 7 시작 시 | $99/yr, 사용자 직접 가입 |
| 6 | 첫 실행 onboarding 화면 | Phase 5 이후 | 3-step intro 또는 skip-able. v1 최소 요구사항은 아님 — hero placeholder + 빈 grid로 충분 |
| 7 | 데이터 백업/복원 UX | Phase 7 | v1은 SQLite 파일 경로 안내 + Finder에서 직접 복사로 충분. Export 버튼은 v1.5 후보 |

---

## 4. ADR (Architecture Decision Record)

### ADR-001: 프론트엔드 프레임워크 — React 18

**Decision:** React 18 + TypeScript 채택

**Drivers:**
- Spec Constraint: "TypeScript/React 또는 Svelte 프론트엔드"
- Decision Driver #1: Bundle size (React ~140KB는 15MB 제약 내 무시 가능)
- Decision Driver #2: Grid lib 생태계 (paste handler 내장 grid 필수)
- Decision Driver #3: 사용자 익숙도 (LINE Corp TS/React)

**Alternatives Considered:**
- Svelte 5: 번들 ~1.6KB로 극소이나, spreadsheet-like grid 라이브러리가 React 생태계 대비 미성숙. paste handler 직접 구현 필요 -> v1 출시 지연 리스크.

**Why Chosen:** grid + chart + component lib 생태계가 v1 요구사항(paste 마이그레이션, 자산곡선, Apple HIG 디자인 토큰)과 직결. 번들 차이 ~138KB는 전체 15MB 앱 번들의 1% 미만.

**Consequences:**
- Positive: shadcn/ui 직접 사용, react-data-grid/Recharts 즉시 통합, 개발 속도 빠름
- Negative: Svelte 대비 약간 큰 JS 번들, VDOM 오버헤드 (200MB RSS 제약 내)

**Follow-ups:** v1.5에서 PWA 빌드 시에도 React 유지. v2에서 복잡한 시각화 추가 시 React 생태계 이점 극대화.

---

### ADR-002: Grid 라이브러리 — react-data-grid (Phase 3.0 spike 조건부)

**Decision:** react-data-grid (MIT) 채택 — Phase 3.0 spike 통과 시 확정. Spike 실패 시 ADR-002a로 대체.

**Drivers:**
- Decision Driver #2: 마이그레이션 UX — TSV clipboard paste 필수
- Spec Constraint: "엑셀에서 직접 row 복사 -> 앱 grid에 paste 시 TSV 자동 파싱"
- Bundle size: ~40-60KB

**Paste 동작 정확한 설명:** RDG는 셀 간 copy/paste와 키보드 네비게이션, 인라인 에디팅, 가상화를 내장 제공한다. 그러나 **외부 앱(엑셀)에서 multi-row TSV를 paste하여 grid 전체에 채우는 기능은 내장되어 있지 않다.** RDG의 `onPaste` 이벤트 서피스를 통해 커스텀 paste handler(`paste-parser.ts`)를 구현해야 한다. RDG의 장점은 row model + 에디팅 인프라 위에 paste handler를 구축하면 headless 대비 통합 비용이 낮다는 점.

**Spike Gate (Phase 3.0):**
- 30분 PoC: 빈 RDG grid + 엑셀 30-row TSV -> onPaste -> grid 채움
- 성공 시: RDG 확정, Phase 3 진행
- 실패 시: ADR-002a 작성 -> fallback 라이브러리 전환

**Alternatives Considered:**
1. AG Grid Community: paste가 Enterprise 전용 (유료 라이선스 필요). Community에서는 paste 이벤트를 직접 처리해야 하므로 RDG 대비 이점 없고 번들 6-8배 무거움 (~300-400KB)
2. Custom (TanStack Table v8 + react-aria `useTable` + 커스텀 paste handler): headless라 paste/키보드nav/인라인에디팅 전부 직접 구현 필요. 2-3일 추가. **RDG spike 실패 시 1순위 fallback** — 가장 유연하고 번들 가벼움 (~15KB + 커스텀)
3. glide-data-grid: Canvas 기반 고성능 grid, 외부 paste handler 통합 용이. 번들 ~80KB. **RDG spike 실패 시 2순위 fallback** — API 학습 비용 있으나 성능 우수
4. react-spreadsheet: 외부 앱(엑셀)에서 paste가 동작하지 않는 known issue (#51). 사용 불가.
5. Handsontable: 상업 라이선스 ($899+/dev/yr). Non-commercial만 무료. 불채택.

**Why Chosen:** 셀 에디팅 + 키보드 nav + 가상화 내장으로, 커스텀 paste handler만 추가하면 되는 통합 비용 최소 경로. MIT. ~40-60KB 경량. 단, spike 검증 전까지는 가설.

**Consequences:**
- Positive: 에디팅/nav/가상화 인프라 무료, 커스텀 paste handler만 구현, 가벼운 번들
- Negative: AG Grid Enterprise 대비 고급 기능 부재. 외부 multi-row paste가 미검증 (spike로 해소).

**Follow-ups:** v2에서 거래별 입력 + 복잡한 grid 요구 시 TanStack Table 기반 커스텀 또는 AG Grid Enterprise 재평가.

---

### ADR-003: Chart 라이브러리 — Recharts

**Decision:** Recharts 채택 (v1)

**Drivers:**
- Decision Driver #3: Apple HIG 톤 — 색상/stroke 커스텀 충분
- v1 차트 = 자산곡선 1개 (area fill + 목표선 점선)
- 개발 속도 우선

**Alternatives Considered:**
- Visx (@visx/xychart): low-level SVG primitives로 완전 커스텀 가능. 그러나 차트 1개에 D3 수준 API는 과잉. @visx/xychart ~390KB로 Recharts 대비 2배 무거움 (단, 개별 모듈 import 시 ~50-80KB).

**Why Chosen:** `<AreaChart>` + `<Area>` + `<ReferenceLine>` 3개 컴포넌트로 hero 차트 완성 가능. Apple HIG 톤은 색상(시스템 블루 계열), stroke width, font 설정으로 충분히 달성.

**Consequences:**
- Positive: 30분 내 hero 차트 구현, 안정적 API, 풍부한 예제
- Negative: 깊은 커스텀 제한 (SVG 직접 제어 불가)

**Follow-ups:** v1.5/v2에서 코인별/전략별 통계 시각화 추가 시 Visx로 전환 재평가.

---

### ADR-004: Rust SQLite 라이브러리 — rusqlite (bundled)

**Decision:** rusqlite (bundled feature) 채택

**Drivers:**
- Spec: "Local SQLite", macOS only
- 시스템 의존성 0 (bundled SQLite)
- 동기식 API로 Tauri command 구현 단순

**Alternatives Considered:**
- sqlx (async): 비동기 API로 더 유연하지만, 단일 사용자 로컬 앱에서 async SQLite는 과잉. 시스템 SQLite 의존성 발생 가능.
- tauri-plugin-sql (공식): sqlx 기반, JS에서 직접 SQL 실행. 그러나 Rust 단에서 비즈니스 로직(마이그레이션, 유효성 검증) 처리가 어려움.

**Why Chosen:** `bundled` feature로 SQLite를 바이너리에 포함 -> 시스템 의존성 0. 동기 API로 Tauri command 구현 직관적. SQLite only이므로 multi-DB 지원 불필요.

**Consequences:**
- Positive: 시스템 의존성 없음, 단순한 API, 바이너리 크기 ~1MB 추가
- Negative: async 지원 없음 (단일 사용자 앱에서 문제 없음)

**Follow-ups:** v1.5에서 Cloudflare D1 동기화 추가 시 Rust 단 HTTP 클라이언트 별도 추가. rusqlite는 로컬 캐시로 계속 사용.

**v2 스키마 진화 경로 (ADR-004 보강):**
- v1: `trading_day` 테이블만 존재. `trade_date TEXT PRIMARY KEY`로 일별 1 row.
- v2: `trade` 테이블 추가 (`trade_date TEXT FK -> trading_day.trade_date`). 한 날짜에 N개 거래. `trading_day`는 **daily snapshot/summary**로 유지 — `end_balance`는 해당일 최종 잔액, `note`는 일별 총평. 거래별 `pnl`의 합이 `daily_pnl`과 일치하는지 앱 레이어에서 검증.
- 마이그레이션 경로: `0003_v2_trades.sql`에서 `CREATE TABLE trade (...)` 추가. 기존 `trading_day` 데이터는 그대로 유지 (파괴적 변경 없음). v2 앱에서 기존 `note` 필드의 거래 정보를 파싱하여 `trade` row로 선택적 마이그레이션 (사용자 opt-in).
- `rusqlite_migration` 러너가 `PRAGMA user_version` 기반으로 자동 적용.

---

### ADR-005: Timezone 저장 정책 — trade_date는 KST 날짜

**Decision:** `trade_date`는 KST 기준 calendar date (YYYY-MM-DD)로 저장. UTC timestamp가 아님.

**Drivers:**
- Spec: "거래일 cutoff: 00:00 Asia/Seoul (KST) — 저장은 UTC, 표시·그룹핑은 KST"
- Spec의 "저장은 UTC"는 timestamp 필드(`created_at`, `updated_at`)에 적용. `trade_date`는 point-in-time이 아니라 calendar date (날짜 개념)이므로 KST date가 의미적으로 정확.
- 24/7 암호화폐 거래에서 "거래일"은 KST 자정 기준으로 구분. UTC로 저장하면 KST 23:00 ~ 23:59 거래가 다음 날 UTC가 되어 PK 의미가 왜곡됨.

**Storage 규칙:**
- `trade_date` (TEXT PK): KST 기준 `YYYY-MM-DD`. 입력 시 `new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' })` 또는 동등한 Rust 로직으로 생성.
- `created_at` (TEXT): UTC ISO 8601 (`datetime('now')` — SQLite 기본값이 UTC).
- `updated_at` (TEXT): UTC ISO 8601.
- v1.5 클라우드 sync 시 서버는 `trade_date`를 KST calendar date로 인지. sync conflict 해소 시 `trade_date` + `updated_at(UTC)` 조합으로 last-write-wins 판정.

**Alternatives Considered:**
- trade_date를 UTC timestamp로 저장 + application layer에서 KST 변환: 가능하나 복잡도 증가. 일별 journal에서 "날짜"는 본질적으로 timezone-dependent calendar date이지 point-in-time이 아님. UTC 저장은 시간대 변환 오류 리스크만 증가.

**Why Chosen:** 의미적 정확성 (calendar date = KST). 구현 단순성 (변환 불필요). v1.5 sync 호환성 (서버가 KST date를 그대로 사용).

**Consequences:**
- Positive: 단순한 구현, 직관적 PK, timezone 변환 오류 제거
- Negative: 사용자가 해외에서 앱을 사용할 경우 KST 기준이 혼란 가능 (v1에서는 단일 사용자/한국 거주이므로 문제 없음)

**Follow-ups:** v1.5에서 다중 timezone 지원이 필요하면 `settings` 테이블에 `timezone` 필드 추가하여 cutoff 기준 변경 가능하게 확장.

---

### ADR-006: Auto-Update 인프라 — Public GitHub Repo + Signing Key 정책

**Decision:** v1은 public GitHub repo 사용. Tauri signing key는 privkey를 GitHub Actions secrets에, pubkey를 `tauri.conf.json`에 embed.

**Drivers:**
- Spec: "GitHub Releases 기반 자동업데이트", "stable 채널 1개"
- `tauri-plugin-updater`의 기본 endpoint가 public release asset URL 전제

**Storage 정책:**
- `TAURI_SIGNING_PRIVATE_KEY`: GitHub Actions secrets에 저장 + 사용자 로컬 백업 (`~/.tauri/tradelog.key`)
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`: GitHub Actions secrets에 저장
- pubkey: `tauri.conf.json` > `plugins` > `updater` > `pubkey`에 하드코딩 (public 정보)

**Alternatives Considered:**
- Private repo + pre-signed asset URL: 가능하나 토큰 관리 복잡도 증가, `latest.json` 자동 생성 로직 추가 필요. v1 단일 사용자 개인 프로젝트에서 private repo의 보안 이점이 낮음.

**Why Chosen:** 구현 단순성. 자동업데이트 endpoint가 인증 없이 바로 동작. 사용자가 private 선호 시 Phase 7에서 전환 가능 (추가 비용 +2시간).

**Consequences:**
- Positive: 설정 단순, tauri-plugin-updater 기본 동작 그대로 사용
- Negative: 소스코드 public 노출. 개인 매매일지 앱이므로 민감 데이터는 코드에 포함되지 않음.

**Follow-ups:** 사용자가 private repo로 전환 원할 경우 Phase 7에서 결정 잠금. v1.5에서 백엔드 배포 시 별도 인프라로 분리 가능.

---

## 5. Verification Plan

### Phase별 Manual Verification + Measurement Gates

| Phase | 검증 시점 | 기능 검증 | Measurement Gate |
|-------|----------|----------|-----------------|
| 0 | 부트스트랩 후 | `pnpm tauri dev` -> 빈 윈도우 표시 | `du -sh tradelog.app` -> baseline < 10MB 기록 |
| 1 | 데이터 레이어 후 | CRUD 정상, DB 파일 경로 확인, migration runner `user_version=1` | 번들 < 11MB (rusqlite +~1MB) |
| 2 | 계산 로직 후 | 단위 테스트 100% pass | (순수 TS, 번들 영향 미미) |
| 3.0 | **Spike gate** | RDG 30-row TSV paste 동작 확인 | Spike 실패 시 fallback 경로 발동 |
| 3 | Grid 후 | 엑셀 paste -> 정확 파싱, Tab/Enter 이동, Cmd+Z undo | 번들 < 12MB. **12MB 초과 시 경고 + 최적화** |
| 4 | Hero 후 | 잔액, 자산곡선, 목표선, 누적 수익률 표시 | 번들 <= 14MB. **초과 시 Recharts -> uPlot 검토** |
| 5 | 디자인 후 | 다크/라이트 전환, vibrancy 사이드바, SF Pro | **번들 <= 15MB, 콜드스타트 <= 1.5초, RSS <= 200MB** (최종 프론트엔드 gate) |
| 6 | Auto-update 후 | v0.1.0 -> v0.1.1 업데이트 감지 | 번들 delta 미미 확인 |
| 7 | 패키징 후 | notarization pass, universal binary | **최종 확인: 번들 <= 15MB, 콜드스타트 <= 1.5초, RSS <= 200MB** |

**측정 명령어:**
- 번들: `pnpm tauri build && du -sh src-tauri/target/release/bundle/macos/tradelog.app`
- 콜드스타트: `hyperfine --warmup 3 'open -gj /path/to/tradelog.app'` (또는 `time open -W tradelog.app`)
- RSS: `top -pid $(pgrep tradelog) -l 5 | grep RSS` (또는 Activity Monitor)
- Universal binary: `lipo -info src-tauri/target/release/bundle/macos/tradelog.app/Contents/MacOS/tradelog`

### v1 완성 후 Acceptance Criteria 전체 체크리스트

spec에서 직접 발췌:

- [ ] Tauri Mac 앱이 빌드되고 .app 번들이 <= 15MB
- [ ] 첫 실행 시 빈 메인 화면(자산곡선 placeholder + 잔액 $0 + grid 빈 상태) 표시
- [ ] 메인 화면 hero에 표시:
  - [ ] 현재 잔액 (가장 최근 row의 end_balance) — 큰 숫자 (SF Pro Display semibold)
  - [ ] 시작일~오늘 자산곡선 (라인 차트, area fill)
  - [ ] 목표선 ($500,000 @ 2028년 12월) 점선 overlay
  - [ ] 누적 수익률 % (시작일부터 끊김 없이 연속 — 월별 리셋 X)
- [ ] 입력 화면 = spreadsheet-like grid (컬럼: 날짜/입금/시작금액/최종금액/일일수익/일별수익률/누적수익률/출금/비고)
- [ ] 엑셀에서 직접 row 복사 -> 앱 grid에 paste 시 TSV 자동 파싱 -> 모든 row 자동 입력
- [ ] paste된 데이터의 시작금액/일일수익/일별수익률/누적수익률은 자동 계산
- [ ] 누적 수익률 계산: SUM(daily_pnl from very first day to current day) / (initial_capital + SUM(deposits))
- [ ] 키보드 네비게이션: Tab/Enter 셀 이동, Cmd+C/V copy/paste, Cmd+Z undo
- [ ] 비고 셀은 멀티라인 텍스트 입력 (Notion-like inline edit)
- [ ] 라이트/다크 모드 자동 전환 (시스템 prefs 따름)
- [ ] macOS vibrancy 사이드바 적용
- [ ] Apple Developer 계정으로 코드사이닝 + notarization 통과
- [ ] GitHub Releases에 새 버전 업로드 시 앱이 자동 감지 -> 사용자 동의 후 자동 업데이트 -> 재시작
- [ ] 사용자가 엑셀의 2026-04, 2026-05 시트 데이터를 grid paste로 마이그레이션 가능 (<= 5분 작업)
- [ ] 데이터 .sqlite 파일을 사용자가 직접 백업 가능한 경로에 저장 (Application Support/tradelog/)
- [ ] 첫 launch부터 종료까지 RSS 메모리 <= 200MB
- [ ] 콜드 스타트 <= 1.5초

### 사용자 Onboarding Flow 시나리오

1. 앱 첫 실행 -> 빈 화면 (hero placeholder + 빈 grid)
2. 엑셀 `매매_일지_달러.xlsx` 열기 -> `2026-04` 시트 선택
3. Row 3~32 (일별 데이터 영역) 드래그 선택 -> Cmd+C
4. 앱으로 전환 -> grid 영역 클릭 -> Cmd+V
5. TSV 자동 파싱 -> 날짜/입금/최종금액/출금/비고가 정확히 매핑됨
6. 시작금액/일일수익/일별수익률/누적수익률이 자동 계산됨
7. Hero에 자산곡선이 표시됨 (4월 데이터)
8. `2026-05` 시트 동일 반복
9. Hero 자산곡선이 4월~5월 연속 표시, 누적 수익률이 4월 1일부터 끊김 없이 연속
10. 마이그레이션 완료. 소요 시간 <= 5분

---

## 6. 전체 타임라인 요약

| Phase | 내용 | 낙관 | 현실 | 누적 (현실) |
|-------|------|------|------|-------------|
| 0 | 부트스트랩 | 30분 | 1시간 | 1시간 |
| 1 | 데이터 레이어 + migration runner | 2시간 | 4시간 | 5시간 |
| 2 | 계산 로직 | 1.5시간 | 3시간 | 8시간 |
| 3.0 | **RDG paste spike** | 30분 | 30분 | 8.5시간 |
| 3 | Grid + Paste (spike 통과 시) | 4시간 | 8시간 | 16.5시간 |
| 4 | Hero 차트 | 2시간 | 4시간 | 20.5시간 |
| 5 | 디자인 시스템 | 3시간 | 6시간 | 26.5시간 |
| 6 | Auto-update | 2시간 | 4시간 | 30.5시간 |
| 7 | 빌드/패키징 | 2시간 | 4시간 | 34.5시간 |
| **총합** | | **17.5시간** | **34.5시간** | |

**Spike 실패 시 추가 비용:** fallback (a) TanStack Table: +6-8시간 / fallback (b) glide-data-grid: +4시간. 최악 케이스 총합: ~42시간.

**Complexity: MEDIUM-HIGH** (Tauri Rust backend + React frontend + SQLite + 자동업데이트 파이프라인)

---

## 7. Guardrails

### Must Have
- v1.5/v2 호환 스키마 (`trading_day.trade_date` PK, v2 `trade` FK 가능)
- 엑셀 TSV paste로 100% 마이그레이션 가능
- 자산곡선 + 잔액 hero
- 시작일부터 연속 누적 수익률 (월별 리셋 X)
- macOS vibrancy + SF Pro + 시스템 컬러
- GitHub Releases 자동업데이트

### Must NOT Have
- iCloud Drive 파일 동기화
- Supabase / Firebase 등 BaaS
- xlsx 파서 라이브러리 (calamine/xlsx)
- Windows / Linux / Android / iPhone 지원
- 거래소 API 연동
- KRW 변환 / 다중 통화
- AI/LLM 분석
- 멀티 유저 / 공유
- Beta 자동업데이트 채널
