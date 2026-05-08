# Architect Re-Review (rev2) — ralplan-tradelog-v1

**Reviewer:** architect (general-purpose subagent)
**Date:** 2026-05-06
**Subject:** `.omc/plans/ralplan-tradelog-v1.md` (rev2, 730 lines), `.omc/plans/open-questions.md` (rev2)
**Prior review:** `.omc/plans/architect-review.md` (6 CRs, APPROVE_WITH_CHANGES)

---

## 0. Verdict

**APPROVE_RESOLVED** — 6개 CR + Critic 2개 critical 모두 plan 본문에 반영됨. 측정 명령어와 fail 조건이 actionable. Critic 단계로 넘어가도 무방.

단, 후속 단계에서 다음 두 가지를 가볍게 챙길 것을 권고한다(verdict에 영향 없음, optional):
- O-1: ADR-005의 KST date 생성 로직을 Rust 측에서도 명시(현재는 JS `toLocaleDateString` 예시만 있음)
- O-2: Phase 5 measurement gate 실패 시 fallback의 우선순위(shadcn 트리쉐이크 → Recharts 교체 → Tailwind purge)가 비용 순으로 정렬되어 있는지 재확인 (현 plan은 나열만 되어 있고 순서 권고 없음)

---

## 1. CR-by-CR Verification

### CR-1: RDG paste spike gate — RESOLVED ✅

**Where:** Phase 3.0 (lines 209-236), ADR-002 보강 (lines 489-518), Open Questions 라인 7.

**Check 1: Phase 3.0이 plan 본문에 실재하는가?**
Yes. Phase 3 직전에 독립 phase로 박혔고, "spike gate"라는 명시적 라벨이 붙음 (line 209).

**Check 2: Fail 조건이 measurable한가?**
Yes (lines 224-227). 3개 fail 조건 모두 객관적으로 판정 가능:
- "TSV multi-row paste가 row 분리 안 됨 (single-cell만 지원)" — 30 row paste → 1 cell만 채워지면 fail
- "`onPaste` 이벤트가 RDG 내부에서 swallow되어 `clipboardData` 접근 불가" — console.log로 즉시 확인
- "cell-level paste만 지원하여 bulk insert 패턴과 호환 불가" — 실제 grid row 채워지는지 시각 확인

성공 기준 3개도 30분 내 실행 가능한 검증 (lines 219-222). 시간 한계가 "30분 hard limit"으로 명시됨 (line 235).

**Check 3: Fallback 경로 두 개의 비용 산정이 합리적인가?**
Yes (lines 228-232).
- (a) TanStack Table v8 + react-aria: +2-3일 (현실 +6-8시간) — 합리적. headless에서 키보드 nav, 가상화, 인라인 에디팅, paste handler 4개 모두 직접 짜야 하므로 6-8시간은 오히려 낙관적. 다만 v1 절대 일정 부담 안에서 수용 가능.
- (b) glide-data-grid: +1일 (+4시간) — 합리적. Canvas 기반 API 학습 비용을 4시간으로 본 것은 빠듯하나, 외부 paste handler 통합이 단순한 라이브러리이므로 가능.
- 최악 케이스 총 시간이 line 705 ("~42시간")에 명시되어 있어 일정 risk가 timeline에 반영됨.

**Verdict for CR-1:** sufficient. Spike 자체가 phase로 박혔고 fallback 경로가 trade-off까지 명시됨.

---

### CR-2: v2 스키마 호환 ADR 보강 — RESOLVED ✅

**Where:** ADR-004 보강 섹션 (lines 565-569), Phase 1 SQL 코멘트 (lines 130-132), 마이그레이션 파일 네이밍 컨벤션 (line 144).

**Check: trade_date FK 패턴이 명시되었나?**
Yes. Lines 565-569에서 명시적으로:
- v2: `trade` 테이블 추가, `trade_date TEXT FK -> trading_day.trade_date`
- `trading_day`는 daily snapshot/summary로 유지됨을 명시
- daily_pnl과 거래별 pnl 합 일치 검증 책임이 앱 레이어에 있음을 명시
- 마이그레이션 경로(`0003_v2_trades.sql`)와 비파괴적 진화 보장
- 기존 note의 거래 정보 opt-in 마이그레이션 정책

이전 review에서 지적했던 "v2 마이그레이션 경로 모호"가 구체적 SQL 파일 명명까지 포함하여 해소됨.

**Verdict for CR-2:** sufficient.

---

### CR-3: SQLite migration runner — RESOLVED ✅

**Where:** Phase 1 작업 1, 3 (lines 127, 145-150), 영향 파일 `Cargo.toml` (line 117), 마이그레이션 파일 네이밍 (line 144).

