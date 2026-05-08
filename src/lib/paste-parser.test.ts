import { describe, expect, it } from "vitest";
import { parseClipboardTsv, splitTsv } from "./paste-parser";

const ctx = { defaultYear: 2026, defaultMonth: 4 };

describe("splitTsv", () => {
  it("splits plain rows", () => {
    expect(splitTsv("a\tb\nc\td")).toEqual([
      ["a", "b"],
      ["c", "d"],
    ]);
  });

  it("preserves newlines inside quoted cells (multiline notes)", () => {
    const tsv = `1\t"line1\nline2"\t3\n2\tx\ty`;
    expect(splitTsv(tsv)).toEqual([
      ["1", "line1\nline2", "3"],
      ["2", "x", "y"],
    ]);
  });

  it("handles escaped quotes inside cells", () => {
    expect(splitTsv('a\t"he said ""hi"""\tb')).toEqual([
      ["a", 'he said "hi"', "b"],
    ]);
  });
});

describe("parseClipboardTsv", () => {
  it("maps Excel B-J columns to TradingDay fields", () => {
    // [date, deposit, start(ignored), end, daily(ignored), pct(ignored), cum(ignored), withdraw, note]
    const row = "1일\t10000\t10000\t10500\t500\t5%\t5%\t0\t보합";
    const out = parseClipboardTsv(row, ctx);
    expect(out).toEqual([
      {
        trade_date: "2026-04-01",
        deposit: 10000,
        withdrawal: 0,
        end_balance: 10500,
        note: "보합",
      },
    ]);
  });

  it("treats blank end_balance as null", () => {
    const row = "1일\t10000\t10000\t\t\t\t\t0\t";
    const out = parseClipboardTsv(row, ctx);
    expect(out[0].end_balance).toBeNull();
  });

  it("strips $ , and parens; treats parens as magnitude (column encodes sign)", () => {
    const row = "2일\t$1,000\t\t$10,500\t\t\t\t($500)\t";
    const out = parseClipboardTsv(row, ctx);
    expect(out[0].deposit).toBe(1000);
    expect(out[0].end_balance).toBe(10500);
    expect(out[0].withdrawal).toBe(500);
  });

  it("preserves explicit minus signs", () => {
    const row = "3일\t-100\t\t-50\t\t\t\t0\t";
    const out = parseClipboardTsv(row, ctx);
    expect(out[0].deposit).toBe(-100);
    expect(out[0].end_balance).toBe(-50);
  });

  it("skips rows with no parseable date", () => {
    const tsv = ["1일\t10000\t\t10500\t\t\t\t0\tok",
                 "총합\t10000\t\t\t\t\t\t0\t",
                 "2일\t0\t\t10800\t\t\t\t0\t"].join("\n");
    const out = parseClipboardTsv(tsv, ctx);
    expect(out.map(d => d.trade_date)).toEqual(["2026-04-01", "2026-04-02"]);
  });

  it("ignores rows that are entirely empty", () => {
    const tsv = "1일\t10000\t\t10500\t\t\t\t0\tok\n\n2일\t0\t\t10800\t\t\t\t0\t";
    const out = parseClipboardTsv(tsv, ctx);
    expect(out).toHaveLength(2);
  });

  it("accepts ISO and slash dates", () => {
    const out = parseClipboardTsv(
      ["2026-04-01\t100\t\t101\t\t\t\t0\t",
       "2026/04/02\t0\t\t102\t\t\t\t0\t"].join("\n"),
      ctx,
    );
    expect(out.map(d => d.trade_date)).toEqual(["2026-04-01", "2026-04-02"]);
  });
});
