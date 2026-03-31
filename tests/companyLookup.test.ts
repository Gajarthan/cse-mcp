import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

import { CompanyLookupService } from "../src/services/companyLookup.js";
import { ValidationError } from "../src/utils/errors.js";

const fixturePath = path.resolve("tests/fixtures/companies.csv");

test("CompanyLookupService finds exact symbols and loose symbol variants", async () => {
  const lookup = await CompanyLookupService.create(fixturePath);

  assert.equal(lookup.size, 3);
  assert.deepEqual(lookup.findBySymbol("JKH.N0000"), {
    id: 1,
    symbol: "JKH.N0000",
    name: "John Keells Holdings PLC"
  });
  assert.deepEqual(lookup.findBySymbol("combn0000"), {
    id: 2,
    symbol: "COMB.N0000",
    name: "Commercial Bank of Ceylon PLC"
  });
});

test("CompanyLookupService ranks search results sensibly", async () => {
  const lookup = await CompanyLookupService.create(fixturePath);

  const symbolMatches = lookup.search("JKH");
  assert.equal(symbolMatches[0]?.symbol, "JKH.N0000");
  assert.equal(symbolMatches[0]?.matchType, "prefix");

  const nameMatches = lookup.search("john keells");
  assert.equal(nameMatches[0]?.symbol, "JKH.N0000");
  assert.equal(nameMatches[0]?.matchType, "prefix");
});

test("CompanyLookupService rejects empty search queries", async () => {
  const lookup = await CompanyLookupService.create(fixturePath);

  assert.throws(() => lookup.search("   "), ValidationError);
});
