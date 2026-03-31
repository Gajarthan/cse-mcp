import test from "node:test";
import assert from "node:assert/strict";

import {
  asInteger,
  asNumber,
  compactSymbol,
  formatCurrencyLkr,
  formatSignedPercent,
  normalizeSearchText,
  normalizeSymbol,
  toIsoTimestamp
} from "../src/utils/formatters.js";

test("formatter helpers normalize symbols and search text", () => {
  assert.equal(normalizeSymbol(" jkh.n0000 "), "JKH.N0000");
  assert.equal(compactSymbol("JKH.N0000"), "JKHN0000");
  assert.equal(normalizeSearchText("John  Keells Holdings, PLC"), "JOHN KEELLS HOLDINGS PLC");
});

test("formatter helpers coerce numbers safely", () => {
  assert.equal(asNumber("18.40"), 18.4);
  assert.equal(asNumber("not-a-number"), null);
  assert.equal(asInteger("1234.9"), 1234);
});

test("formatter helpers produce readable display strings", () => {
  assert.equal(formatCurrencyLkr(18.4), "LKR 18.40");
  assert.equal(formatSignedPercent(1.25), "+1.25%");
  assert.equal(formatSignedPercent(-0.5), "-0.50%");
});

test("formatter helpers normalize timestamps from epoch milliseconds", () => {
  const midnightUtc = Date.UTC(2024, 2, 31, 0, 0, 0);

  assert.equal(toIsoTimestamp(0), "1970-01-01T00:00:00.000Z");
  assert.equal(toIsoTimestamp(midnightUtc), "2024-03-31T00:00:00.000Z");
});
