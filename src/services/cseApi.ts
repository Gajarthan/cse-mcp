import { z } from "zod";

import type { CompanyLookupService, CompanyRecord } from "./companyLookup.js";
import {
  DataShapeError,
  NotFoundError,
  TimeoutError,
  UpstreamError,
  isRetryableStatus
} from "../utils/errors.js";
import {
  asInteger,
  asNumber,
  asString,
  formatCurrencyLkr,
  formatDecimal,
  formatInteger,
  formatSignedNumber,
  formatSignedPercent,
  normalizeSymbol,
  toIsoTimestamp
} from "../utils/formatters.js";

const BASE_URL = "https://www.cse.lk/api/";
const LOGO_BASE_URL = "https://www.cse.lk/";

const unknownJsonSchema = z.unknown();

const numish = z.union([z.number(), z.string()]);

const companyInfoSchema = z
  .object({
    reqSymbolInfo: z
      .object({
        id: numish.optional(),
        symbol: z.string().optional(),
        name: z.string().optional(),
        issueDate: z.string().optional(),
        lastTradedPrice: numish.optional(),
        previousClose: numish.optional(),
        change: numish.optional(),
        changePercentage: numish.optional(),
        hiTrade: numish.optional(),
        lowTrade: numish.optional(),
        p12HiPrice: numish.optional(),
        p12LowPrice: numish.optional(),
        tdyShareVolume: numish.optional(),
        tdyTradeVolume: numish.optional(),
        tdyTurnover: numish.optional(),
        marketCap: numish.optional(),
        isin: z.string().optional()
      })
      .passthrough()
      .optional(),
    reqSymbolBetaInfo: z
      .object({
        betaValueSPSL: numish.optional(),
        triASIBetaValue: numish.optional()
      })
      .passthrough()
      .nullable()
      .optional(),
    reqLogo: z
      .object({
        path: z.string().optional()
      })
      .passthrough()
      .nullable()
      .optional()
  })
  .passthrough();

const marketStatusSchema = z
  .object({
    status: z.string().optional()
  })
  .passthrough();

const marketSummarySchema = z
  .object({
    id: numish.optional(),
    tradeVolume: numish.optional(),
    shareVolume: numish.optional(),
    tradeDate: z.union([z.number(), z.string()]).optional(),
    trades: numish.optional()
  })
  .passthrough();

const leaderboardItemSchema = z
  .object({
    id: numish.optional(),
    securityId: numish.optional(),
    symbol: z.string().optional(),
    price: numish.optional(),
    change: numish.optional(),
    changePercentage: numish.optional(),
    tradeDate: z.union([z.number(), z.string()]).optional()
  })
  .passthrough();

const indexSummarySchema = z
  .object({
    id: numish.optional(),
    value: numish.optional(),
    lowValue: numish.optional(),
    highValue: numish.optional(),
    change: numish.optional(),
    percentage: numish.optional(),
    timestamp: z.union([z.number(), z.string()]).optional()
  })
  .passthrough();

export type SupportedIndex = "aspi" | "snp" | "all";

export interface NormalizedStockQuote {
  symbol: string;
  companyName: string;
  securityId: number | null;
  isin: string | null;
  issueDate: string | null;
  lastPrice: number | null;
  previousClose: number | null;
  change: number | null;
  changePercent: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  week52High: number | null;
  week52Low: number | null;
  todayShareVolume: number | null;
  todayTradeCount: number | null;
  todayTurnoverLkr: number | null;
  marketCapLkr: number | null;
  betaSpsl: number | null;
  betaTriasi: number | null;
  logoUrl: string | null;
  display: {
    lastPrice: string | null;
    previousClose: string | null;
    change: string | null;
    changePercent: string | null;
    dayRange: string | null;
    week52Range: string | null;
    todayShareVolume: string | null;
    todayTradeCount: string | null;
    todayTurnover: string | null;
    marketCap: string | null;
  };
  source: {
    endpoint: "companyInfoSummery";
    fetchedAt: string;
  };
}

export interface NormalizedMarketStatus {
  status: string;
  isOpen: boolean | null;
  session: string;
  source: {
    endpoint: "marketStatus";
    fetchedAt: string;
  };
}

export interface NormalizedMarketSummary {
  tradeVolumeLkr: number | null;
  shareVolume: number | null;
  tradeCount: number | null;
  tradeDate: string | null;
  display: {
    tradeVolume: string | null;
    shareVolume: string | null;
    tradeCount: string | null;
  };
  source: {
    endpoint: "marketSummery";
    fetchedAt: string;
  };
}

export interface NormalizedLeaderboardEntry {
  rank: number;
  symbol: string;
  companyName: string | null;
  securityId: number | null;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  tradedAt: string | null;
  display: {
    price: string | null;
    change: string | null;
    changePercent: string | null;
  };
}

