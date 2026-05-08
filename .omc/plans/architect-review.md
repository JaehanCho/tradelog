# Architect Review — ralplan-tradelog-v1

**Reviewer:** architect (general-purpose subagent)
**Date:** 2026-05-06
**Subject:** `.omc/plans/ralplan-tradelog-v1.md`
**Spec basis:** `.omc/specs/deep-interview-tradelog.md` (9R, ambiguity 5.9%)

---

## 0. Verdict

**APPROVE_WITH_CHANGES**

플랜의 큰 골격(Tauri v2 + React + rusqlite + react-data-grid + Recharts)은 spec의 5개 원칙과 non-goals를 거의 위반 없이 만족한다. 다만 **(a) clipboard paste 동작에 대한 미검증 가정**, **(b) Phase 5의 시점 문제**, **(c) DB 마이그레이션 인프라 누락**, **(d) Phase 6의 GitHub Releases pubkey/private repo 결정 미해결** 등 4건의 구체적 결함이 있다. 결함은 모두 task 단위 수정으로 해결 가능하므로 폐기가 아닌 revision.

---

## 1. Strongest Antithesis — react-data-grid 단일 베팅에 대한 강한 반대

플래너의 가장 핵심적이고 가장 반박 가능한 결정은 **ADR-002: react-data-grid 채택**이다. 이것은 Decision Driver #2(마이그레이션 UX)의 거의 전부를 한 라이브러리에 위임하는 결정이며, v1 일정의 16시간(Phase 3, 전체의 47%)이 이 라이브러리에 의존한다.

**반대 논거:**

1. **"TSV paste 내장"이라는 주장은 RDG의 기본 기능이 아니다.**
   react-data-grid(@adazzle/react-data-grid)는 셀 간 copy/paste(`onCopy`/`onPaste` props로 단일 셀 단위)는 지원하지만, **외부 클립보드(엑셀)에서 multi-row TSV를 자동 파싱해 grid 전체에 채우는 기능은 직접 구현해야 한다**. 플래너가 Phase 3 작업 3에서 `paste-parser.ts`를 별도로 만든다고 명시한 것 자체가 이를 입증한다. 즉 RDG도 결국 paste handler 직접 구현이 필요하므로, ADR-002의 "AG Grid Community 대비 paste 내장 우위"는 **사실관계가 약하다**.

2. **react-spreadsheet 배제 근거가 표면적이다.**
   ADR-002 alternatives에 "react-spreadsheet: 외부 앱(엑셀)에서 paste 미지원 (#51)"이라고 단정하나, react-spreadsheet는 활발히 메인테인되며 외부 paste는 prop과 핸들러로 구성 가능하다. RDG와 react-spreadsheet 모두 결국 커스텀 paste 핸들러를 요구한다면, **선택 기준은 "paste 내장 여부"가 아니라 "셀 에디터 모델, 가상화, 키보드 nav, 번들 사이즈"** 여야 한다.

