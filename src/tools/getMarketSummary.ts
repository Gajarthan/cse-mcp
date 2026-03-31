import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import type { CseApiService } from "../services/cseApi.js";
import { createToolErrorResponse, createToolSuccessResponse } from "../utils/errors.js";

export function registerGetMarketSummaryTool(server: McpServer, cseApi: CseApiService): void {
  server.registerTool(
    "get_market_summary",
    {
      title: "Get Market Summary",
      description: "Return concise market-wide volume, turnover, trade-count, and trade-date data.",
      inputSchema: {}
    },
    async () => {
      try {
        const summary = await cseApi.getMarketSummary();
        return createToolSuccessResponse({
          ok: true,
          marketSummary: summary
        });
      } catch (error) {
        return createToolErrorResponse("get_market_summary", error);
      }
    }
  );
}
