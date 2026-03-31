import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import type { CseApiService } from "../services/cseApi.js";
import { createToolErrorResponse, createToolSuccessResponse } from "../utils/errors.js";

export function registerGetTopGainersTool(server: McpServer, cseApi: CseApiService): void {
  server.registerTool(
    "get_top_gainers",
    {
      title: "Get Top Gainers",
      description: "Return the top CSE gainers with normalized price, percentage change, and timestamps.",
      inputSchema: {
        limit: z
          .number()
          .int()
          .min(1)
          .max(25)
          .optional()
          .describe("Optional number of rows to return. Defaults to 10 and caps at 25.")
      }
    },
    async ({ limit }) => {
      try {
        const gainers = await cseApi.getTopGainers(limit);
        return createToolSuccessResponse({
          ok: true,
          topGainers: gainers
        });
      } catch (error) {
        return createToolErrorResponse("get_top_gainers", error);
      }
    }
  );
}
