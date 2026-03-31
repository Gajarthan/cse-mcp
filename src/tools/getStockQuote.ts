import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import type { CseApiService } from "../services/cseApi.js";
import { createToolErrorResponse, createToolSuccessResponse } from "../utils/errors.js";
import { normalizeSymbol } from "../utils/formatters.js";

export function registerGetStockQuoteTool(server: McpServer, cseApi: CseApiService): void {
  server.registerTool(
    "get_stock_quote",
    {
      title: "Get Stock Quote",
      description:
        "Get a normalized stock quote for a single CSE symbol, including price movement, volume, turnover, market cap, and beta values.",
      inputSchema: {
        symbol: z
          .string()
          .trim()
          .min(1)
          .max(24)
          .regex(/^[A-Za-z0-9.\-]+$/, "Symbol may only contain letters, numbers, dots, and hyphens.")
          .describe("CSE ticker symbol such as JKH.N0000.")
      }
    },
    async ({ symbol }) => {
      try {
        const quote = await cseApi.getStockQuote(symbol);

        return createToolSuccessResponse({
          ok: true,
          symbol: normalizeSymbol(symbol),
          quote
        });
      } catch (error) {
        return createToolErrorResponse("get_stock_quote", error);
      }
    }
  );
}
