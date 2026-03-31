#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { CompanyLookupService } from "./services/companyLookup.js";
import { CseApiService } from "./services/cseApi.js";
import { registerTools } from "./tools/index.js";
import { logError } from "./utils/errors.js";

async function main(): Promise<void> {
  const companyLookup = await CompanyLookupService.create();
  console.error(`[cse-mcp] loaded ${companyLookup.size} companies from CSV`);

  const cseApi = new CseApiService({
    companyLookup,
    timeoutMs: 10_000,
    maxRetries: 2
  });

  const server = new McpServer({
    name: "cse-mcp",
    version: "2.0.1"
  });

  registerTools(server, {
    companyLookup,
    cseApi
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[cse-mcp] stdio transport connected");
}

process.on("unhandledRejection", (error) => {
  logError("unhandledRejection", error);
});

process.on("uncaughtException", (error) => {
  logError("uncaughtException", error);
  process.exit(1);
});

main().catch((error) => {
  logError("startup failure", error);
  process.exit(1);
});
