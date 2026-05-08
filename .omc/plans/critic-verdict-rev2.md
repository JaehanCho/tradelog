# Critic Verdict (rev2) — ralplan-tradelog-v1

**Reviewer:** critic
**Date:** 2026-05-06
**Subject:** `.omc/plans/ralplan-tradelog-v1.md` (rev2, 730 lines)
**Spec:** `.omc/specs/deep-interview-tradelog.md` (9R, ambiguity 5.9%)
**Architect rev2:** `.omc/plans/architect-review-rev2.md` (APPROVE_RESOLVED)
**Prior verdict:** `.omc/plans/critic-verdict.md` (ITERATE)
**Iteration:** 2 of 5 cap
**Mode:** THOROUGH (no escalation to ADVERSARIAL — no new issues found)

---

## 1. Final Verdict

**APPROVE** — 이전 ITERATE의 Critical 2건 + Architect blocker 3건 모두 plan 본문에 line-level로 반영 완료. Acceptance criteria 20/20 커버리지. Non-Goals 위반 0. Optional 3건은 execution phase follow-up으로 적절 분류. Autopilot 핸드오프 가능.

---

## 2. Prior Issues Resolution Table

| # | Item | Rev1 Status | Rev2 Status | Evidence (line) |
|---|------|-------------|-------------|-----------------|
| C-1 | RDG paste spike gate | **CRITICAL** (missing) | **RESOLVED** | Phase 3.0 (L209-236), fail 조건 3개 (L224-227), fallback 2개 (L229-232), ADR-002 rationale 수정 (L498) |
| C-2 | Timezone ADR-005 | **CRITICAL** (unaddressed) | **RESOLVED** | ADR-005 (L573-597), schema 주석 (L130-132, L134), v1.5 sync 호환 (L587) |
| CR-1 | RDG spike (=C-1) | **BLOCKER** | **RESOLVED** | Same as C-1 above |
| CR-3 | Migration runner | **BLOCKER** | **RESOLVED** | `rusqlite_migration` (L117, L127), PRAGMA user_version (L149), 검증 (L168), naming convention (L144) |
| CR-6 | Per-phase measurement | **BLOCKER** | **RESOLVED** | Phase 0 (L108), Phase 1 (L169), Phase 3 (L278), Phase 4 (L314), Phase 5 (L350-354), Phase 6 (L390), Phase 7 (L411-414), 명령어 집중 (L644-647) |
| CR-2 | v2 schema ADR | Follow-up | **RESOLVED** | ADR-004 보강 (L565-569), v2 trade table sketch, 0003_v2_trades.sql |
| CR-4 | Vibrancy decision | Follow-up | **RESOLVED** | `windowEffects: ["sidebar"]` 명시 + decorum 명시적 배제 (L338) |
| CR-5 | GitHub pubkey policy | Follow-up | **RESOLVED** | ADR-006 (L601-623), Phase 7 잠금 (L409) |

**8/8 해결. 미해결 항목 0.**

---

## 3. Five-Dimension Reassessment

| # | Dimension | Rev1 | Rev2 | Notes |
|---|-----------|------|------|-------|
| 1 | Principle-Option Consistency | PASS | **PASS+** | ADR-005가 spec "저장은 UTC" 모순을 명시적으로 해소. 6개 ADR이 5개 Principle과 완전 정합. Non-Goals 위반 0. |
| 2 | Fair Alternatives Treatment | PASS | **PASS+** | ADR-002의 "paste 내장" overstatement 수정됨 (L498). RDG 선택 근거가 "에디팅+nav+가상화 인프라 위 커스텀 paste handler 통합 비용 최소"로 정확하게 변경. Spike gate가 공정성 보장. |
| 3 | Risk Mitigation Clarity | **FAIL** | **PASS+** | 모든 6 CR이 plan 본문에 통합. Phase 3.0 spike gate + 2개 fallback 경로 + 최악 케이스 42h timeline. Per-phase measurement gate + 임계 초과 시 구체적 fallback (Phase 3: tree-shake, Phase 4: uPlot, Phase 5: 3단계 최적화). |
| 4 | Testable Acceptance Criteria | PASS (18/20) | **PASS (20/20)** | RSS: `top -pid + grep RSS` 명시 (L353). Cold start: `hyperfine --warmup 3` 명시 (L352). 2개 weak 항목 → fully covered. |
| 5 | Concrete Verification Steps | PASS (with gaps) | **PASS+** | 모든 phase에 `[Measurement Gate]` + 구체 명령어. Paste 검증 시나리오에 TSV 컬럼 인덱스 매핑 명시 (L277). Phase 5 final pre-release gate에 번들+콜드스타트+RSS 3개 동시 측정. |

