import type { TradingDay } from "../types/trading-day";

/**
 * The Excel template has columns B–J (9 columns) selected when copying:
 *   [0] B 날짜       -> trade_date
 *   [1] C 입금        -> deposit
 *   [2] D 시작금액   -> ignored (computed)
 *   [3] E 최종금액   -> end_balance
 *   [4] F 일일수익   -> ignored
 *   [5] G 일별수익률 -> ignored
 *   [6] H 누적수익률 -> ignored
 *   [7] I 출금        -> withdrawal
 *   [8] J 비고        -> note (may span multiple lines if user used \n in cells;
 *                        Excel encloses such cells in quotes — handled below.)
 *
 * If the user copies fewer columns we still try to use whatever we got.
 */

export type ParseContext = {
  /**
   * "1일", "01" etc. need a year/month to become an ISO date. Defaults to the
   * currently-displayed calendar month at paste time.
   */
  defaultYear: number;
  defaultMonth: number; // 1-12
};

const COL_DATE = 0;
const COL_DEPOSIT = 1;
const COL_END_BALANCE = 3;
const COL_WITHDRAWAL = 7;
const COL_NOTE = 8;

export function parseClipboardTsv(
  text: string,
  ctx: ParseContext,
): TradingDay[] {
  const rows = splitTsv(text);
  const out: TradingDay[] = [];

  for (const cells of rows) {
    if (cells.length === 0 || cells.every((c) => c.trim() === "")) continue;

    const rawDate = cells[COL_DATE]?.trim() ?? "";
    const trade_date = normalizeDate(rawDate, ctx);
    if (!trade_date) continue;

    const deposit = parseNumber(cells[COL_DEPOSIT]);
    const end_balance =
      cells[COL_END_BALANCE] && cells[COL_END_BALANCE].trim() !== ""
        ? parseNumber(cells[COL_END_BALANCE])
        : null;
    const withdrawal = parseNumber(cells[COL_WITHDRAWAL]);
    const note = (cells[COL_NOTE] ?? "").trim();

    out.push({
      trade_date,
      deposit: Number.isFinite(deposit) ? deposit : 0,
      withdrawal: Number.isFinite(withdrawal) ? withdrawal : 0,
      end_balance,
      note,
    });
  }

  return out;
}

/**
 * Splits TSV that may contain Excel-quoted multiline cells.
 * Excel quotes a cell with a newline by wrapping it in `"..."` and doubling
 * inner quotes (`""`). Within a quoted cell newlines are part of the value.
 */
export function splitTsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  let i = 0;
  const n = text.length;

  while (i < n) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      cell += ch;
      i++;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (ch === "\t") {
      row.push(cell);
      cell = "";
      i++;
      continue;
    }
    if (ch === "\r") {
      i++;
      continue;
    }
    if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      i++;
      continue;
    }
    cell += ch;
    i++;
  }

  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

/**
 * Parses Excel-style numbers. Supports:
 *   "1,000.50"  -> 1000.5
 *   "$1,234"    -> 1234
 *   "(500)"     -> 500   (parens around a deposit/withdrawal mean *outflow*
 *                         in accounting convention, but in our schema deposit
 *                         and withdrawal are stored as positive magnitudes;
 *                         the column itself encodes direction. So the parser
 *                         strips parens and treats the inner value as the
 *                         magnitude.)
 *   "-500"      -> -500  (explicit minus is preserved for cases like a
 *                         negative end_balance correction.)
 */
function parseNumber(raw: string | undefined): number {
  if (!raw) return 0;
  let s = raw.replace(/[$,\s]/g, "");
  if (s.startsWith("(") && s.endsWith(")")) {
    s = s.slice(1, -1);
  }
  if (s === "" || s === "-") return 0;
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

const DATE_RE_FULL = /^(\d{4})[-./](\d{1,2})[-./](\d{1,2})$/;
const DATE_RE_MD = /^(\d{1,2})[-./](\d{1,2})$/;
const DATE_RE_DAY = /^(\d{1,2})\s*일?$/;

function normalizeDate(raw: string, ctx: ParseContext): string | null {
  if (!raw) return null;

  let m = DATE_RE_FULL.exec(raw);
  if (m) return iso(Number(m[1]), Number(m[2]), Number(m[3]));

  m = DATE_RE_MD.exec(raw);
  if (m) return iso(ctx.defaultYear, Number(m[1]), Number(m[2]));

  m = DATE_RE_DAY.exec(raw);
  if (m) return iso(ctx.defaultYear, ctx.defaultMonth, Number(m[1]));

  return null;
}

function iso(y: number, mo: number, d: number): string | null {
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return `${y.toString().padStart(4, "0")}-${mo
    .toString()
    .padStart(2, "0")}-${d.toString().padStart(2, "0")}`;
}