3. **Custom (TanStack Table + 자체 paste) 비용 추정이 부풀려졌다.**
   "2-3일 추가" 추정은 paste handler + 키보드 nav + 인라인 에디팅 전부를 합한 것이지만, 본 플랜은 어차피 **(a) 한국어 "1일" 날짜 매핑, (b) 엑셀 컬럼 B/C/E/I/J만 골라 매핑하는 셀렉티브 paste, (c) 멀티라인 비고 셀**을 직접 구현한다. 즉 RDG를 써도 핵심 비즈니스 로직은 직접 짜야 하며, RDG가 절약해주는 것은 사실상 "키보드 nav + 단일 셀 에디팅 + 가상화" 정도다. TanStack Table v8 + react-aria의 `useGridList`/`useTable` 조합 또는 [glide-data-grid](https://github.com/glideapps/glide-data-grid)는 RDG보다 paste/에디팅 모델이 더 유연하며, glide는 캔버스 기반으로 가상화 성능이 RDG를 압도한다.

4. **production 검증 주장의 약점.**
   "Supabase가 자체 대시보드에서 사용 중"은 맞지만, Supabase Studio의 paste UX는 single-cell 위주다. v1의 핵심 시나리오(엑셀 30 row TSV → grid 일괄 채움)는 Supabase 사용 패턴과 다르므로 **transferable evidence가 약하다**.

**Counter to my own antithesis:** v1 일정 압박이 진짜 크고 RDG 학습 비용이 가장 낮다는 점은 인정한다. 그러나 적어도 **Phase 3 시작 전에 `paste-parser.ts` PoC를 30분 spike로 검증**해야 한다. spike 결과 RDG의 onPaste API가 multi-row clipboardData에 적합하지 않다고 판명되면, glide-data-grid 또는 TanStack Table headless로 즉시 전환할 수 있어야 한다. ADR-002에 spike gate가 없는 것이 가장 큰 결함이다.

---

## 2. Real Tradeoff Tensions

### Tension A: "Bundle ≤ 15MB / Cold start ≤ 1.5s" vs "shadcn/ui + Recharts + react-data-grid 풀 스택"

플래너는 React(~140KB) + RDG(~50KB) + Recharts(~180KB) + Tailwind CSS + Radix primitives + shadcn/ui 컴포넌트들을 모두 추가한다. **gzip 후 JS만 약 350-500KB** 추정이며 여기에 SF Pro 폰트 폴백, CSS 변수 시스템, vibrancy 플러그인이 더해진다. Tauri v2 baseline(macOS arm64 .app 약 7-9MB) + 위 JS 자산을 합쳐 **15MB 마진은 1-2MB밖에 남지 않는다**. 추후 Phase 6의 updater plugin, Phase 5의 tauri-plugin-decorum이 더해지면 빠듯하다.

진짜 충돌: 플래너가 ADR-001/002/003에서 "번들 차이는 무시 가능"이라고 반복하는데, 누적 효과는 무시 불가하다. **콜드스타트 1.5초**도 React 18 hydration + Recharts 초기 렌더 + RDG 초기 가상화를 합치면 M1 macOS에서 750-1200ms 영역이라 현실적 마진이 거의 없다.

이 텐션은 "shadcn/ui를 모두 가져오는 대신 사용하는 4-5개 컴포넌트(Button, Input, Dialog, Tooltip, Sidebar)만 카피해서 트리쉐이크"하는 방식, 또는 "Recharts 대신 SVG 직접 작성한 area chart(~5KB)"으로만 해소된다. 둘 다 **출시 속도와의 정면 충돌**이다.

### Tension B: "v1.5/v2 호환 스키마" vs "v1은 day 단위만"

`trading_day.trade_date TEXT PRIMARY KEY`는 v2에서 `trade.trade_date FK`로 사용된다고 명시되어 있다. 하지만 v2가 trade-level이 되면 한 날짜에 여러 거래가 생기고, 자산곡선/누적수익률 계산이 day-level aggregation 위에 올라간다. v1에서 trade_date를 PK로 쓰는 것은 v2에서 1:N 관계로 자연스럽게 확장되긴 하지만, v1 row의 `end_balance`, `note` 같은 컬럼은 v2에서 의미가 모호해진다 (어느 거래 시점의 잔액인가? 어느 거래의 비고인가?).

이 텐션은 v1 스키마를 단순히 유지하는 것만으로 해소되지 않는다. **v2 마이그레이션 경로(예: trading_day_summary view 또는 daily_snapshot 별도 테이블)를 ADR-004에 명시**해야 한다. 현 ADR-004는 rusqlite 선택만 다루고 v2 호환성은 없다.

---

## 3. Principle Violations

### V1 — "Spec Non-Goals 위반 가능성: tauri-plugin-decorum"

Phase 5에서 vibrancy 적용을 위해 `tauri-plugin-decorum` 또는 native window flags를 옵션으로 제시. tauri-plugin-decorum은 **window 데코레이션 전반(타이틀바 커스터마이즈, vibrancy, traffic light 위치)을 건드리며**, spec의 "Apple HIG 톤 준수"와 부분 충돌 가능. HIG는 표준 타이틀바/traffic light를 권장하며, decorum으로 커스터마이징하면 macOS 표준에서 벗어난다.

→ vibrancy만 필요하면 `window-vibrancy` crate를 직접 쓰거나 `tauri.conf.json`의 `windowEffects: ["sidebar", "headerView"]` 설정만으로 충분하다 (Tauri v2). decorum은 over-engineering.

### V2 — "Verification Gate 약함: Phase 0 baseline 측정 누락"

Principle #4(번들 ≤ 15MB), #5(콜드스타트 ≤ 1.5초)는 "must"인데 Phase 0 검증 항목이 "< 10MB" 한 줄 뿐이다. 의존성을 누적적으로 추가하는 Phase 1-6에서 **각 단계마다 번들/콜드스타트 측정이 없으면**, Phase 7에서 처음 측정했을 때 초과되어 있는 경우 어느 라이브러리가 원인인지 추적 불가. 매 phase 검증에 "번들 사이즈 delta 측정" 항목 추가 필요.

### V3 — "Migration 인프라 부재"

Phase 1에 `migrations/001_init.sql`만 있고, **마이그레이션 러너(rusqlite의 user_version pragma 기반 또는 refinery crate 사용)가 명시되지 않음**. v1.5/v2에서 schema가 진화할 때 사용자의 기존 DB를 자동 업그레이드할 수 없으면, "v1.5/v2 호환 스키마 유지"라는 Principle #2가 운용 단계에서 무너진다.

---

## 4. Concrete Change Requests

### CR-1 (Phase 3, ADR-002): RDG paste PoC spike gate 추가

**Where:** Phase 3 작업 1 직전에 "Phase 3.0: Paste PoC spike (30분)" 단계 삽입.
**What:** 빈 React + RDG 환경에서 엑셀 30 row 복사 → onPaste에서 `clipboardData.getData('text/plain')` 받아 multi-row TSV로 grid를 채우는 최소 동작 검증.
**Exit criteria:** 성공 시 RDG 진행, 실패 시 즉시 glide-data-grid 또는 TanStack Table headless + react-aria 그리드로 전환 (별도 ADR-002a 작성).
**Why:** ADR-002의 핵심 근거가 미검증이고, Phase 3에 16시간이 걸리는데 라이브러리 misfit을 후반에 발견하면 손실이 크다.

### CR-2 (ADR-004 보강): v2 호환 스키마 명시

**Where:** `src-tauri/migrations/001_init.sql` 코멘트 + ADR-004에 섹션 추가.
**What:** v2에서 도입될 `trade` 테이블 스케치(예: `trade_id`, `trade_date FK`, `coin`, `entry_price`, `exit_price`, `qty`, `strategy`)와 v1 `trading_day`가 어떻게 daily snapshot으로 살아남는지(view 또는 별도 테이블) 명시.
**Why:** Principle #2의 운영 가능성 보장. 미래 마이그레이션 코스트를 미리 줄임.

### CR-3 (Phase 1 보강): SQLite migration runner 도입

**Where:** Phase 1 작업 1, `src-tauri/Cargo.toml`.
**What:** `rusqlite_migration` crate 또는 `PRAGMA user_version` 기반 자체 러너를 명시. 마이그레이션 파일은 `001_init.sql`, `002_xxx.sql` 형태로 추가될 수 있도록 구조화.
**Why:** v1.5/v2에서 사용자 데이터 자동 업그레이드 보장. 누락 시 destructive migration 위험.

### CR-4 (Phase 5): vibrancy 구현 방식 명시

**Where:** ADR 추가 또는 Phase 5 작업 6 명확화.
**What:** `tauri-plugin-decorum` 대신 Tauri v2 `windowEffects: ["sidebar"]` 또는 `window-vibrancy` crate 단독 사용으로 결정. decorum의 traffic light/타이틀바 커스터마이징 기능은 사용 안 함을 명시.
**Why:** Apple HIG 권장 표준 타이틀바 유지. Principle #3(Apple HIG 준수) 충돌 회피.

### CR-5 (Phase 6): updater pubkey + endpoint 결정 명시

**Where:** Phase 6 작업 2.
**What:** GitHub Releases endpoint format(`{owner}/{repo}/releases/latest/download/latest.json`)에 의존하는데 **private repo면 pubkey 없이는 token-based 접근이 안 된다**. v1은 public repo로 가는지 private + pre-signed asset URL 사용인지 결정. 또한 `tauri signer generate`로 만든 pubkey/privkey 보관 정책(GitHub Actions secret + 사용자 로컬 백업)을 ADR로 명문화.
**Why:** Acceptance Criteria "GitHub Releases 자동업데이트"의 운영적 단일 점 실패 제거. Open Questions에 "GitHub repo public 필수 여부" 미해결로 남아있음.

### CR-6 (모든 Phase): 번들/콜드스타트 측정 게이트

**Where:** Phase 0-6 각 phase 검증 항목.
**What:** Phase별로 "이 phase 끝 시점의 .app 번들 사이즈, gzip JS 사이즈, 콜드스타트 측정값"을 기록. 누적치가 Phase 7 목표(15MB / 1.5s)의 80%를 넘으면 다음 phase 시작 전 경고.
**Why:** Principle #4, #5의 운영 보장. 회귀 추적 가능성.

---

## 5. Optional Improvements

- **OI-1:** `paste-parser.ts`의 한국어 날짜 매핑("1일" → ISO date)을 `chrono-node` 같은 ko 로케일 라이브러리 대신 정규식 + 현재 선택 월 기준으로 단순 처리 (의존성 절약). Open Questions의 우려를 해소.
- **OI-2:** Recharts의 미래 목표선($500K @ 2028-12)을 표시하기 위한 X축 domain 확장은 Recharts `<XAxis domain={['dataMin', '2028-12-31']}>`로 가능. Open Questions 항목 해결 가능.
- **OI-3:** `useTradingDays` 훅에서 TanStack Query + Zustand 동시 사용은 중복 가능성. v1 스코프(SQLite 로컬 + 30-100 row)에서는 **Zustand만으로 충분**. TanStack Query 제거 시 번들 ~30KB 절약.
- **OI-4:** Phase 2 계산 로직에 **decimal 정밀도 정책** 추가. `daily_pnl`, `cumulative_return_pct`를 JS Number로 계산하면 부동소수점 오차로 기존 엑셀 값과 미세 차이 발생 가능. SQLite REAL → JS Number 경로에서 USD cent 단위 정수 저장 또는 `decimal.js` 사용 검토 (단, 의존성 추가).
- **OI-5:** Phase 8(사용자 마이그레이션)에서 사용자가 잘못 paste한 경우 rollback UX 명시. v1은 Cmd+Z만으로 충분한지, 아니면 "최근 paste 취소" 별도 액션 필요한지 spec 확인.
- **OI-6:** macOS-only이지만 Tauri 빌드 시 universal binary(arm64 + x86_64) 명시 필요. M1/M2/M3는 arm64이지만 Intel Mac 사용자가 있다면 universal. spec에 명시 없음 → 사용자 확인 필요.

---

## 6. Summary Table

| # | 항목 | 심각도 | 액션 |
|---|------|--------|------|
| AT-1 | RDG paste 가정 미검증 | High | CR-1 spike gate |
| TT-A | Bundle/콜드스타트 누적 마진 | Medium | CR-6 측정 게이트 |
| TT-B | v1↔v2 스키마 호환 모호 | Medium | CR-2 ADR 보강 |
| V1 | tauri-plugin-decorum HIG 충돌 | Low-Med | CR-4 |
| V2 | Phase별 검증 게이트 부재 | Medium | CR-6 |
| V3 | Migration runner 누락 | Medium | CR-3 |
| OQ | GitHub repo public/pubkey | Medium | CR-5 |

전반적으로 플랜은 **실행 가능**하지만 **CR-1과 CR-3은 Phase 3 시작 전, CR-5는 Phase 6 시작 전**에 반드시 처리되어야 한다. 그 외는 plan 문서 보강 수준.

---

**Final verdict line:** APPROVE_WITH_CHANGES — RDG paste 검증 spike(CR-1), migration runner(CR-3), GitHub Releases pubkey 정책(CR-5)을 각 Phase 시작 전 처리하면 실행 가능.