**5/5 PASS. 0 FAIL.**

---

## 4. Acceptance Criteria Coverage Matrix (rev2)

| # | Spec Acceptance Criterion | Plan Phase | Verification | Rev1 | Rev2 |
|---|--------------------------|------------|-------------|------|------|
| 1 | .app bundle <= 15MB | Phase 0-7 | Per-phase measurement gates (L108,169,278,314,351,390,412) | COVERED | **COVERED+** (per-phase tracking) |
| 2 | First launch empty screen | Phase 4 | 작업 6, placeholder (L305-306) | COVERED | COVERED |
| 3 | Hero: current balance (SF Pro semibold) | Phase 4 | BalanceDisplay.tsx (L297) | COVERED | COVERED |
| 4 | Hero: equity curve (area fill) | Phase 4 | EquityCurve.tsx (L298-303) | COVERED | COVERED |
| 5 | Hero: goal line ($500K @ 2028-12) | Phase 4 | ReferenceLine (L300) | COVERED | COVERED |
| 6 | Hero: cumulative return % (continuous) | Phase 4 | CumulativeReturn.tsx (L304) | COVERED | COVERED |
| 7 | Grid = spreadsheet-like (9 columns) | Phase 3 | TradingGrid.tsx 컬럼 정의 (L255-257) | COVERED | COVERED |
| 8 | Excel paste -> TSV auto-parse | Phase 3 | paste-parser.ts (L258-263) + Phase 3.0 spike (L209-236) | COVERED | **COVERED+** (spike gate 추가) |
| 9 | Computed fields auto-calculate | Phase 2 | computeTradingDays (L183-190) | COVERED | COVERED |
| 10 | Cumulative return formula | Phase 2 | 수식 명시 (L189) | COVERED | COVERED |
| 11 | Keyboard nav (Tab/Enter/Cmd+C/V/Z) | Phase 3 | 작업 6,7,8 (L266-268) | COVERED | COVERED |
| 12 | Note cell multiline (Notion-like) | Phase 3 | NoteEditor.tsx (L264) | COVERED | COVERED |
| 13 | Light/dark auto-switch | Phase 5 | prefers-color-scheme (L337) | COVERED | COVERED |
| 14 | macOS vibrancy sidebar | Phase 5 | windowEffects: ["sidebar"] (L338) | COVERED | **COVERED+** (decorum 배제 명시) |
| 15 | Code signing + notarization | Phase 7 | xcrun notarytool (L408) | COVERED | COVERED |
| 16 | GitHub Releases auto-update | Phase 6 | ADR-006 (L601-623), v0.1.0->v0.1.1 검증 (L388) | COVERED | **COVERED+** (ADR-006 추가) |
| 17 | Excel 2026-04/05 migration <= 5min | Phase 8 | 사용자 가이드 5단계 (L431-435) | COVERED | COVERED |
| 18 | SQLite at Application Support/tradelog/ | Phase 1 | DB 경로 (L147), 검증 (L167) | COVERED | COVERED |
| 19 | RSS memory <= 200MB | Phase 5, 7 | `top -pid $(pgrep tradelog) -l 5 \| grep RSS` (L353, L414) | **WEAK** | **COVERED** (tooling specified) |
| 20 | Cold start <= 1.5s | Phase 5, 7 | `hyperfine --warmup 3 'open -gj ...'` (L352, L413) | **WEAK** | **COVERED** (tooling specified) |

