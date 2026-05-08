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
    sectionWisdom: string;
  };
  views: {
    defiPlaceholderTitle: string;
    defiPlaceholderMsg: string;
    wisdomPlaceholderTitle: string;
    wisdomPlaceholderMsg: string;
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
    sectionWisdom: "어록",
  },
  views: {
    defiPlaceholderTitle: "DeFi 포지션 (준비 중)",
    defiPlaceholderMsg: "다음 PR에서 디파이/일드파밍 포지션 추적이 들어옵니다.",
    wisdomPlaceholderTitle: "어록 / 꿀팁 아카이브 (준비 중)",
    wisdomPlaceholderMsg: "트레이딩 인사이트와 명언을 모아두는 공간이 들어올 예정입니다.",
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
    sectionWisdom: "Wisdom",
  },
  views: {
    defiPlaceholderTitle: "DeFi positions (coming soon)",
    defiPlaceholderMsg: "Yield-farming and DeFi position tracking lands in the next PR.",
    wisdomPlaceholderTitle: "Wisdom archive (coming soon)",
    wisdomPlaceholderMsg: "A place to collect trading insights and quotes is on the way.",
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
