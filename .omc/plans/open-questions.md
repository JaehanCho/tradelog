# Open Questions -- TradeLog v1

## ralplan-tradelog-v1 -- 2026-05-06 (rev2)

### 결정 완료 (Plan rev2에서 해결)
- [x] 프론트엔드 React vs Svelte -- React 18 채택 (grid/chart 생태계, LINE 익숙도)
- [x] Grid 라이브러리 -- react-data-grid 채택 (Phase 3.0 spike 조건부). AG Grid paste는 Enterprise 전용, react-spreadsheet 외부 paste 미지원. Spike 실패 시 TanStack Table 또는 glide-data-grid fallback.
- [x] Chart 라이브러리 -- Recharts 채택 (v1 차트 1개에 적합, v1.5/v2에서 Visx 재평가)
- [x] Rust SQLite 라이브러리 -- rusqlite (bundled) + rusqlite_migration 채택 (시스템 의존성 0, 동기 API, migration runner 내장)
- [x] Timezone 저장 정책 -- trade_date는 KST calendar date (YYYY-MM-DD), created_at/updated_at은 UTC. ADR-005 참조.
- [x] Vibrancy 구현 -- Tauri v2 windowEffects 사용. tauri-plugin-decorum 불사용 (Apple HIG 충돌 회피).
- [x] Auto-update 인프라 -- Public GitHub repo 권장, signing key privkey는 GitHub Actions secrets + 로컬 백업. ADR-006 참조.
- [x] 상태 관리 -- Zustand 단독 사용. TanStack Query 불사용 (로컬 SQLite에서 캐시 무효화 이점 없음, ~30KB 절약).

### v1 출시 직전 결정 필요
- [ ] App 아이콘/로고 디자인 -- Phase 7 직전에 결정. 임시 아이콘으로 개발 진행
- [ ] Apple Developer 계정 가입 시점 ($99/yr) -- Phase 7 시작 시 사용자 직접 가입. 코드사이닝+notarization에 필수
- [ ] 첫 실행 onboarding 화면 -- 3-step intro vs skip-able vs 없음. v1 최소 요구사항은 아님 (빈 화면 placeholder로 충분)
- [ ] 데이터 백업/복원 UX -- v1은 SQLite 파일 경로 안내로 충분? Export 버튼 추가 여부는 v1.5 후보
- [ ] GitHub repo public vs private -- 권장 public (ADR-006). 사용자가 private 선호 시 Phase 7에서 전환 (+2시간)

### Executor 주의사항 (Critic/Architect Review에서 발췌)
- [ ] paste-parser.ts의 TSV 컬럼 인덱스 -- 엑셀 B-J 전체 컬럼 복사 전제. 인덱스: [0]=날짜, [1]=입금, [2]=시작금액(무시), [3]=최종금액, [4]=일일수익(무시), [5]=일별수익률(무시), [6]=누적수익률(무시), [7]=출금, [8]=비고. 사용자가 부분 선택 시 인덱스 달라짐 -- paste-parser에서 두 패턴 모두 처리 필요할 수 있음.
- [ ] Phase 3/4에서 이미 UI 컴포넌트(Button, Input 등)가 필요할 수 있으나 shadcn/ui 초기화는 Phase 5 -- Phase 0에서 Tailwind만 사전 설치하고, Phase 3/4는 기본 HTML로 구현 후 Phase 5에서 리스타일링.
- [ ] Floating-point 정밀도 -- Phase 2 계산에서 JS Number USD 금액 부동소수점 오차. 개인 journal에서 치명적이지 않으나 display에서 toFixed(2) 적용 권장.
- [ ] start_balance 첫 row 엣지케이스 -- 테스트에서 "first row with deposit=10000, no previous row -> start_balance=10000" 명시 검증 필요.
- [ ] Recharts ReferenceLine 미래 날짜 -- 목표선 ($500K @ 2028-12-31) 표시를 위해 X축 domain 확장: `<XAxis domain={['dataMin', '2028-12-31']}>`
- [ ] 한국어 날짜 형식 매핑 -- "1일", "2일" 등을 ISO date로 변환 시 정규식 + 현재 선택 월 기준으로 단순 처리 (로케일 라이브러리 불사용, 의존성 절약)