**Check 1: rusqlite_migration 또는 동등품이 있나?**
Yes. `rusqlite_migration` crate가 명시적으로 추가됨 (line 127): "rusqlite (bundled feature) + rusqlite_migration crate 추가".

**Check 2: PRAGMA user_version 패턴이 명시됐나?**
Yes. Line 149에 명시: "내부적으로 `PRAGMA user_version` 기반으로 현재 스키마 버전 추적". Line 168 검증 항목에서도 "PRAGMA user_version 값 = 1 확인" 명시.

**Check 3: v1.5/v2 자동 업그레이드 보장?**
Yes (line 150): "v1.5/v2에서 새 마이그레이션 파일 추가 시 기존 사용자 DB 자동 업그레이드 보장". 파일 네이밍 컨벤션 (0001/0002/0003)도 line 144에 박힘.

**Verdict for CR-3:** sufficient.

---

### CR-4: vibrancy crate (decorum 배제) — RESOLVED ✅

**Where:** Phase 5 작업 6 (line 338), Phase 5 영향 파일 (line 328), Open Questions (line 11).

**Check 1: decorum이 explicitly 빠졌나?**
Yes. Line 338에 명시적으로: "**`tauri-plugin-decorum` 사용하지 않음** — decorum은 타이틀바/traffic light 커스터마이징을 포함하여 Apple HIG 표준 윈도우 크롬과 충돌. 표준 타이틀바/traffic light 위치 유지."

**Check 2: windowEffects/window-vibrancy로 한정됐나?**
Yes. Line 338: "`tauri.conf.json`의 `windowEffects: ["sidebar"]` 설정 사용". Line 328 영향 파일에도 "windowEffects vibrancy 설정"으로 한정 명시.

이전 review의 V1 violation (HIG 표준 윈도우 크롬 vs decorum 커스터마이징 충돌)이 정확히 해소됨.

**Verdict for CR-4:** sufficient.

---

### CR-5: signing key 정책 (ADR-006) — RESOLVED ✅

**Where:** ADR-006 신규 (lines 601-623), Phase 6 작업 2 (lines 372-377), Phase 7 작업 6 (line 409), Open Questions (line 12, 20).

**Check 1: ADR-006이 public repo + pubkey 등록 절차를 명시했나?**
Yes (lines 601-623). 구체적으로:
- public GitHub repo 권장 (line 603)
- privkey 위치: GitHub Actions secrets + 사용자 로컬 백업 `~/.tauri/tradelog.key` (line 610)
- pubkey 위치: `tauri.conf.json` > `plugins` > `updater` > `pubkey` (line 612)
- private repo 대안 (pre-signed asset URL) trade-off 명시 (line 615)

**Check 2: Phase 7로 결정 잠금이 연기됐나?**
Yes. Line 409 (Phase 7 작업 6): "GitHub repo public/private 최종 결정 잠금 (Phase 6에서 권장한 방식 확정)". 사용자 액션 아이템으로 분리됨. Open Questions line 20에 "+2시간" 비용도 정확히 추적됨.

**Check 3: tauri signer generate 명령이 명시됐나?**
Yes. Line 374: `tauri signer generate -w ~/.tauri/tradelog.key`.

**Verdict for CR-5:** sufficient.

---

### CR-6: Per-phase measurement gate — RESOLVED ✅

**Where:** Phase 0 line 108, Phase 1 line 169, Phase 3 line 278, Phase 4 line 314, Phase 5 lines 350-354, Phase 6 line 390, Phase 7 lines 411-414, Verification Plan table (lines 631-647).

**Check 1: Phase 0~6에 [Measurement Gate]가 박혔나?**
Yes. 7개 phase 모두에 `[Measurement Gate]` 라벨이 명시적으로 붙음:
- Phase 0: baseline < 10MB (line 108)
- Phase 1: < 11MB (rusqlite +~1MB delta) (line 169)
- Phase 2: 순수 TS, 측정 면제 명시 (line 635)
- Phase 3: < 12MB, **12MB 초과 시 경고 + 최적화** 트리거 (line 278)
- Phase 4: <= 14MB, **초과 시 Recharts → uPlot 검토** (line 314)
- Phase 5: **최종 pre-release gate** — 번들 <= 15MB, 콜드스타트 <= 1.5초, RSS <= 200MB + 3개 fallback 옵션 (lines 350-354)
- Phase 6: delta 미미 확인 (line 390)
- Phase 7: 최종 잠금 (lines 411-414)

**Check 2: 측정 명령어가 actionable한가?**
Yes. Section 5 verification plan에 명령어가 한 곳에 모여 있음 (lines 644-647):
- 번들: `pnpm tauri build && du -sh src-tauri/target/release/bundle/macos/tradelog.app`
- 콜드스타트: `hyperfine --warmup 3 'open -gj /path/to/tradelog.app'`
- RSS: `top -pid $(pgrep tradelog) -l 5 | grep RSS`
- Universal binary: `lipo -info ...`