**Coverage: 20/20. Rev1 대비 +2 (weak -> covered), +5 (covered -> covered+).**

---

## 5. Optional Items Classification Confirm

| # | Item | Source | Classification | Rationale |
|---|------|--------|----------------|-----------|
| O-1 | ADR-005 Rust KST date 생성 가이드 (chrono::FixedOffset) 부재 | Architect rev2 | **Follow-up OK** | Phase 1 commands.rs는 프론트엔드에서 trade_date를 받아 저장만 함. Rust가 자체 생성할 케이스가 v1에 없음. 만약 필요 시 executor가 `chrono` crate 추가하면 됨. Plan 수정 불필요. |
| O-2 | Phase 5 fallback 3개 시간 추정 미명시 | Architect rev2 | **Follow-up OK** | (a)→(b)→(c) 순서가 암묵적으로 비용 순. Phase 5에 도달해야 실제 번들 상태를 알 수 있으므로 사전 시간 추정은 정밀도가 낮음. Spike에서 자연 측정. |
| O-3 | Phase 3.0 spike fallback PoC 시간이 timeline에 독립 행으로 없음 | Architect rev2 | **Follow-up OK** | Line 705 ("최악 케이스 ~42시간")에 이미 흡수. 별도 행은 formatting 수준 보완. Plan 수정 비용 대비 가치 낮음. |

**3/3 follow-up 분류 적정.**

---

## 6. ADR Completeness Check

| ADR | Subject | Rev1 | Rev2 | Status |
|-----|---------|------|------|--------|
| ADR-001 | React 18 | Present | Present (L466-485) | Complete |
| ADR-002 | react-data-grid (spike 조건부) | Overstatement | **Corrected** (L489-518). "paste 내장" → "onPaste 서피스 위 커스텀 handler". Spike gate + fallback 포함. | Complete |
| ADR-003 | Recharts | Present | Present (L522-540) | Complete |
| ADR-004 | rusqlite (bundled) + v2 진화 경로 | Incomplete (v2 path 없음) | **Expanded** (L544-569). v2 trade table sketch, daily snapshot 유지, 0003_v2_trades.sql. | Complete |
| ADR-005 | Timezone 저장 정책 | **Missing** | **New** (L573-597). trade_date=KST, timestamps=UTC, v1.5 sync 호환. | Complete |
| ADR-006 | Auto-Update 인프라 | **Missing** | **New** (L601-623). Public repo, privkey in GH secrets, pubkey in tauri.conf.json. | Complete |

**6/6 ADR complete. Follow-up section은 각 ADR의 `Follow-ups:` 필드로 분리되어 있어 execution scope와 명확히 구분됨.**

---

## 7. Regression Check

Rev2에서 새로 도입된 내용이 기존 plan을 훼손하지 않는지 확인:

- Phase 3.0 삽입 → Phase 3 의존성에 "Phase 3.0 spike 통과" 전제 명시 (L241). Timeline에 30분 추가 반영 (L697). 문제 없음.
- TanStack Query 제거 (L265) → Phase 3 작업 5가 "Zustand로 로컬 상태 관리 + Tauri invoke로 직접 fetch/upsert"로 변경. Zustand만으로 충분한 scope (30-100 rows, 단일 사용자). ~30KB 번들 절약. 문제 없음.
- Measurement gates 추가 → 각 phase 검증 섹션에 `[Measurement Gate]` 라벨로 추가. 기존 기능 검증 항목은 유지. 문제 없음.
- ADR-005, ADR-006 추가 → 기존 ADR-001~004와 충돌 없음. 문제 없음.

**Regression 0건.**

---

