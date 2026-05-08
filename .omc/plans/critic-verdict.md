# Critic Verdict — ralplan-tradelog-v1

**Reviewer:** critic
**Date:** 2026-05-06
**Subject:** `.omc/plans/ralplan-tradelog-v1.md`
**Spec:** `.omc/specs/deep-interview-tradelog.md` (9R, ambiguity 5.9%)
**Architect Review:** `.omc/plans/architect-review.md` (APPROVE_WITH_CHANGES, 6 CR)
**Mode:** THOROUGH (no escalation to ADVERSARIAL — findings are concentrated, not systemic)

---

## 1. Final Verdict

**ITERATE** — Plan is structurally sound and executable, but has 2 critical gaps (RDG paste spike gate missing, spec timezone contradiction unaddressed) and incomplete Architect CR integration. One more revision pass fixes all issues without architectural changes.

---

## 2. Five-Dimension Assessment

| # | Dimension | Verdict | Notes |
|---|-----------|---------|-------|
| 1 | Principle-Option Consistency | **PASS** | 5 principles consistently drive all 4 ADRs. Non-Goals respected — no iCloud, Supabase, xlsx parser, Windows, etc. One minor spec contradiction on timezone storage (see Critical #2). |
| 2 | Fair Alternatives Treatment | **PASS** | React/Svelte comparison is fair (ecosystem gap is real). AG Grid/RDG comparison has a factual overstatement ("paste 내장") that the Architect caught — but the final decision is still correct for the right reasons. Recharts/Visx comparison is balanced and proportionate. |
| 3 | Risk Mitigation Clarity | **FAIL** | Architect's 6 CRs are acknowledged in the review but **not yet integrated into the plan text itself**. CR-1 (RDG paste spike) is the highest-risk single item and has no fallback path in the plan. CR-3 (migration runner) and CR-5 (pubkey policy) are missing entirely. |
| 4 | Testable Acceptance Criteria | **PASS (with gaps)** | 18 of 20 spec acceptance criteria map to plan tasks with verification steps. 2 items have weak/missing verification specificity (see matrix below). |
| 5 | Concrete Verification Steps | **PASS (with gaps)** | Most phases have concrete "command → expected output" verification. Phase 3 paste scenario lacks step-by-step verification script. Phase 7 performance measurements lack tooling specifics (how to measure cold start? `time` command? Instruments?). |

---

## 3. Critical Issues (must fix before execution — blockers)

### Critical #1: RDG Paste PoC Spike Gate Missing (Architect CR-1)

**Evidence:** Plan Phase 3 작업 3 describes building `paste-parser.ts` with custom TSV parsing, which **contradicts ADR-002's stated reason** for choosing RDG ("TSV clipboard paste가 내장"). The Architect's review (CR-1) correctly identifies this: RDG does NOT auto-parse multi-row external clipboard TSV into grid rows. The plan already implicitly acknowledges this by building a custom paste parser, yet the ADR and decision rationale still claim "paste 내장" as the differentiator.

- **Confidence:** HIGH
- **Why this matters:** Phase 3 is 8 hours (47% of dev time). If RDG's paste event model is incompatible with the multi-row external clipboard scenario, the rework cost is massive. There is no fallback documented.
- **Fix:**
  1. Insert "Phase 3.0: RDG Paste PoC Spike (30 min)" before Phase 3 작업 1
  2. Define exit criteria: success = Excel 30-row TSV → RDG grid populated via `onPaste` + `clipboardData.getData('text/plain')`. Failure = switch to TanStack Table headless or glide-data-grid (document as ADR-002a)
  3. Update ADR-002 rationale: replace "TSV paste 내장" with accurate description — "RDG provides cell editing + keyboard nav + virtualization; custom paste handler still required but integration surface is simpler than headless alternatives"

### Critical #2: Spec Timezone Contradiction Unaddressed

**Evidence:** Spec line 48: `"거래일 cutoff: 00:00 Asia/Seoul (KST) — 저장은 UTC, 표시·그룹핑은 KST"`. Plan Phase 1 schema (line 124-135): `trade_date TEXT PRIMARY KEY` stores ISO date in KST. Plan Phase 2 (line 175): `"trade_date는 ISO date (YYYY-MM-DD) in KST. 계산은 날짜 순 정렬만 의존하므로 timezone 로직 불필요"`.

The plan stores trade_date as a KST date string, NOT UTC. Meanwhile `created_at`/`updated_at` use `datetime('now')` which is UTC. This is a **direct contradiction** of spec's "저장은 UTC" statement.

- **Confidence:** HIGH
- **Why this matters:** The plan's approach (store date as KST) is arguably MORE correct for a daily journal (a "date" in KST makes semantic sense, unlike a UTC timestamp), but it contradicts the spec. If not explicitly resolved, an executor could implement either interpretation. For v1.5 cloud sync, this becomes a data integrity issue — the server must know the timezone semantics of `trade_date`.
- **Fix:**
  1. Add ADR-005 (or append to ADR-004): "trade_date stores KST date (YYYY-MM-DD), not UTC timestamp. Spec's '저장은 UTC' applies to timestamp fields (created_at, updated_at) only. trade_date is a calendar date in the user's timezone (KST), not a point-in-time."
  2. Update spec Open Questions or errata to reflect this clarification
  3. Add `-- timezone: KST date, not UTC` comment to schema

---

## 4. Major Findings (should fix — follow-ups OK if time-constrained)

### Major #1: Architect CR-3 (Migration Runner) Not Integrated

**Evidence:** Plan Phase 1 작업 2 defines `migrations/001_init.sql` but has no migration runner mechanism. The Architect's CR-3 requests `rusqlite_migration` crate or `PRAGMA user_version` based runner. The plan text does not address this.

- **Confidence:** HIGH
- **Why this matters:** Without a migration runner, v1.5/v2 schema evolution requires manual user intervention or destructive re-creation. Principle #2 ("v1.5/v2 호환 스키마 유지") is unenforceable at runtime.
- **Fix:** Add to Phase 1 작업 2: "Implement `PRAGMA user_version` based migration runner in `db.rs`. On app start, check `user_version`, run pending migrations sequentially, update `user_version`."

### Major #2: Architect CR-5 (GitHub Repo Public/Pubkey Policy) Not Integrated

**Evidence:** Plan Phase 6 작업 2 mentions GitHub Releases endpoint but does not resolve whether the repo is public or private, nor the pubkey/privkey storage policy. Open Questions file line 21 lists this as unresolved. The Architect's CR-5 flags this explicitly.

- **Confidence:** HIGH
- **Why this matters:** If the repo is private, the auto-update endpoint won't work without token-based access. The signing key storage policy affects the entire CI/CD security model.
- **Fix:** Add decision to Phase 6 or ADR-005: "v1 uses public GitHub repo for auto-update simplicity. Signing keys: privkey in GitHub Actions secrets, pubkey embedded in tauri.conf.json. User keeps local backup of privkey."

### Major #3: Architect CR-6 (Per-Phase Bundle/Coldstart Measurement) Not Integrated

**Evidence:** Plan Phase 0 검증 says ".app < 10MB" but Phases 1-6 have no bundle size or cold start measurement gates. The Architect's CR-6 requests per-phase measurement. Plan Section 5 (Verification Plan) table only has Phase 0 and Phase 7 for size/performance checks.

- **Confidence:** HIGH
- **Why this matters:** React (~140KB) + RDG (~50KB) + Recharts (~180KB) + Tailwind + Radix + shadcn/ui accumulate. If Phase 7 is the first measurement point, identifying which dependency caused budget overflow requires bisection. The 15MB constraint has ~1-2MB margin at best (Architect Tension A analysis).
- **Fix:** Add to each Phase 1-6 검증: "Measure `.app` bundle size and record delta from previous phase. If cumulative > 12MB (80% of 15MB target), pause and optimize before proceeding."

### Major #4: Architect CR-2 (v2 Schema Compatibility ADR) Not Integrated

**Evidence:** ADR-004 covers only rusqlite selection. The Architect's CR-2 requests v2 `trade` table sketch and migration path documentation. Plan's Principle #2 promises v2 compatibility but the ADR doesn't back this up with specifics beyond a SQL comment in the schema.

- **Confidence:** MEDIUM
- **Why this matters:** v2 compatibility is a stated principle. Without documenting the migration path, a future developer might make incompatible schema changes.
- **Fix:** Add ADR-005 or expand ADR-004: sketch v2 `trade` table, explain that `trading_day` becomes a daily summary/snapshot, and document the migration path (e.g., `trading_day` preserved as-is, `trade` added with FK to `trade_date`).

### Major #5: Architect CR-4 (Vibrancy Implementation) Partially Addressed

**Evidence:** Plan Phase 5 작업 6 lists both `tauri-plugin-decorum` and native window flags as options without deciding. Architect CR-4 recommends against `decorum` (Apple HIG conflict). The plan still says "또는" (or).

- **Confidence:** HIGH
- **Why this matters:** An executor will face an ambiguous choice. `tauri-plugin-decorum` modifies titlebar/traffic lights which contradicts Principle #3 (Apple HIG).
- **Fix:** Strike `tauri-plugin-decorum` from Phase 5. Specify: "Use Tauri v2 `windowEffects` config in `tauri.conf.json` for vibrancy. Do not customize titlebar or traffic light positions."

---

## 5. Minor Findings

1. **TanStack Query + Zustand dual state** (Architect OI-3): Phase 3 작업 5 uses both TanStack Query and Zustand for ~30-100 rows of local SQLite data. Zustand alone is sufficient. TanStack Query adds ~30KB for no cache invalidation benefit in a single-user local app. Not a blocker — just unnecessary bundle weight.

2. **Floating-point precision** (Architect OI-4): Phase 2 computes `daily_return_pct` and `cumulative_return_pct` in JS Number. For financial data, this can produce display mismatches vs Excel. Not critical for a personal journal, but worth noting for user expectation management.

3. **`start_balance` formula edge case**: Plan Phase 2 line 169 says "첫 row는 deposit이 start_balance" but the formula `end_balance(t-1) + deposit(t) - withdrawal(t-1)` doesn't apply to the first row. The plan mentions this as a special case but the test cases (line 179) should explicitly test: "first row with deposit=10000, no previous row → start_balance=10000."

4. **Phase 5 ordering concern**: Phase 5 (Design System) depends on Phase 3 and 4, meaning all components are built with temporary styling first, then restyled. This is workable but means Phase 3/4 screenshots won't reflect final appearance. A minor development flow issue — not a plan flaw.

5. **Universal binary not specified**: Spec line 39 says "Apple Silicon + Intel". Plan Phase 7 doesn't explicitly mention universal binary (arm64 + x86_64). The GitHub Actions workflow should build universal binaries.

---

## 6. What's Missing

- **Rollback/recovery path**: No phase documents "what happens if this phase fails mid-execution." Phase 3 (grid) is the highest-risk phase — if RDG proves inadequate after 4 hours of work, the plan doesn't say how to recover.
- **Error handling strategy**: No mention of how the app handles SQLite write failures, corrupt DB files, or paste with malformed data. v1 scope is small but these edge cases affect data integrity.
- **Accessibility**: No mention of VoiceOver/screen reader support. Acceptable for v1 personal tool, but worth noting.
- **Window size/resize behavior**: Spec mentions nothing about minimum window size or responsive layout. Plan doesn't specify.
- **Locale/number formatting**: USD amounts need proper formatting ($1,234.56). Plan Phase 4 says "USD 포맷" but doesn't specify the formatting approach.

---

## 7. Acceptance Criteria Coverage Matrix

| # | Spec Acceptance Criterion | Plan Phase | Plan Task/Verification | Coverage |
|---|--------------------------|------------|----------------------|----------|
| 1 | .app bundle <= 15MB | Phase 7 | 작업 6, 검증 bullet 1 | COVERED (but measurement only at Phase 7 — see Major #3) |
| 2 | First launch empty screen | Phase 4 | 작업 6 (빈 데이터 상태 placeholder) | COVERED |
| 3 | Hero: current balance (SF Pro semibold) | Phase 4 | 작업 3 (BalanceDisplay.tsx) | COVERED |
| 4 | Hero: equity curve (area fill) | Phase 4 | 작업 4 (EquityCurve.tsx) | COVERED |
| 5 | Hero: goal line ($500K @ 2028-12) dotted | Phase 4 | 작업 4 (ReferenceLine) | COVERED |
| 6 | Hero: cumulative return % (continuous) | Phase 4 | 작업 5 (CumulativeReturn.tsx) | COVERED |
| 7 | Grid = spreadsheet-like (9 columns) | Phase 3 | 작업 2 (TradingGrid.tsx 컬럼 정의) | COVERED |
| 8 | Excel paste -> TSV auto-parse | Phase 3 | 작업 3 (paste-parser.ts) | COVERED (but needs spike — Critical #1) |
| 9 | Computed fields auto-calculate | Phase 2 | 작업 1 (computeTradingDays) | COVERED |
| 10 | Cumulative return formula | Phase 2 | 작업 1, line 173 | COVERED |
| 11 | Keyboard nav (Tab/Enter/Cmd+C/V/Z) | Phase 3 | 작업 6, 7, 8 | COVERED |
| 12 | Note cell multiline (Notion-like) | Phase 3 | 작업 4 (NoteEditor.tsx) | COVERED |
| 13 | Light/dark auto-switch | Phase 5 | 작업 5 | COVERED |
| 14 | macOS vibrancy sidebar | Phase 5 | 작업 6, 7 | COVERED (needs CR-4 clarification — Major #5) |
| 15 | Code signing + notarization | Phase 7 | 작업 1-5 | COVERED |
| 16 | GitHub Releases auto-update | Phase 6 | 작업 1-4 | COVERED (needs CR-5 resolution — Major #2) |
| 17 | Excel 2026-04/05 migration <= 5min | Phase 8 | 작업 1-5 (사용자 가이드) | COVERED |
| 18 | SQLite at Application Support/tradelog/ | Phase 1 | 작업 3, 검증 bullet 4 | COVERED |
| 19 | RSS memory <= 200MB | Phase 7 | 작업 8 | WEAK — no tooling specified (how to measure RSS? Activity Monitor manual check? `vmmap`? Instruments?) |
| 20 | Cold start <= 1.5s | Phase 7 | 작업 7 | WEAK — no measurement methodology specified (`time` command? Tauri built-in? Video recording?) |

**Coverage: 18/20 fully covered, 2/20 weakly covered (measurement methodology missing).**

The user mentioned "spec 27개 acceptance" — the spec lists 20 distinct checkable items (counting hero sub-items separately as 4). If the user counts differently, no spec items are missed by the plan.

---

## 8. Final ADR Delta (items to add to plan upon APPROVE)

If this plan is approved after the ITERATE fixes, these ADRs should be added:

| ADR | Content | Source |
|-----|---------|--------|
| **ADR-005: Timezone Storage Policy** | `trade_date` = KST calendar date (YYYY-MM-DD), not UTC. Timestamp fields (`created_at`, `updated_at`) = UTC. Spec's "저장은 UTC" applies to timestamps only. | Critical #2 |
| **ADR-004 expansion: v2 Migration Path** | Sketch v2 `trade` table. Document `trading_day` survival as daily snapshot. Migration runner using `PRAGMA user_version`. | Architect CR-2, CR-3 |
| **ADR-002 amendment: RDG Rationale Correction** | Replace "TSV paste 내장" with accurate description. Add spike gate and fallback path. | Architect CR-1, Critical #1 |
| **ADR-006: Auto-Update Infrastructure** | Public GitHub repo. Pubkey in `tauri.conf.json`, privkey in GitHub Actions secrets + user local backup. | Architect CR-5 |
| **Phase 5 vibrancy decision** | Use Tauri v2 `windowEffects` only. No `tauri-plugin-decorum`. | Architect CR-4 |

---

## 9. Architect CR Triage (Blocker vs Follow-up)

| CR | Description | Classification | Rationale |
|----|-------------|----------------|-----------|
| CR-1 | RDG paste PoC spike | **BLOCKER** (must add before Phase 3 starts) | 47% of dev time depends on this unvalidated assumption |
| CR-2 | v2 schema ADR | **Follow-up** (can add during Phase 1) | Documentation enrichment, doesn't block execution |
| CR-3 | Migration runner | **BLOCKER** (must add before Phase 1 ends) | Without this, v1.5/v2 schema evolution breaks user data |
| CR-4 | Vibrancy decision | **Follow-up** (can decide at Phase 5 start) | Low risk, either approach works |
| CR-5 | GitHub pubkey policy | **Follow-up** (must resolve before Phase 6) | Doesn't block Phases 0-5 |
| CR-6 | Per-phase measurement | **BLOCKER** (must add to plan before Phase 1 starts) | Without it, 15MB/1.5s constraints are unenforceable |

**Summary: 3 blockers (CR-1, CR-3, CR-6), 3 follow-ups (CR-2, CR-4, CR-5).**

---

## 10. Multi-Perspective Notes

### Executor Perspective
- Phase 3 paste-parser.ts는 엑셀 컬럼 B/C/E/I/J 매핑을 명시하지만, 엑셀에서 복사할 때 사용자가 B-J 전체를 선택하는지 B/C/E/I/J만 선택하는지에 따라 TSV 컬럼 인덱스가 달라진다. Plan은 "Row 3-32 드래그 선택"이라고 하므로 전체 컬럼(B-J) 복사 가정이지만, 이 가정을 paste-parser.ts에 명시해야 한다.
- Phase 5의 shadcn/ui 초기화가 Phase 3/4 이후인데, Phase 3에서 이미 UI 컴포넌트(Button, Input 등)가 필요할 수 있다. 순서 조정 또는 Phase 3에 minimal shadcn/ui 사전 설치가 필요할 수 있다.

### Stakeholder Perspective
- 5분 마이그레이션 목표는 합리적. 2개 월 시트 × 30 row = 60 row paste 2회 + 확인. 충분히 가능.
- 자산곡선 hero는 spec의 핵심 가치 제안("한 눈에 전체 여정")과 정확히 일치.

### Skeptic Perspective
- 가장 큰 리스크는 여전히 RDG의 외부 클립보드 paste 호환성. Architect의 반론이 설득력 있다. Spike gate 없이 8시간을 투입하는 것은 도박이다.
- 34시간 현실 추정치는 "행복 경로" 기준. RDG spike 실패 시 + 대안 라이브러리 전환 비용은 최소 +8시간. 총 42시간까지 갈 수 있다.

---

## 11. Verdict Justification

**Why ITERATE, not APPROVE:**
- 2 Critical issues exist: RDG spike gate (Critical #1) and timezone spec contradiction (Critical #2)
- 3 of 6 Architect CRs (CR-1, CR-3, CR-6) are blockers that are not yet integrated into the plan text
- The plan is structurally sound and all issues are fixable with a single revision pass — no architectural rework needed

**Why not REJECT:**
- The plan's overall architecture (Tauri v2 + React + rusqlite + RDG + Recharts) is well-reasoned
- 18/20 acceptance criteria are fully covered with concrete verification
- Non-Goals are perfectly respected
- The 4 ADRs demonstrate thoughtful decision-making
- All issues identified are "add missing content" rather than "redesign"

**What's needed for APPROVE:**
1. Add RDG paste spike gate (Phase 3.0) with fallback path
2. Add ADR-005 for timezone storage policy
3. Integrate Architect CR-3 (migration runner) into Phase 1
4. Integrate Architect CR-6 (per-phase measurement gates) into Phases 1-6
5. Resolve Phase 6 public repo / pubkey policy (CR-5)
6. Clarify vibrancy approach — strike `tauri-plugin-decorum` (CR-4)
7. Correct ADR-002 paste claim from "내장" to accurate description

**Realist Check:** All Criticals survived pressure testing. Critical #1 (RDG paste) has no mitigating factor — there's literally no evidence the core scenario works. Critical #2 (timezone) is a data semantics issue that, if misinterpreted by an executor, would create a v1.5 sync bug. Neither is inflated.

**Review mode:** THOROUGH throughout. Did not escalate to ADVERSARIAL — the issues are concentrated in specific gaps, not evidence of systemic plan weakness. The plan's author did competent work; the gaps are predictable for a first-pass plan.

---

## 12. Open Questions (unscored)

1. Should Phase 3 and Phase 5 be partially interleaved? Phase 3 grid component needs at least basic styling (e.g., system font, basic spacing) to verify UX, but Phase 5 is where shadcn/ui is initialized.
2. Is the 34-hour estimate realistic given that the user is presumably working part-time on this? Calendar time projection would be useful.
3. The spec mentions `react-aria-components` as an alternative to shadcn/ui (spec line 57). The plan chose shadcn/ui without discussing this alternative. Is this intentional or an oversight?
4. TanStack Query adds ~30KB but provides no cache invalidation benefit for local SQLite. Is there a future-proofing argument (v1.5 remote API) that justifies keeping it, or should it be removed per Architect OI-3?

---

*Ralplan summary row:*
- **Principle/Option Consistency:** Pass — 5 principles drive all decisions consistently. One spec text contradiction (timezone) needs ADR resolution.
- **Alternatives Depth:** Pass — React/Svelte, RDG/AG Grid/TanStack/Handsontable, Recharts/Visx all evaluated with concrete criteria. RDG rationale has a factual overstatement but conclusion is still correct.
- **Risk/Verification Rigor:** Fail — Architect's 6 CRs identify real risks but 3 blockers (CR-1, CR-3, CR-6) are not integrated into the plan text. Verification steps exist but lack per-phase performance gates.
- **Deliberate Additions (if required):** N/A — not in deliberate mode.
