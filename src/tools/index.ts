import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import type { CseApiService } from "../services/cseApi.js";
import type { CompanyLookupService } from "../services/companyLookup.js";
import { registerGetIndexSummaryTool } from "./getIndexSummary.js";
import { registerGetMarketStatusTool } from "./getMarketStatus.js";
import { registerGetMarketSummaryTool } from "./getMarketSummary.js";
import { registerGetStockQuoteTool } from "./getStockQuote.js";
import { registerGetTopGainersTool } from "./getTopGainers.js";
import { registerGetTopLosersTool } from "./getTopLosers.js";
import { registerSearchCompanyTool } from "./searchCompany.js";

export interface ToolDependencies {
  companyLookup: CompanyLookupService;
  cseApi: CseApiService;
}

export function registerTools(server: McpServer, dependencies: ToolDependencies): void {
  registerSearchCompanyTool(server, dependencies.companyLookup);
  registerGetStockQuoteTool(server, dependencies.cseApi);
  registerGetMarketStatusTool(server, dependencies.cseApi);
  registerGetMarketSummaryTool(server, dependencies.cseApi);
  registerGetTopGainersTool(server, dependencies.cseApi);
  registerGetTopLosersTool(server, dependencies.cseApi);
  registerGetIndexSummaryTool(server, dependencies.cseApi);
}
