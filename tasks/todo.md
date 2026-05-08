# TradeLog — Findings & Backlog

## In progress (v0.1.10 release)

- [x] **Bug**: ⌘V triggered macOS "Allow paste from TradeLog" prompt every time.
      Fix: replaced `navigator.clipboard.readText/writeText` with
      `tauri-plugin-clipboard-manager` (native NSPasteboard, no prompt).
- [x] **Bug**: Pasting/typing a date that already belonged to another row
      silently merged the two rows. Root cause: `rename_or_upsert_trading_day`
      uses `INSERT ... ON CONFLICT(trade_date) DO UPDATE`, so the old row was
      DELETEd and the target row's data was overwritten on top of the
      conflict-target row. Fix: pre-flight conflict check in
      `TradingGrid.applyCellPaste` and `onRowsChange` — refuse with toast
      instead of merging.
- [x] **Feature**: Row-level copy/paste.
      ⌘⇧C → JSON-serialize the row (deposit / end_balance / withdrawal / note,
      tagged with `_kind: "tradelog_row_v1"`).
      ⌘⇧V → parse JSON, write the source's values onto the target row but
      keep the target's `trade_date` (avoids the same merge problem).
- [x] **Bug**: "전체" filter showed only the latest month's stats. Fix:
      `MonthlyStats` now aggregates across all `computed` rows when
      `monthFilter` is null, with label "전체 통계".

## Pending verification by user (after v0.1.10 ships)

- ⌘V no longer needs the macOS Paste-button popup
- Date copy onto another row no longer makes a row disappear
- ⌘⇧C / ⌘⇧V copies and pastes a whole row (date stays put)
- "전체" tab shows lifetime PnL / win-rate / avg

## Future feature backlog (v0.2+)

> Captured from previous user requests across the session.

### Quality of life
- [ ] CSV / Excel export 버튼 (사이드바 메뉴, 백업/세무용)
- [ ] Drawdown / max equity 표시 (자산곡선 위 historical max + 현재 drawdown%)
- [ ] Dark mode 수동 토글 (시스템 prefs 외 옵션)
- [ ] ⌘K 명령 팔레트
- [ ] 비고 텍스트 검색 + 일자 범위 필터
- [ ] 주말 스킵 (월요일 자동 점프)

### v2 영역
- [ ] 거래별 입력 모드 (티커/방향/PnL 단위 기록)
- [ ] AI 분석 — 비고/패턴 기반 weekly insight
- [ ] Cloudflare D1 / Supabase 동기화 (멀티 디바이스)

### 기술 부채
- [ ] `rename_or_upsert_trading_day` Rust 명령 자체에서 conflict 체크 후
      명시적 에러 반환 — 지금은 프런트가 가드하지만 backend 호출이 직접
      들어오면 여전히 무성 merge 위험 있음.
- [ ] 사용 가능하면 RDG `selectedRows` API로 row 선택 UI 노출 (현재는
      ⌘⇧C 단축키만 있고 시각적 행 선택은 없음).
- [ ] Apple Developer ID 등록 후 notarization 활성화 (현재는 Gatekeeper 경고
      뜸 — 본인 Mac은 한번 허용으로 끝남).

## Lessons captured

- `INSERT ... ON CONFLICT DO UPDATE` 는 PK 변경/rename 시나리오에서 위험.
  trade_date 처럼 PK가 사용자 입력으로 바뀌는 경우엔 항상 "현재 다른 행이
  같은 PK를 쓰고 있는지" 사전 체크해야 함. SQL 한 줄이 두 row를 한 row로
  무성 머지함.
- `navigator.clipboard.readText()` 는 macOS 14+ 에서 webview마다 paste
  permission 팝업을 띄움. Tauri 앱은 native clipboard 플러그인을 쓰면
  팝업 없이 동작.
- RDG 7 beta의 `onRowsChange` 콜백은 이미 적용된 상태를 주기 때문에 PK
  변경(rename) 감지가 까다로움. 현재는 row index 기반 prevDateByIndex
  ref + rows[idx] 비교로 처리 중.
