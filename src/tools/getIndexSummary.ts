import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import type { CseApiService, SupportedIndex } from "../services/cseApi.js";
import { createToolErrorResponse, createToolSuccessResponse } from "../utils/errors.js";

export function registerGetIndexSummaryTool(server: McpServer, cseApi: CseApiService): void {
  server.registerTool(
    "get_index_summary",
    {
      title: "Get Index Summary",
      description: "Return ASPI, S&P SL20, or both as concise index summaries.",
      inputSchema: {
        index: z
          .enum(["aspi", "snp", "all"])
          .optional()
          .describe("Optional index selector. Use aspi, snp, or all. Defaults to all.")
      }
    },
    async ({ index }) => {
      try {
        const resolvedIndex = (index ?? "all") as SupportedIndex;
        const summary = await cseApi.getIndexSummary(resolvedIndex);
        return createToolSuccessResponse({
          ok: true,
          indexSummary: summary
        });
      } catch (error) {
        return createToolErrorResponse("get_index_summary", error);
      }
    }
  );
}