export interface NormalizedLeaderboard {
  listType: "top_gainers" | "top_losers";
  requestedLimit: number;
  returnedCount: number;
  entries: NormalizedLeaderboardEntry[];
  source: {
    endpoint: "topGainers" | "topLooses";
    fetchedAt: string;
  };
}

export interface NormalizedIndexSummary {
  index: "aspi" | "snp";
  label: string;
  value: number | null;
  lowValue: number | null;
  highValue: number | null;
  change: number | null;
  changePercent: number | null;
  asOf: string | null;
  display: {
    value: string | null;
    lowValue: string | null;
    highValue: string | null;
    change: string | null;
    changePercent: string | null;
  };
}

export interface NormalizedIndexResponse {
  requestedIndex: SupportedIndex;
  summaries: NormalizedIndexSummary[];
  source: {
    endpoints: string[];
    fetchedAt: string;
  };
}

interface CseApiServiceOptions {
  timeoutMs?: number;
  maxRetries?: number;
  companyLookup?: CompanyLookupService;
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function inferMarketStatus(status: string): { isOpen: boolean | null; session: string } {
  const normalized = status.trim().toLowerCase();

  if (normalized.includes("regular")) {
    return { isOpen: true, session: "regular_trading" };
  }

  if (normalized.includes("open")) {
    return { isOpen: true, session: "open" };
  }

  if (normalized.includes("close") || normalized.includes("closed")) {
    return { isOpen: false, session: "closed" };
  }

  return {
    isOpen: null,
    session: normalized.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "unknown"
  };
}

function formatRange(low: number | null, high: number | null): string | null {
  if (low === null || high === null) {
    return null;
  }

  return `${formatCurrencyLkr(low)} to ${formatCurrencyLkr(high)}`;
}

function clampLimit(limit?: number): number {
  if (typeof limit !== "number" || !Number.isFinite(limit)) {
    return 10;
  }

  return Math.max(1, Math.min(25, Math.trunc(limit)));
}

export class CseApiService {
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly companyLookup: CompanyLookupService | undefined;

  public constructor(options?: CseApiServiceOptions) {
    this.timeoutMs = options?.timeoutMs ?? 10_000;
    this.maxRetries = options?.maxRetries ?? 2;
    this.companyLookup = options?.companyLookup;
  }

  public async getStockQuote(symbol: string): Promise<NormalizedStockQuote> {
    const company = this.requireKnownSymbol(symbol);
    const rawResponse = await this.postForm("companyInfoSummery", { symbol: company.symbol });
    const parsed = companyInfoSchema.safeParse(rawResponse);

    if (!parsed.success) {
      throw new DataShapeError("companyInfoSummery response does not match the expected shape.", parsed.error.flatten());
    }

    const symbolInfo = parsed.data.reqSymbolInfo;
    if (!symbolInfo) {
      throw new DataShapeError("companyInfoSummery response is missing reqSymbolInfo.");
    }

    const resolvedSymbol = asString(symbolInfo.symbol) ?? company.symbol;
    const resolvedName = asString(symbolInfo.name) ?? company.name;
    const fetchedAt = new Date().toISOString();

    const lastPrice = asNumber(symbolInfo.lastTradedPrice);
    const previousClose = asNumber(symbolInfo.previousClose);
    const change = asNumber(symbolInfo.change);
    const changePercent = asNumber(symbolInfo.changePercentage);
    const dayHigh = asNumber(symbolInfo.hiTrade);
    const dayLow = asNumber(symbolInfo.lowTrade);
    const week52High = asNumber(symbolInfo.p12HiPrice);
    const week52Low = asNumber(symbolInfo.p12LowPrice);
    const todayShareVolume = asInteger(symbolInfo.tdyShareVolume);
    const todayTradeCount = asInteger(symbolInfo.tdyTradeVolume);
    const todayTurnover = asNumber(symbolInfo.tdyTurnover);
    const marketCap = asNumber(symbolInfo.marketCap);
    const betaSpsl = asNumber(parsed.data.reqSymbolBetaInfo?.betaValueSPSL);
    const betaTriasi = asNumber(parsed.data.reqSymbolBetaInfo?.triASIBetaValue);
    const logoPath = asString(parsed.data.reqLogo?.path);

    return {
      symbol: normalizeSymbol(resolvedSymbol),
      companyName: resolvedName,
      securityId: asInteger(symbolInfo.id),
      isin: asString(symbolInfo.isin),
      issueDate: asString(symbolInfo.issueDate),
      lastPrice,
      previousClose,
      change,
      changePercent,
      dayHigh,
      dayLow,
      week52High,
      week52Low,
      todayShareVolume,
      todayTradeCount,
      todayTurnoverLkr: todayTurnover,
      marketCapLkr: marketCap,
      betaSpsl,
      betaTriasi,
      logoUrl: logoPath ? new URL(logoPath, LOGO_BASE_URL).toString() : null,
      display: {
        lastPrice: formatCurrencyLkr(lastPrice),
        previousClose: formatCurrencyLkr(previousClose),
        change: formatSignedNumber(change),
        changePercent: formatSignedPercent(changePercent),
        dayRange: formatRange(dayLow, dayHigh),
        week52Range: formatRange(week52Low, week52High),
        todayShareVolume: formatInteger(todayShareVolume),
        todayTradeCount: formatInteger(todayTradeCount),
        todayTurnover: formatCurrencyLkr(todayTurnover),
        marketCap: formatCurrencyLkr(marketCap)
      },
      source: {
        endpoint: "companyInfoSummery",
        fetchedAt
      }
    };
  }