## 8. Multi-Perspective Notes (rev2)

### Executor Perspective
- Plan rev2는 executor가 질문 없이 Phase 0부터 순차 진행 가능한 수준. 각 phase의 영향 파일, 작업, 의존성, 검증이 명확. Phase 3.0 spike gate가 30분 hard limit으로 의사결정 지연을 방지.
- 한 가지 주의점: Phase 3 작업 3의 paste-parser.ts에서 엑셀 B-J 전체 컬럼 복사 전제 (L277)가 명시되었으나, 엑셀 시트에 A열이 있는지 여부에 따라 인덱스가 달라질 수 있음. 이는 implementation detail이며 paste-parser.test.ts에서 커버될 것.

### Stakeholder Perspective
- 34.5시간 현실 추정 (최악 42시간)은 개인 프로젝트로 적절한 scope. Spec의 핵심 가치 제안 (자산곡선 hero + 엑셀 paste 마이그레이션)이 Phase 3-4에 집중.

### Skeptic Perspective
- RDG spike가 plan의 유일한 남은 high-uncertainty point이나, spike gate + 2개 fallback으로 risk가 관리됨. Worst case 42시간은 수용 가능.

---

## 9. Verdict Justification

**Why APPROVE:**
- 이전 ITERATE의 7개 필수 수정 사항 (Critical 2 + Architect blocker CR-1/CR-3/CR-6 + follow-up CR-2/CR-4/CR-5) 전부 plan 본문에 line-level로 반영됨
- Acceptance criteria 20/20 fully covered (rev1의 18/20 + 2 weak → 20/20)
- 5 dimension 전부 PASS 이상
- Non-Goals 위반 0
- 6개 ADR 모두 complete
- Regression 0건
- Optional 3건은 execution phase에서 자연 해소 가능한 수준

**Why not ITERATE:**
- 한 번 더 loop하여 O-1/O-2/O-3을 plan에 반영하는 것의 ROI가 낮음. 각각 "Rust chrono 가이드 한 줄", "fallback 시간 추정 3줄", "timeline 행 1줄" 수준의 보완이며, executor가 해당 phase에 도달했을 때 자연스럽게 처리할 수 있는 implementation detail.
- Iteration 2/5이며 plan 품질이 execution-ready. 추가 loop은 diminishing returns.

**Review mode:** THOROUGH throughout. No escalation to ADVERSARIAL — zero new Critical/Major findings. Plan author가 rev1 feedback을 정확히 반영.

---

## 10. Open Questions (unscored, execution phase에서 확인)

1. Phase 3.0 spike 실패 시 fallback PoC도 별도 시간이 필요한데, 이 시간이 Phase 3 본 작업 8시간에 포함되는지 별도인지 명확하지 않음 (=O-3). Worst case 42h에 흡수되어 있으므로 blocking 아님.
2. Spec line 57의 `react-aria-components` 대안이 plan에서 논의되지 않은 채 shadcn/ui가 선택됨. 의도적 생략으로 추정되나 executor가 Phase 5에서 참고할 수 있음.
3. Phase 3과 Phase 5의 interleaving — grid 컴포넌트가 unstyled 상태에서 개발되는 것은 workable하지만, executor가 Phase 3에서 최소한의 font/spacing을 적용하고 싶다면 globals.css의 font stack 설정만 Phase 3 시작 전에 끌어와도 됨.

---

*Ralplan summary row:*
- **Principle/Option Consistency:** Pass+ — 6 ADR이 5 Principle과 완전 정합. ADR-005가 spec 모순 명시 해소.
- **Alternatives Depth:** Pass+ — ADR-002 rationale 정정. Spike gate로 가설 검증 프로세스 내장.
- **Risk/Verification Rigor:** Pass+ — 6 CR 전부 통합. Per-phase measurement gate + 임계 초과 시 fallback. Worst case timeline 명시.
- **Deliberate Additions (if required):** N/A — not in deliberate mode.
