export type Locale = "ko" | "en";

export type Messages = {
  sidebar: {
    monthLabel: string;
    all: string;
    noData: string;
    updateCheck: string;
    updateCheckTitle: string;
    sectionsLabel: string;
    sectionTrading: string;
    sectionDefi: string;
    sectionStocks: string;
    sectionWisdom: string;
  };
  drawer: {
    closeAria: string;
    tradeNoteLabel: string;
    tradeNotePlaceholder: string;
    marketNoteLabel: string;
    marketNotePlaceholder: string;
    pnlLabel: string;
    cumReturnLabel: string;
    endBalanceLabel: string;
    openAria: string;
  };
  defi: {
    title: string;
    addPosition: string;
    activeHeading: string;
    closedHeading: string;
    emptyTitle: string;
    emptyMsg: string;
    cardPrincipal: string;
    cardCurrent: string;
    cardApr: string;
    cardAge: (days: number) => string;
    cardClosed: string;
    cardNoSnapshot: string;
    drawerNew: string;
    drawerEdit: string;
    fieldProtocol: string;
    fieldChain: string;
    fieldAsset: string;
    fieldPrincipal: string;
    fieldOpened: string;
    fieldClosed: string;
    fieldNote: string;
    snapshotsHeading: string;
    addSnapshot: string;
    snapshotDate: string;
    snapshotValue: string;
    snapshotFees: string;
    snapshotNote: string;
    deletePosition: string;
    deletePositionConfirm: string;
    save: string;
    cancel: string;
  };
  totalAssets: {
    label: string;
    sectorTrading: string;
    sectorDefi: string;
  };
  journal: {
    title: string;
    empty: string;
    tradeNoteTag: string;
    marketNoteTag: string;
    showAll: (n: number) => string;
    showLess: string;
  };
  wisdom: {
    title: string;
    newButton: string;
    searchPlaceholder: string;
    pinFilterLabel: string;
    allTags: string;
    pinAria: string;
    deleteAria: string;
    drawerNew: string;
    drawerEdit: string;
    bodyLabel: string;
    bodyPlaceholder: string;
    sourceLabel: string;
    sourcePlaceholder: string;
    tagsLabel: string;
    tagsHint: string;
    save: string;
    cancel: string;
    delete: string;
    deleteConfirm: string;
    emptyTitle: string;
    emptyMsg: string;
    noMatches: string;
  };
  stocks: {
    boardPlaceholder: string;
    hero: {
      totalAssets: string;
      cumulativeProfit: string;
      goal: string;
      achievement: (pct: string) => string;
      lastRefreshed: (rel: string) => string;
      refresh: string;
      fxRate: (rate: string) => string;
      refreshFailed: string;
      goalEdit: string;
    };
    holdings: {
      title: string;
      empty: string;
      emptyMsg: string;
      addCta: string;
      col: {
        ticker: string;
        qty: string;
        avgCost: string;
        currentPrice: string;
        marketValue: string;
        pnl: string;
        weight: string;
      };
      drawer: {
        costBasis: string;
        dayChange: string;
        marketValue: string;
        notes: string;
        addNote: string;
        moveToWatch: string;
        delete: string;
        edit: string;
        deleteConfirm: string;
      };
      form: {
        titleNew: string;
        titleEdit: string;
        symbol: string;
        symbolHint: string;
        market: string;
        marketKospi: string;
        marketKosdaq: string;
        marketUs: string;
        displayName: string;
        displayNameHint: string;
        qty: string;
        avgCostUsd: string;
        avgCostKrw: string;
        save: string;
        cancel: string;
      };
    };
    watchlist: {
      title: string;
      empty: string;
      addCta: string;
      drawer: {
        moveToHoldings: string;
        delete: string;
        deleteConfirm: string;
      };
      form: {
        titleNew: string;
        symbol: string;
        market: string;
        displayName: string;
        save: string;
        cancel: string;
      };
    };
    notes: {
      title: string;
      empty: string;
      emptyMsg: string;
      addCta: string;
      filterAll: string;
      filterLabel: string;
      moreToggle: string;
      lessToggle: string;
      deleteConfirm: string;
      form: {
        titleNew: string;
        titleEdit: string;
        ticker: string;
        tickerPlaceholder: string;
        date: string;
        body: string;
        bodyPlaceholder: string;
        save: string;
        cancel: string;
        delete: string;
      };
    };
    allocation: {
      title: string;
      totalCount: (n: number) => string;
      other: string;
    };
    goal: {
      title: string;
      balanceLabel: string;
      dateLabel: string;
      save: string;
      cancel: string;
    };
    markets: {
      kospi: string;
      kosdaq: string;
      us: string;
    };
  };
  grid: {
    headerDate: string;
    headerDeposit: string;
    headerStart: string;
    headerEnd: string;
    headerDailyPnl: string;
    headerDailyReturn: string;
    headerCumReturn: string;
    headerWithdrawal: string;
    headerNote: string;
    deleteRowTitle: string;
    addDay: string;
    addFirstDay: string;
    filterClear: string;
    filteringPrefix: string;
    emptyTitleAll: string;
    emptyTitleMonth: (m: string) => string;
    emptyMsgPart1: string;
    emptyMsgPart2Before: string;
    emptyMsgStart: string;
    emptyMsgPart2Mid: string;
    emptyMsgDeposit: string;
    emptyMsgPart2After: string;
    hint: {
      ariaLabel: string;
      copyCell: string;
      copyRow: string;
      doubleClick: string;
      editCell: string;
      undo: string;
      deleteRow: string;
    };
  };
  toast: {
    overwrote: (date: string) => string;
    notEditable: string;
    clipboardReadFail: string;
    copied: string;
    copyFail: string;
    rowCopied: string;
    noRowData: string;
    invalidRowDate: string;
    rowDuplicated: (date: string) => string;
    rowDuplicatedShifted: (src: string, date: string) => string;
    invalidDateFormat: string;
    numbersOnly: string;
    pasted: string;
  };
  calendar: {
    weekdays: readonly string[];
    prevMonth: string;
    nextMonth: string;
    monthFilterTitle: string;
  };
  monthStats: {
    statsAll: string;
    statsMonth: (m: string) => string;
    tradingDays: (n: number) => string;
    totalPnl: string;
    vsStart: string;
    winRate: string;
    wins: (n: number) => string;
    losses: (n: number) => string;
    avgDaily: string;
    perDay: string;
  };
  monthlyBars: {
    title: string;
    subtitle: (n: number) => string;
    empty: string;
  };
  monthPicker: {
    title: string;
    openLabel: string;
    cellTooltip: (ym: string, count: number) => string;
    noData: string;
    hint: string;
  };
  goal: {
    label: (balance: string, date: string) => string;
    edit: string;
    achieved: (pct: string) => string;
    remaining: (amount: string) => string;
    title: string;
    targetBalance: string;
    targetDate: string;
    cancel: string;
    save: string;
  };
  equity: {
    empty: string;
    goalLabel: (balance: string, ym: string) => string;
    tooltipLabel: string;
    tooltipReturnLabel: string;
  };
  balance: {
    label: string;
  };
  cumulativeReturn: {
    label: string;
  };
  update: {
    upToDate: string;
    available: (version: string) => string;
    later: string;
    installNow: string;
    installing: string;
    checkFailed: string;
    retry: string;
    close: string;
    installFailed: (msg: string) => string;
  };
  note: {
    moreLines: (n: number) => string;
  };
  language: {
    toggleAriaLabel: string;
  };
};