  public async getMarketStatus(): Promise<NormalizedMarketStatus> {
    const rawResponse = await this.postForm("marketStatus");
    const parsed = marketStatusSchema.safeParse(rawResponse);

    if (!parsed.success) {
      throw new DataShapeError("marketStatus response does not match the expected shape.", parsed.error.flatten());
    }

    const status = asString(parsed.data.status);
    if (!status) {
      throw new DataShapeError("marketStatus response is missing status.");
    }

    const inferred = inferMarketStatus(status);

    return {
      status,
      isOpen: inferred.isOpen,
      session: inferred.session,
      source: {
        endpoint: "marketStatus",
        fetchedAt: new Date().toISOString()
      }
    };
  }

  public async getMarketSummary(): Promise<NormalizedMarketSummary> {
    const rawResponse = await this.postForm("marketSummery");
    const parsed = marketSummarySchema.safeParse(rawResponse);

    if (!parsed.success) {
      throw new DataShapeError("marketSummery response does not match the expected shape.", parsed.error.flatten());
    }

    const tradeVolume = asNumber(parsed.data.tradeVolume);
    const shareVolume = asInteger(parsed.data.shareVolume);
    const tradeCount = asInteger(parsed.data.trades);

    return {
      tradeVolumeLkr: tradeVolume,
      shareVolume,
      tradeCount,
      tradeDate: toIsoTimestamp(parsed.data.tradeDate),
      display: {
        tradeVolume: formatCurrencyLkr(tradeVolume),
        shareVolume: formatInteger(shareVolume),
        tradeCount: formatInteger(tradeCount)
      },
      source: {
        endpoint: "marketSummery",
        fetchedAt: new Date().toISOString()
      }
    };
  }

  public async getTopGainers(limit?: number): Promise<NormalizedLeaderboard> {
    return this.getLeaderboard("topGainers", "top_gainers", limit);
  }

  public async getTopLosers(limit?: number): Promise<NormalizedLeaderboard> {
    return this.getLeaderboard("topLooses", "top_losers", limit);
  }

  public async getIndexSummary(index: SupportedIndex = "all"): Promise<NormalizedIndexResponse> {
    if (index === "all") {
      const [aspi, snp] = await Promise.all([this.getSingleIndexSummary("aspi"), this.getSingleIndexSummary("snp")]);
      return {
        requestedIndex: "all",
        summaries: [aspi, snp],
        source: {
          endpoints: ["aspiData", "snpData"],
          fetchedAt: new Date().toISOString()
        }
      };
    }

    const summary = await this.getSingleIndexSummary(index);
    return {
      requestedIndex: index,
      summaries: [summary],
      source: {
        endpoints: [index === "aspi" ? "aspiData" : "snpData"],
        fetchedAt: new Date().toISOString()
      }
    };
  }

  private requireKnownSymbol(symbol: string): CompanyRecord {
    if (!this.companyLookup) {
      return {
        id: 0,
        symbol: normalizeSymbol(symbol),
        name: normalizeSymbol(symbol)
      };
    }

    const company = this.companyLookup.findBySymbol(symbol);
    if (!company) {
      throw new NotFoundError(
        `Unknown CSE symbol "${symbol}". Use search_company to find a valid ticker symbol first.`
      );
    }

    return company;
  }