각 명령어가 즉시 실행 가능. hyperfine warmup 3은 콜드/웜 구분의 표준 패턴이고, `top -l 5`로 5초 샘플링도 합리적. 단 한 가지 미세한 흠: 콜드스타트 측정 시 macOS file system cache 영향을 제거하려면 `purge` 명령(루트 권한 필요)도 권장되나, hyperfine warmup으로 안정화하는 방식도 실무에서 수용 가능.

**Check 3: 임계 초과시 fallback이 plan에 박혔나?**
Yes:
- Phase 3 12MB 초과 → "RDG tree-shake, 불필요 컴포넌트 제거" (line 278)
- Phase 4 14MB 초과 → "Recharts -> uPlot (~10KB) 또는 SVG 직접 작성(~5KB)으로 교체 검토" (line 314)
- Phase 5 임계 초과 → "(a) shadcn/ui 4-5개 컴포넌트 copy, (b) Recharts -> uPlot, (c) Tailwind purge 확인" (line 354)

각 fallback이 구체적이고 실행 가능. 단, O-2에서 언급한 대로 Phase 5 fallback은 "비용 낮은 것부터" 우선순위가 명시되면 더 좋음(현재는 (a)→(b)→(c) 순서이나 비용 명기는 없음).

**Verdict for CR-6:** sufficient. Per-phase delta 추적 + final gate + fallback이 모두 actionable.

---

## 2. Critic Critical Items Verification

### Critical 1: Timezone ADR-005 — RESOLVED ✅

**Where:** ADR-005 신규 (lines 573-597), Phase 1 SQL 코멘트 (lines 130-132), Phase 2 작업 2 (line 191), Open Questions (line 10).

**Check 1: trade_date = KST date / created_at = UTC 분리가 명확한가?**
Yes (lines 582-585). 컬럼별 정확한 정책:
- `trade_date` (TEXT PK): KST `YYYY-MM-DD`
- `created_at` (TEXT): UTC ISO 8601
- `updated_at` (TEXT): UTC ISO 8601

**Check 2: Schema 주석에 포함됐나?**
Yes. Phase 1의 SQL 본문 주석으로 박힘 (lines 130-132):
```
-- trade_date: KST 기준 ISO date (YYYY-MM-DD). UTC가 아님.
-- created_at/updated_at: UTC ISO 8601 timestamp.
-- v2에서 trade 테이블 추가 시 trade_date를 FK로 참조.
```
실제 컬럼 옆에도 인라인 코멘트(line 134): `trade_date TEXT PRIMARY KEY,    -- KST date (YYYY-MM-DD)`.

**Check 3: ADR-005가 spec의 "저장은 UTC, 표시·그룹핑은 KST"와 정합적인가?**
Yes. Line 579에서 spec 인용 후 line 580에서 "spec의 '저장은 UTC'는 timestamp 필드(`created_at`, `updated_at`)에 적용. `trade_date`는 point-in-time이 아니라 calendar date (날짜 개념)이므로 KST date가 의미적으로 정확"이라고 spec 해석을 명시. Line 581의 "24/7 암호화폐 거래에서 KST 자정 cutoff" 근거도 강력.

**Check 4: v1.5 sync 시나리오 호환?**
Yes (line 587). last-write-wins 판정에 `trade_date(KST)` + `updated_at(UTC)` 조합 사용 명시.

**미세한 보완점 (verdict에 영향 없음):** ADR-005에 JS 측 KST date 생성 예시는 있으나(`new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' })`, line 584) Rust 측 등가 코드는 없음. Phase 1에서 batch upsert 시 Rust가 trade_date를 받기만 하므로 큰 문제는 없으나, Rust 측에서 자체 생성이 필요한 케이스(예: 기본값 채움)가 발생하면 `chrono` crate + KST timezone 설정 가이드가 필요할 수 있다. → O-1으로 노트.

**Verdict for Critical 1:** sufficient.

---

### Critical 2: RSS/콜드스타트 측정 — RESOLVED ✅

**Where:** Phase 5 [Measurement Gate] (lines 350-354), Phase 7 작업 8 (lines 411-414), Verification Plan (lines 644-647).

**Check 1: 측정 시점이 plan에 박혔나?**
Yes. 두 시점에 명시적으로 박힘:
- Phase 5 (프론트엔드 마지막 의존성 추가 직후) — pre-release gate (lines 350-354)
- Phase 7 (notarization 후 최종 잠금) — final gate (lines 411-414)

이 두 시점은 합리적이다. Phase 5에서 1차 gating 후 Phase 6/7의 변경(주로 updater plugin, signing)이 측정값에 큰 영향이 없음을 phase 6 검증(line 390)에서 명시.