const ko: Messages = {
  sidebar: {
    monthLabel: "월별",
    all: "전체",
    noData: "데이터 없음",
    updateCheck: "업데이트 확인",
    updateCheckTitle: "GitHub Releases에서 새 버전 확인",
    sectionsLabel: "섹터",
    sectionTrading: "거래",
    sectionDefi: "DeFi",
    sectionStocks: "주식",
    sectionWisdom: "팁",
  },
  drawer: {
    closeAria: "닫기",
    tradeNoteLabel: "거래 비고",
    tradeNotePlaceholder: "이 날의 거래 메모 (셀에 기록되는 내용과 동일).",
    marketNoteLabel: "시장 메모",
    marketNotePlaceholder:
      "오늘의 시장 흐름, 뉴스, 가설, 전략 등 자유롭게 기록.",
    pnlLabel: "일일수익",
    cumReturnLabel: "누적수익률",
    endBalanceLabel: "최종금액",
    openAria: "이 날 상세 보기",
  },
  defi: {
    title: "DeFi 포지션",
    addPosition: "+ 포지션 추가",
    activeHeading: "운용 중",
    closedHeading: "종료된 포지션",
    emptyTitle: "아직 등록된 포지션이 없어요",
    emptyMsg:
      "Aave, Curve, GMX 같이 자금을 굴리는 곳을 등록하고 주기적으로 가치를 기록하세요.",
    cardPrincipal: "원금",
    cardCurrent: "현재가치",
    cardApr: "APR (근사)",
    cardAge: (days) => `${days}일째`,
    cardClosed: "종료",
    cardNoSnapshot: "스냅샷 없음 — 추가하기",
    drawerNew: "새 포지션",
    drawerEdit: "포지션 편집",
    fieldProtocol: "프로토콜",
    fieldChain: "체인",
    fieldAsset: "자산 / 페어",
    fieldPrincipal: "원금 (USD)",
    fieldOpened: "오픈 날짜",
    fieldClosed: "종료 날짜 (선택)",
    fieldNote: "메모",
    snapshotsHeading: "스냅샷",
    addSnapshot: "+ 스냅샷",
    snapshotDate: "날짜",
    snapshotValue: "현재 가치 (USD)",
    snapshotFees: "누적 수수료/리워드 (USD)",
    snapshotNote: "메모",
    deletePosition: "포지션 삭제",
    deletePositionConfirm: "이 포지션을 삭제할까요? 스냅샷도 함께 삭제됩니다.",
    save: "저장",
    cancel: "취소",
  },
  totalAssets: {
    label: "통합 자산",
    sectorTrading: "거래",
    sectorDefi: "DeFi",
  },
  journal: {
    title: "최근 일지",
    empty: "메모가 있는 날이 아직 없어요. 행 우측 ▶ 버튼으로 그날의 시장 메모를 적어보세요.",
    tradeNoteTag: "거래",
    marketNoteTag: "시장",
    showAll: (n) => `전체 ${n}개 보기`,
    showLess: "접기",
  },
  wisdom: {
    title: "트레이딩 팁",
    newButton: "+ 새로 추가",
    searchPlaceholder: "검색…",
    pinFilterLabel: "고정만 보기",
    allTags: "전체 태그",
    pinAria: "고정",
    deleteAria: "삭제",
    drawerNew: "새 팁",
    drawerEdit: "팁 편집",
    bodyLabel: "본문",
    bodyPlaceholder: "꿀팁, 인사이트, 명언… 자유롭게 적어보세요.",
    sourceLabel: "출처",
    sourcePlaceholder: "예: Buffett, 책 제목, URL",
    tagsLabel: "태그",
    tagsHint: "콤마로 구분 — 예: 심리, 리스크, 패턴",
    save: "저장",
    cancel: "취소",
    delete: "삭제",
    deleteConfirm: "이 팁을 삭제할까요?",
    emptyTitle: "아직 등록된 팁이 없어요",
    emptyMsg: "+ 새로 추가 버튼을 눌러 첫 팁을 적어보세요. ⌘N 단축키도 됩니다.",
    noMatches: "검색 결과가 없어요.",
  },
  stocks: {
    boardPlaceholder: "주식 탭 — 구성 중이에요. 곧 보유·관심·메모가 채워집니다.",
    hero: {
      totalAssets: "총 자산",
      cumulativeProfit: "누적 수익",
      goal: "목표",
      achievement: (pct) => `${pct}% 달성`,
      lastRefreshed: (rel) => `마지막 갱신 ${rel}`,
      refresh: "새로고침",
      fxRate: (rate) => `₩${rate}/$`,
      refreshFailed: "시세 갱신 실패 — 캐시된 값 사용 중",
      goalEdit: "목표 편집",
    },
    holdings: {
      title: "보유 종목",
      empty: "아직 보유한 종목이 없어요",
      emptyMsg: "+ 보유 추가로 첫 종목을 등록해보세요.",
      addCta: "+ 보유 추가",
      col: {
        ticker: "종목",
        qty: "수량",
        avgCost: "평단",
        currentPrice: "현재가",
        marketValue: "평가금액",
        pnl: "손익",
        weight: "비중",
      },
      drawer: {
        costBasis: "투자원금",
        dayChange: "일간 변동",
        marketValue: "평가금액",
        notes: "메모",
        addNote: "+ 메모 추가",
        moveToWatch: "관심으로 이동",
        delete: "삭제",
        edit: "수정",
        deleteConfirm: "이 보유 종목을 삭제할까요? 메모는 그대로 남습니다.",
      },
      form: {
        titleNew: "보유 종목 추가",
        titleEdit: "보유 종목 수정",
        symbol: "종목 코드",
        symbolHint: "예: AAPL, 005930",
        market: "시장",
        marketKospi: "KOSPI",
        marketKosdaq: "KOSDAQ",
        marketUs: "US",
        displayName: "표시 이름",
        displayNameHint: "비워두면 자동으로 채워져요",
        qty: "수량",
        avgCostUsd: "평단 (USD)",
        avgCostKrw: "평단 (KRW)",
        save: "저장",
        cancel: "취소",
      },
    },
    watchlist: {
      title: "관심 종목",
      empty: "아직 관심 종목이 없어요",
      addCta: "+ 관심 추가",
      drawer: {
        moveToHoldings: "보유로 이동",
        delete: "삭제",
        deleteConfirm: "이 관심 종목을 삭제할까요?",
      },
      form: {
        titleNew: "관심 종목 추가",
        symbol: "종목 코드",
        market: "시장",
        displayName: "표시 이름",
        save: "저장",
        cancel: "취소",
      },
    },
    notes: {
      title: "종목 메모",
      empty: "아직 작성된 메모가 없어요",
      emptyMsg: "보유·관심 종목에 대한 생각을 자유롭게 적어보세요.",
      addCta: "+ 메모 추가",
      filterAll: "전체 종목",
      filterLabel: "종목",
      moreToggle: "더 보기",
      lessToggle: "접기",
      deleteConfirm: "이 메모를 삭제할까요?",
      form: {
        titleNew: "새 메모",
        titleEdit: "메모 수정",
        ticker: "종목",
        tickerPlaceholder: "보유/관심 종목에서 선택",
        date: "날짜",
        body: "내용",
        bodyPlaceholder: "이 종목에 대한 생각, 뉴스, 분석 등 자유롭게…",
        save: "저장",
        cancel: "취소",
        delete: "삭제",
      },
    },
    allocation: {
      title: "비중",
      totalCount: (n) => `총 ${n}개 종목`,
      other: "기타",
    },
    goal: {
      title: "주식 목표",
      balanceLabel: "목표 자산 (USD)",
      dateLabel: "목표 날짜 (선택)",
      save: "저장",
      cancel: "취소",
    },
    markets: {
      kospi: "KOSPI",
      kosdaq: "KOSDAQ",
      us: "US",
    },
  },
  grid: {
    headerDate: "날짜",
    headerDeposit: "입금",
    headerStart: "시작금액",
    headerEnd: "최종금액",
    headerDailyPnl: "일일수익",
    headerDailyReturn: "일별수익률",
    headerCumReturn: "누적수익률",
    headerWithdrawal: "출금",
    headerNote: "비고",
    deleteRowTitle: "이 거래일 삭제",
    addDay: "+ 거래일 추가",
    addFirstDay: "+ 첫 거래일 추가",
    filterClear: "전체 보기",
    filteringPrefix: " 만 보는 중",
    emptyTitleAll: "아직 거래 데이터가 없어요",
    emptyTitleMonth: (m) => `${m} 에 데이터가 없어요`,
    emptyMsgPart1: '"+ 첫 거래일 추가"로 행을 만들고, 셀을 더블클릭해서 입력해.',
    emptyMsgPart2Before: "첫 거래일에는 ",
    emptyMsgStart: "시작금액",
    emptyMsgPart2Mid: " 또는 ",
    emptyMsgDeposit: "입금",
    emptyMsgPart2After: " 칸에 시작 자본금을 넣으면 돼.",
    hint: {
      ariaLabel: "단축키 도움말",
      copyCell: "셀 단위 복사/붙여넣기",
      copyRow: "행 단위 복사/붙여넣기",
      doubleClick: "더블클릭",
      editCell: "셀 편집",
      undo: "실행 취소",
      deleteRow: "행 삭제 (행 끝)",
    },
  },
  toast: {
    overwrote: (date) => `${date} 행 덮어씀 (⌘Z로 복구)`,
    notEditable: "이 컬럼은 자동 계산되어서 paste 불가",
    clipboardReadFail: "클립보드 읽기 실패",
    copied: "복사됨",
    copyFail: "복사 실패",
    rowCopied: "행 전체 복사됨",
    noRowData: "행 데이터가 없어. ⌘⇧C로 복사하고 다시 시도해.",
    invalidRowDate: "복사된 행의 날짜가 이상함",
    rowDuplicated: (date) => `행 복사 → ${date}`,
    rowDuplicatedShifted: (src, date) =>
      `${src} 자리 차서 → ${date} 에 복사`,
    invalidDateFormat: "날짜 형식은 YYYY-MM-DD",
    numbersOnly: "숫자만 paste 가능",
    pasted: "붙여넣음",
  },
  calendar: {
    weekdays: ["일", "월", "화", "수", "목", "금", "토"],
    prevMonth: "이전 달",
    nextMonth: "다음 달",
    monthFilterTitle: "클릭해서 grid를 이 월로 필터",
  },
  monthStats: {
    statsAll: "전체 통계",
    statsMonth: (m) => `${m} 통계`,
    tradingDays: (n) => `${n} 거래일`,
    totalPnl: "총 PnL",
    vsStart: "대비 시작잔고",
    winRate: "승률",
    wins: (n) => `${n}승`,
    losses: (n) => `${n}패`,
    avgDaily: "평균 일수익",
    perDay: "/ 거래일",
  },
  monthlyBars: {
    title: "월별 PnL",
    subtitle: (n) => `최근 ${n}개월`,
    empty: "아직 월별 데이터가 없어요",
  },
  monthPicker: {
    title: "월별 필터",
    openLabel: "월 선택",
    cellTooltip: (ym, count) => `${ym} · ${count}거래일`,
    noData: "데이터 없음",
    hint: "↑↓←→ 이동 · Enter 선택 · Esc 닫기",
  },
  goal: {
    label: (balance, date) => `목표 ${balance} @ ${date}`,
    edit: "수정",
    achieved: (pct) => `${pct}% 달성`,
    remaining: (amount) => `${amount} 남음`,
    title: "목표 설정",
    targetBalance: "목표 잔액 (USD)",
    targetDate: "목표 날짜",
    cancel: "취소",
    save: "저장",
  },
  equity: {
    empty: "데이터를 입력해주세요",
    goalLabel: (balance, ym) => `목표 ${balance} @ ${ym}`,
    tooltipLabel: "누적 금액",
    tooltipReturnLabel: "수익률",
  },
  balance: {
    label: "현재 잔액",
  },
  cumulativeReturn: {
    label: "누적 수익률",
  },
  update: {
    upToDate: "최신 버전을 사용 중이에요",
    available: (version) => `새 버전 ${version} 사용 가능`,
    later: "나중에",
    installNow: "지금 업데이트",
    installing: "설치 중…",
    checkFailed: "업데이트 확인 실패",
    retry: "다시 시도",
    close: "닫기",
    installFailed: (msg) => `설치 실패: ${msg}`,
  },
  note: {
    moreLines: (n) => `${n}줄 더`,
  },
  language: {
    toggleAriaLabel: "언어",
  },
};

