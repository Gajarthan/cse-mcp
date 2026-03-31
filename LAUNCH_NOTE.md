# Launch Note

`cse-mcp` is now available as a TypeScript MCP server for Colombo Stock Exchange data.

It supports:

- company search
- single-stock quotes
- market status
- market summary
- top gainers and losers
- ASPI and S&P SL20 index summaries

The project now includes:

- npm distribution via `@gajarthan/cse-mcp`
- official MCP Registry metadata
- baseline automated tests
- cross-platform GitHub Actions CI
- GitHub-ready docs for Smithery publishing

Current limitations:

- local `stdio` transport only
- no hosted HTTP/SSE deployment yet
- depends on unofficial CSE endpoints

Quick start:

```json
{
  "mcpServers": {
    "cse": {
      "command": "npx",
      "args": ["-y", "@gajarthan/cse-mcp"]
    }
  }
}
```