  private async getLeaderboard(
    endpoint: "topGainers" | "topLooses",
    listType: "top_gainers" | "top_losers",
    limit?: number
  ): Promise<NormalizedLeaderboard> {
    const rawResponse = await this.postForm(endpoint);
    const parsed = z.array(leaderboardItemSchema).safeParse(rawResponse);

    if (!parsed.success) {
      throw new DataShapeError(`${endpoint} response does not match the expected shape.`, parsed.error.flatten());
    }

    const requestedLimit = clampLimit(limit);
    const entries = parsed.data.slice(0, requestedLimit).map((item, index) => {
      const symbol = asString(item.symbol);

      if (!symbol) {
        throw new DataShapeError(`${endpoint} returned an entry without a symbol.`);
      }

      const companyName = this.companyLookup?.findBySymbol(symbol)?.name ?? null;
      const price = asNumber(item.price);
      const change = asNumber(item.change);
      const changePercent = asNumber(item.changePercentage);

      return {
        rank: index + 1,
        symbol: normalizeSymbol(symbol),
        companyName,
        securityId: asInteger(item.securityId),
        price,
        change,
        changePercent,
        tradedAt: toIsoTimestamp(item.tradeDate),
        display: {
          price: formatCurrencyLkr(price),
          change: formatSignedNumber(change),
          changePercent: formatSignedPercent(changePercent)
        }
      } satisfies NormalizedLeaderboardEntry;
    });

    return {
      listType,
      requestedLimit,
      returnedCount: entries.length,
      entries,
      source: {
        endpoint,
        fetchedAt: new Date().toISOString()
      }
    };
  }

  private async getSingleIndexSummary(index: "aspi" | "snp"): Promise<NormalizedIndexSummary> {
    const endpoint = index === "aspi" ? "aspiData" : "snpData";
    const label = index === "aspi" ? "All Share Price Index" : "S&P Sri Lanka 20";
    const rawResponse = await this.postForm(endpoint);
    const parsed = indexSummarySchema.safeParse(rawResponse);

    if (!parsed.success) {
      throw new DataShapeError(`${endpoint} response does not match the expected shape.`, parsed.error.flatten());
    }

    const value = asNumber(parsed.data.value);
    const lowValue = asNumber(parsed.data.lowValue);
    const highValue = asNumber(parsed.data.highValue);
    const change = asNumber(parsed.data.change);
    const changePercent = asNumber(parsed.data.percentage);

    return {
      index,
      label,
      value,
      lowValue,
      highValue,
      change,
      changePercent,
      asOf: toIsoTimestamp(parsed.data.timestamp),
      display: {
        value: formatDecimal(value),
        lowValue: formatDecimal(lowValue),
        highValue: formatDecimal(highValue),
        change: formatSignedNumber(change),
        changePercent: formatSignedPercent(changePercent)
      }
    };
  }

  private async postForm(
    endpoint: string,
    formData: Record<string, string | number | undefined> = {}
  ): Promise<unknown> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const body = new URLSearchParams();
        for (const [key, value] of Object.entries(formData)) {
          if (value !== undefined) {
            body.set(key, String(value));
          }
        }

        const response = await fetch(new URL(endpoint, BASE_URL), {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            Accept: "application/json"
          },
          body: body.toString(),
          signal: controller.signal
        });

        if (!response.ok) {
          const responseText = await response.text();
          const error = new UpstreamError(`${endpoint} returned HTTP ${response.status}.`, {
            safeMessage: "The CSE API is temporarily unavailable. Please try again shortly.",
            transient: isRetryableStatus(response.status),
            cause: responseText.slice(0, 500)
          });

          if (!isRetryableStatus(response.status) || attempt === this.maxRetries) {
            throw error;
          }

          lastError = error;
          console.error(
            `[cse-mcp] retrying ${endpoint} after HTTP ${response.status} (attempt ${attempt + 1}/${this.maxRetries + 1})`
          );
          await delay(250 * (attempt + 1));
          continue;
        }

        const responseText = await response.text();
        const parsedJson = unknownJsonSchema.parse(JSON.parse(responseText));
        return parsedJson;
      } catch (error) {
        if (error instanceof SyntaxError) {
          throw new UpstreamError(`${endpoint} returned invalid JSON.`, {
            safeMessage: "The CSE API returned unreadable data. Please try again later.",
            transient: true,
            cause: error
          });
        }

        if (error instanceof UpstreamError) {
          throw error;
        }

        if (error instanceof Error && error.name === "AbortError") {
          const timeoutError = new TimeoutError(`${endpoint} timed out after ${this.timeoutMs}ms.`, error);

          if (attempt === this.maxRetries) {
            throw timeoutError;
          }

          lastError = timeoutError;
          console.error(
            `[cse-mcp] retrying ${endpoint} after timeout (attempt ${attempt + 1}/${this.maxRetries + 1})`
          );
          await delay(250 * (attempt + 1));
          continue;
        }

        const transientError = new UpstreamError(`${endpoint} request failed.`, {
          safeMessage: "The CSE API is temporarily unavailable. Please try again shortly.",
          transient: true,
          cause: error
        });

        if (attempt === this.maxRetries) {
          throw transientError;
        }

        lastError = transientError;
        console.error(
          `[cse-mcp] retrying ${endpoint} after network failure (attempt ${attempt + 1}/${this.maxRetries + 1})`
        );
        await delay(250 * (attempt + 1));
      } finally {
        clearTimeout(timeout);
      }
    }

    throw new UpstreamError(`${endpoint} request failed after retries.`, {
      cause: lastError
    });
  }
}