const en: Messages = {
  sidebar: {
    monthLabel: "Month",
    all: "All",
    noData: "No data",
    updateCheck: "Check for updates",
    updateCheckTitle: "Check GitHub Releases for a new version",
    sectionsLabel: "Sections",
    sectionTrading: "Trading",
    sectionDefi: "DeFi",
    sectionStocks: "Stocks",
    sectionWisdom: "Tips",
  },
  drawer: {
    closeAria: "Close",
    tradeNoteLabel: "Trade note",
    tradeNotePlaceholder: "Notes about this day's trades (same as the cell).",
    marketNoteLabel: "Market note",
    marketNotePlaceholder:
      "Free-form thoughts on today's market — news, hypotheses, strategy.",
    pnlLabel: "Daily PnL",
    cumReturnLabel: "Cumulative return",
    endBalanceLabel: "End balance",
    openAria: "Open day details",
  },
  defi: {
    title: "DeFi Positions",
    addPosition: "+ Add position",
    activeHeading: "Active",
    closedHeading: "Closed",
    emptyTitle: "No positions yet",
    emptyMsg:
      "Track positions in Aave, Curve, GMX, etc. and record their value over time.",
    cardPrincipal: "Principal",
    cardCurrent: "Current",
    cardApr: "APR (approx)",
    cardAge: (days) => `${days}d ago`,
    cardClosed: "Closed",
    cardNoSnapshot: "No snapshot — add one",
    drawerNew: "New position",
    drawerEdit: "Edit position",
    fieldProtocol: "Protocol",
    fieldChain: "Chain",
    fieldAsset: "Asset / Pair",
    fieldPrincipal: "Principal (USD)",
    fieldOpened: "Opened",
    fieldClosed: "Closed (optional)",
    fieldNote: "Note",
    snapshotsHeading: "Snapshots",
    addSnapshot: "+ Snapshot",
    snapshotDate: "Date",
    snapshotValue: "Value (USD)",
    snapshotFees: "Cumulative fees/rewards (USD)",
    snapshotNote: "Note",
    deletePosition: "Delete position",
    deletePositionConfirm: "Delete this position? Its snapshots will be removed too.",
    save: "Save",
    cancel: "Cancel",
  },
  totalAssets: {
    label: "Total assets",
    sectorTrading: "Trading",
    sectorDefi: "DeFi",
  },
  journal: {
    title: "Recent journal",
    empty: "No notes yet. Click the ▶ on a row to capture today's market take.",
    tradeNoteTag: "Trade",
    marketNoteTag: "Market",
    showAll: (n) => `Show all ${n}`,
    showLess: "Show less",
  },
  wisdom: {
    title: "Trading Tips",
    newButton: "+ New",
    searchPlaceholder: "Search…",
    pinFilterLabel: "Pinned only",
    allTags: "All tags",
    pinAria: "Pin",
    deleteAria: "Delete",
    drawerNew: "New tip",
    drawerEdit: "Edit tip",
    bodyLabel: "Body",
    bodyPlaceholder: "A tip, a quote, a personal insight — write freely.",
    sourceLabel: "Source",
    sourcePlaceholder: "e.g. Buffett, book title, URL",
    tagsLabel: "Tags",
    tagsHint: "Comma-separated — e.g. psychology, risk, pattern",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    deleteConfirm: "Delete this tip?",
    emptyTitle: "No tips yet",
    emptyMsg: "Press + New to add your first tip. ⌘N also works.",
    noMatches: "No matches.",
  },
  stocks: {
    boardPlaceholder:
      "Stocks tab — under construction. Holdings, watchlist, and notes will land soon.",
    hero: {
      totalAssets: "Total assets",
      cumulativeProfit: "Cumulative profit",
      goal: "Goal",
      achievement: (pct) => `${pct}% reached`,
      lastRefreshed: (rel) => `Last refreshed ${rel}`,
      refresh: "Refresh",
      fxRate: (rate) => `₩${rate}/$`,
      refreshFailed: "Quote refresh failed — showing cached values",
      goalEdit: "Edit goal",
    },
    holdings: {
      title: "Holdings",
      empty: "No holdings yet",
      emptyMsg: "Press + Add holding to register your first ticker.",
      addCta: "+ Add holding",
      col: {
        ticker: "Ticker",
        qty: "Qty",
        avgCost: "Avg cost",
        currentPrice: "Current",
        marketValue: "Market value",
        pnl: "P&L",
        weight: "Weight",
      },
      drawer: {
        costBasis: "Cost basis",
        dayChange: "Day change",
        marketValue: "Market value",
        notes: "Notes",
        addNote: "+ Add note",
        moveToWatch: "Move to watchlist",
        delete: "Delete",
        edit: "Edit",
        deleteConfirm: "Delete this holding? Notes will remain.",
      },
      form: {
        titleNew: "Add holding",
        titleEdit: "Edit holding",
        symbol: "Ticker",
        symbolHint: "e.g. AAPL, 005930",
        market: "Market",
        marketKospi: "KOSPI",
        marketKosdaq: "KOSDAQ",
        marketUs: "US",
        displayName: "Display name",
        displayNameHint: "Leave blank to auto-fill",
        qty: "Quantity",
        avgCostUsd: "Avg cost (USD)",
        avgCostKrw: "Avg cost (KRW)",
        save: "Save",
        cancel: "Cancel",
      },
    },
    watchlist: {
      title: "Watchlist",
      empty: "Nothing on your watchlist yet",
      addCta: "+ Add to watchlist",
      drawer: {
        moveToHoldings: "Move to holdings",
        delete: "Delete",
        deleteConfirm: "Remove from watchlist?",
      },
      form: {
        titleNew: "Add to watchlist",
        symbol: "Ticker",
        market: "Market",
        displayName: "Display name",
        save: "Save",
        cancel: "Cancel",
      },
    },
    notes: {
      title: "Ticker notes",
      empty: "No notes yet",
      emptyMsg: "Jot down thoughts about your holdings or watchlist.",
      addCta: "+ Add note",
      filterAll: "All tickers",
      filterLabel: "Ticker",
      moreToggle: "Show more",
      lessToggle: "Show less",
      deleteConfirm: "Delete this note?",
      form: {
        titleNew: "New note",
        titleEdit: "Edit note",
        ticker: "Ticker",
        tickerPlaceholder: "Pick a ticker from holdings or watchlist",
        date: "Date",
        body: "Body",
        bodyPlaceholder: "Thoughts, news, analysis about this ticker…",
        save: "Save",
        cancel: "Cancel",
        delete: "Delete",
      },
    },
    allocation: {
      title: "Allocation",
      totalCount: (n) => `${n} ticker${n === 1 ? "" : "s"}`,
      other: "Other",
    },
    goal: {
      title: "Stocks goal",
      balanceLabel: "Target balance (USD)",
      dateLabel: "Target date (optional)",
      save: "Save",
      cancel: "Cancel",
    },
    markets: {
      kospi: "KOSPI",
      kosdaq: "KOSDAQ",
      us: "US",
    },
  },
  grid: {
    headerDate: "Date",
    headerDeposit: "Deposit",
    headerStart: "Start",
    headerEnd: "End",
    headerDailyPnl: "Daily PnL",
    headerDailyReturn: "Daily %",
    headerCumReturn: "Cum. %",
    headerWithdrawal: "Withdraw",
    headerNote: "Note",
    deleteRowTitle: "Delete this day",
    addDay: "+ Add day",
    addFirstDay: "+ Add first day",
    filterClear: "See all",
    filteringPrefix: " only",
    emptyTitleAll: "No trading data yet",
    emptyTitleMonth: (m) => `No data for ${m}`,
    emptyMsgPart1:
      'Click "+ Add first day", then double-click any cell to edit.',
    emptyMsgPart2Before: "On day one, drop your starting capital into ",
    emptyMsgStart: "Start",
    emptyMsgPart2Mid: " or ",
    emptyMsgDeposit: "Deposit",
    emptyMsgPart2After: ".",
    hint: {
      ariaLabel: "Keyboard shortcuts",
      copyCell: "Copy/paste a cell",
      copyRow: "Copy/paste a row",
      doubleClick: "Double-click",
      editCell: "Edit cell",
      undo: "Undo",
      deleteRow: "Delete row (right edge)",
    },
  },
  toast: {
    overwrote: (date) => `Overwrote ${date} row (⌘Z to undo)`,
    notEditable: "This column is auto-computed; can't paste here",
    clipboardReadFail: "Failed to read clipboard",
    copied: "Copied",
    copyFail: "Copy failed",
    rowCopied: "Row copied",
    noRowData: "No row data — copy a row with ⌘⇧C first",
    invalidRowDate: "Copied row has an invalid date",
    rowDuplicated: (date) => `Row duplicated → ${date}`,
    rowDuplicatedShifted: (src, date) =>
      `${src} taken — duplicated to ${date}`,
    invalidDateFormat: "Date must be YYYY-MM-DD",
    numbersOnly: "Only numbers can be pasted here",
    pasted: "Pasted",
  },
  calendar: {
    weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    prevMonth: "Previous month",
    nextMonth: "Next month",
    monthFilterTitle: "Click to filter the grid by this month",
  },
  monthStats: {
    statsAll: "All-time stats",
    statsMonth: (m) => `${m} stats`,
    tradingDays: (n) => `${n} day${n === 1 ? "" : "s"}`,
    totalPnl: "Total PnL",
    vsStart: "vs start balance",
    winRate: "Win rate",
    wins: (n) => `${n}W`,
    losses: (n) => `${n}L`,
    avgDaily: "Avg daily",
    perDay: "/ day",
  },
  monthlyBars: {
    title: "Monthly PnL",
    subtitle: (n) => `Last ${n} month${n === 1 ? "" : "s"}`,
    empty: "No monthly data yet",
  },
  monthPicker: {
    title: "Filter by month",
    openLabel: "Pick month",
    cellTooltip: (ym, count) => `${ym} · ${count} day${count === 1 ? "" : "s"}`,
    noData: "(no data)",
    hint: "↑↓←→ move · Enter select · Esc close",
  },
  goal: {
    label: (balance, date) => `Goal: ${balance} @ ${date}`,
    edit: "Edit",
    achieved: (pct) => `${pct}% reached`,
    remaining: (amount) => `${amount} to go`,
    title: "Set goal",
    targetBalance: "Target balance (USD)",
    targetDate: "Target date",
    cancel: "Cancel",
    save: "Save",
  },
  equity: {
    empty: "Enter some data to see the curve",
    goalLabel: (balance, ym) => `Goal: ${balance} @ ${ym}`,
    tooltipLabel: "Cumulative",
    tooltipReturnLabel: "Return",
  },
  balance: {
    label: "Current balance",
  },
  cumulativeReturn: {
    label: "Cumulative return",
  },
  update: {
    upToDate: "You're on the latest version",
    available: (version) => `New version ${version} available`,
    later: "Later",
    installNow: "Install now",
    installing: "Installing…",
    checkFailed: "Update check failed",
    retry: "Retry",
    close: "Close",
    installFailed: (msg) => `Install failed: ${msg}`,
  },
  note: {
    moreLines: (n) => `${n} more line${n === 1 ? "" : "s"}`,
  },
  language: {
    toggleAriaLabel: "Language",
  },
};

export const messages: Record<Locale, Messages> = { ko, en };
