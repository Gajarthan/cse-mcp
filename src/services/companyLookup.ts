import { parse } from "csv-parse/sync";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

import { DataShapeError, ValidationError } from "../utils/errors.js";
import { compactSymbol, normalizeSearchText, normalizeSymbol } from "../utils/formatters.js";

const csvRowSchema = z.object({
  ID: z.string().min(1),
  Symbol: z.string().min(1),
  "Company Name": z.string().min(1)
});

export interface CompanyRecord {
  id: number;
  symbol: string;
  name: string;
}

export interface CompanySearchResult extends CompanyRecord {
  score: number;
  matchType: "exact" | "prefix" | "contains" | "fuzzy";
}

interface IndexedCompany extends CompanyRecord {
  normalizedSymbol: string;
  compactSymbol: string;
  normalizedName: string;
  nameTokens: string[];
}

function levenshteinDistance(left: string, right: string): number {
  if (left === right) {
    return 0;
  }

  if (left.length === 0) {
    return right.length;
  }

  if (right.length === 0) {
    return left.length;
  }

  const rows = right.length + 1;
  const columns = left.length + 1;
  const matrix = Array.from({ length: rows }, () => Array<number>(columns).fill(0));

  for (let row = 0; row < rows; row += 1) {
    matrix[row]![0] = row;
  }

  for (let column = 0; column < columns; column += 1) {
    matrix[0]![column] = column;
  }

  for (let row = 1; row < rows; row += 1) {
    for (let column = 1; column < columns; column += 1) {
      const cost = right[row - 1] === left[column - 1] ? 0 : 1;
      matrix[row]![column] = Math.min(
        matrix[row - 1]![column]! + 1,
        matrix[row]![column - 1]! + 1,
        matrix[row - 1]![column - 1]! + cost
      );
    }
  }

  return matrix[rows - 1]![columns - 1]!;
}

function getDefaultCsvPath(): string {
  const currentFilePath = fileURLToPath(import.meta.url);
  return path.resolve(path.dirname(currentFilePath), "../../cse_companies.csv");
}

export class CompanyLookupService {
  private readonly companies: IndexedCompany[];
  private readonly companiesBySymbol: Map<string, IndexedCompany>;

  private constructor(companies: IndexedCompany[]) {
    this.companies = companies;
    this.companiesBySymbol = new Map(companies.map((company) => [company.normalizedSymbol, company]));
  }

  public static async create(csvPath = getDefaultCsvPath()): Promise<CompanyLookupService> {
    const rawCsv = await fs.readFile(csvPath, "utf-8");
    const rows = parse(rawCsv, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    }) as unknown[];

    const companies = rows.map((row) => {
      const parsedRow = csvRowSchema.safeParse(row);
      if (!parsedRow.success) {
        throw new DataShapeError("Company CSV contains an invalid row.", parsedRow.error.flatten());
      }

      const id = Number(parsedRow.data.ID);
      if (!Number.isInteger(id)) {
        throw new DataShapeError(`Company CSV row has an invalid ID: ${parsedRow.data.ID}`);
      }

      const symbol = normalizeSymbol(parsedRow.data.Symbol);
      const name = parsedRow.data["Company Name"].trim();
      const normalizedName = normalizeSearchText(name);

      return {
        id,
        symbol,
        name,
        normalizedSymbol: symbol,
        compactSymbol: compactSymbol(symbol),
        normalizedName,
        nameTokens: normalizedName.split(" ").filter(Boolean)
      } satisfies IndexedCompany;
    });

    return new CompanyLookupService(companies);
  }

  public get size(): number {
    return this.companies.length;
  }

  public findBySymbol(symbol: string): CompanyRecord | null {
    const normalized = normalizeSymbol(symbol);
    const company = this.companiesBySymbol.get(normalized);

    if (company) {
      return { id: company.id, symbol: company.symbol, name: company.name };
    }

    const compactQuery = compactSymbol(symbol);
    const looseMatch = this.companies.find((entry) => entry.compactSymbol === compactQuery);

    return looseMatch ? { id: looseMatch.id, symbol: looseMatch.symbol, name: looseMatch.name } : null;
  }

  public search(query: string, limit = 8): CompanySearchResult[] {
    const normalizedSymbolQuery = normalizeSymbol(query);
    const normalizedQuery = normalizeSearchText(query);
    const compactQuery = compactSymbol(query);

    if (!normalizedQuery || !compactQuery) {
      throw new ValidationError("Search query must contain at least one letter or number.");
    }

    const ranked = this.companies
      .map((company) => {
        const scoreInfo = this.scoreCompany(company, normalizedSymbolQuery, normalizedQuery, compactQuery);
        return {
          id: company.id,
          symbol: company.symbol,
          name: company.name,
          score: scoreInfo.score,
          matchType: scoreInfo.matchType
        } satisfies CompanySearchResult;
      })
      .sort((left, right) => left.score - right.score || left.symbol.localeCompare(right.symbol));

    return ranked.slice(0, limit);
  }

  private scoreCompany(
    company: IndexedCompany,
    normalizedSymbolQuery: string,
    normalizedQuery: string,
    compactQuery: string
  ): Pick<CompanySearchResult, "score" | "matchType"> {
    if (
      company.normalizedSymbol === normalizedSymbolQuery ||
      company.compactSymbol === compactQuery ||
      company.normalizedName === normalizedQuery
    ) {
      return { score: 0, matchType: "exact" };
    }

    if (company.compactSymbol.startsWith(compactQuery) || company.normalizedName.startsWith(normalizedQuery)) {
      return { score: 10, matchType: "prefix" };
    }

    if (
      company.compactSymbol.includes(compactQuery) ||
      company.normalizedName.includes(normalizedQuery) ||
      company.nameTokens.some((token) => token.startsWith(normalizedQuery))
    ) {
      return { score: 25, matchType: "contains" };
    }

    const tokenDistances = company.nameTokens.map((token) => levenshteinDistance(normalizedQuery, token));
    const symbolDistance = levenshteinDistance(compactQuery, company.compactSymbol.slice(0, compactQuery.length));
    const nameDistance = levenshteinDistance(normalizedQuery, company.normalizedName.slice(0, normalizedQuery.length));
    const bestDistance = Math.min(symbolDistance, nameDistance, ...tokenDistances);

    return {
      score: 100 + bestDistance,
      matchType: "fuzzy"
    };
  }
}
