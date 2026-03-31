import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import type { CompanyLookupService } from "../services/companyLookup.js";
import { createToolErrorResponse, createToolSuccessResponse } from "../utils/errors.js";
import { normalizeSearchText } from "../utils/formatters.js";

export function registerSearchCompanyTool(server: McpServer, companyLookup: CompanyLookupService): void {
  server.registerTool(
    "search_company",
    {
      title: "Search CSE Companies",
      description: "Search Colombo Stock Exchange companies by name or symbol using ranked matching.",
      inputSchema: {
        query: z.string().trim().min(1).max(80).describe("Company name or ticker symbol to search for.")
      }
    },
    async ({ query }) => {
      try {
        const matches = companyLookup.search(query);

        return createToolSuccessResponse({
          ok: true,
          query,
          normalizedQuery: normalizeSearchText(query),
          count: matches.length,
          matches
        });
      } catch (error) {
        return createToolErrorResponse("search_company", error);
      }
    }
  );
}
