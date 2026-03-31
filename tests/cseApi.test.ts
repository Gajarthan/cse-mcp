import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

import { CompanyLookupService } from "../src/services/companyLookup.js";
import { CseApiService } from "../src/services/cseApi.js";

const fixturePath = path.resolve("tests/fixtures/companies.csv");

test("CseApiService normalizes a stock quote and market status from mocked CSE responses", async () => {
  const originalFetch = globalThis.fetch;
  const lookup = await CompanyLookupService.create(fixturePath);
  const requests: string[] = [];

  globalThis.fetch = async (input) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    requests.push(url);

    if (url.endsWith("/marketStatus")) {
      return new Response(JSON.stringify({ status: "Regular Trading Open" }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (url.endsWith("/companyInfoSummery")) {
      return new Response(
        JSON.stringify({
          reqSymbolInfo: {
            id: 1,
            symbol: "JKH.N0000",
            name: "John Keells Holdings PLC",
            issueDate: "1990-01-01",
            lastTradedPrice: "18.40",
            previousClose: "18.10",
            change: "0.30",
            changePercentage: "1.66",
            hiTrade: "18.50",
            lowTrade: "18.00",
            p12HiPrice: "25.00",
            p12LowPrice: "15.00",
            tdyShareVolume: "1000",
            tdyTradeVolume: "12",
            tdyTurnover: "18400",
            marketCap: "5000000",
            isin: "LK0000000001"
          },
          reqSymbolBetaInfo: {
            betaValueSPSL: "1.2",
            triASIBetaValue: "0.9"
          },
          reqLogo: {
            path: "images/logo.png"
          }
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    throw new Error(`Unexpected URL in test: ${url}`);
  };

  try {
    const service = new CseApiService({
      companyLookup: lookup,
      timeoutMs: 500,
      maxRetries: 0
    });

    const [marketStatus, quote] = await Promise.all([
      service.getMarketStatus(),
      service.getStockQuote("JKH.N0000")
    ]);

    assert.deepEqual(requests.sort(), [
      "https://www.cse.lk/api/companyInfoSummery",
      "https://www.cse.lk/api/marketStatus"
    ]);
    assert.equal(marketStatus.isOpen, true);
    assert.equal(marketStatus.session, "regular_trading");
    assert.equal(quote.symbol, "JKH.N0000");
    assert.equal(quote.companyName, "John Keells Holdings PLC");
    assert.equal(quote.lastPrice, 18.4);
    assert.equal(quote.display.changePercent, "+1.66%");
    assert.equal(quote.logoUrl, "https://www.cse.lk/images/logo.png");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
