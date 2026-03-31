import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import type { CseApiService } from "../services/cseApi.js";
import { createToolErrorResponse, createToolSuccessResponse } from "../utils/errors.js";

export function registerGetMarketStatusTool(server: McpServer, cseApi: CseApiService): void {
  server.registerTool(
    "get_market_status",
    {
      title: "Get Market Status",
      description: "Return the current Colombo Stock Exchange trading session status.",
      inputSchema: {}
    },
    async () => {
      try {
        const status = await cseApi.getMarketStatus();
        return createToolSuccessResponse({
          ok: true,
          marketStatus: status
        });
      } catch (error) {
        return createToolErrorResponse("get_market_status", error);
      }
    }
  );
}