**Check 2: 측정 명령어가 명시됐나?**
Yes. 동일한 명령어 세트가 Phase 5, Phase 7, Verification Plan 3곳에 일관되게 등장:
- 콜드스타트: `time open -W /path/to/tradelog.app` (1차) + `hyperfine --warmup 3 'open -gj /path/to/tradelog.app'` (반복) (line 352, 413)
- RSS: `top -pid $(pgrep tradelog) -l 5 | grep RSS` 또는 Activity Monitor (line 353, 414)
- 번들: `du -sh src-tauri/target/release/bundle/macos/tradelog.app` (line 351, 412)

명령어가 actionable하고 macOS 표준 도구 사용. hyperfine은 외부 의존성이지만 brew로 설치 표준.

**Check 3: 임계 초과시 fallback이 plan에 박혔나?**
Yes (line 354): "임계 초과 시 fallback: (a) shadcn/ui에서 사용하는 4-5개 컴포넌트(Button, Input, Dialog, Tooltip, Sidebar)만 copy하여 Radix 전체 import 제거, (b) Recharts -> uPlot 마이그레이션, (c) 불필요한 Tailwind 유틸리티 purge 확인". 각 fallback이 구체적 액션이며, 현실적 시간 비용을 추정할 수 있다.

추가로 Phase 4(line 314)에서 "14MB 초과 시 Recharts -> uPlot 또는 SVG 직접 작성"으로 한 단계 빠른 트리거도 박혀 있어, Phase 5 final gate에서 부담이 줄어드는 구조.

**Verdict for Critical 2:** sufficient.

---

## 3. New Concerns

전반적으로 **plan rev2는 prior review의 모든 6개 CR + Critic 2개 critical을 본문에 정확히 반영**했다. 새로운 큰 결함은 발견되지 않음.

다음 항목들은 verdict에 영향 없는 minor observation:

- **O-1 (보완 권고):** ADR-005 line 584의 KST date 생성 예시는 JS side만 있음. Rust 측에서 trade_date 자체 생성이 필요한 케이스(예: created_at에서 KST date 추출)가 발생하면 `chrono::FixedOffset::east_opt(9 * 3600)` 패턴 가이드가 필요. Phase 1 작업 5(models.rs)에서 만약 trade_date 디폴트 처리가 들어간다면 Executor가 챙겨야 함.
- **O-2 (보완 권고):** Phase 5 measurement gate의 fallback 3개 (a/b/c)는 비용 순으로 정렬되어 있으나(작은 변경 → 큰 변경), 각 옵션의 예상 시간(예: a=30분, b=2시간, c=15분)이 명시되지 않음. 임계 초과 발생 시 어느 옵션부터 적용할지 의사결정이 더 빨라지려면 시간 추정이 도움.
- **O-3 (정보):** Phase 3.0 spike (lines 209-236)의 "30분 hard limit"은 합리적이나, 실패 판정 후 ADR-002a 작성과 fallback 라이브러리 PoC도 함께 30분으로 끝내라는 의도인지 명확하지 않음. ADR-002a는 spike 결과 판정 + fallback 결정이며, 별도 fallback PoC는 Phase 3 본 작업 시작 전 추가 30분~1시간을 잡는 것이 안전. 단, line 705 "최악 케이스 ~42시간"에 이미 흡수되어 있다고 봄.

---

## 4. Summary Table

| Item | Status | Evidence |
|------|--------|----------|
| CR-1 RDG spike gate | ✅ Resolved | Phase 3.0 (lines 209-236), ADR-002 보강, fail/fallback 명시 |
| CR-2 v2 스키마 FK 패턴 | ✅ Resolved | ADR-004 보강 (lines 565-569), 0003_v2_trades.sql 명명 |
| CR-3 Migration runner | ✅ Resolved | rusqlite_migration + PRAGMA user_version (lines 127, 149) |
| CR-4 Vibrancy 한정 | ✅ Resolved | windowEffects 명시 + decorum 명시적 배제 (line 338) |
| CR-5 Signing key 정책 | ✅ Resolved | ADR-006 (lines 601-623), Phase 7 잠금 |
| CR-6 Per-phase measurement | ✅ Resolved | Phase 0~7 [Measurement Gate], 명령어 + fallback |
| Critical 1 Timezone ADR-005 | ✅ Resolved | ADR-005 (lines 573-597), schema 주석 |
| Critical 2 RSS/콜드스타트 | ✅ Resolved | Phase 5 + Phase 7 final gate, 명령어 + fallback |

---

**Final verdict line:** APPROVE_RESOLVED — 6개 CR + Critic 2개 critical 모두 plan 본문에 actionable하게 박힘. Critic 단계로 진행 가능.
