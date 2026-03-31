# CSE MCP Server

[![cse-mcp MCP server](https://glama.ai/mcp/servers/Gajarthan/cse-mcp/badges/card.svg)](https://glama.ai/mcp/servers/Gajarthan/cse-mcp)

`@gajarthan/cse-mcp` is a TypeScript Model Context Protocol server for the Colombo Stock Exchange. It gives MCP-compatible clients a clean way to search listed companies, fetch normalized single-stock quotes, and retrieve market-wide snapshots such as status, summary, top gainers, top losers, and index data. It is built for developers, analysts, and AI-tool builders who want fast access to CSE data through a stable MCP tool surface instead of scraping raw website responses inside prompts.

## Key Features

- Search listed CSE companies by symbol or company name using the local CSV catalog
- Fetch normalized stock quote data from `companyInfoSummery`
- Retrieve market-wide data from `marketStatus`, `marketSummery`, `topGainers`, `topLooses`, `aspiData`, and `snpData`
- Validate tool inputs before making upstream requests
- Normalize undocumented CSE payloads into AI-friendly JSON
- Use a dedicated service layer for CSE HTTP calls and thin MCP handlers
- Apply request timeout and basic retry handling for transient upstream failures
- Log only to stderr so stdout stays clean for MCP transport
- Stay compatible with MCP Inspector and local `stdio`-based MCP clients

## Disclaimers, Security, and Privacy

- This project uses unofficial, reverse-engineered public endpoints exposed by `https://www.cse.lk/api/`. Response shapes may change without notice.
- Market data may be delayed, incomplete, or temporarily unavailable. Verify important figures against official sources before making financial decisions.
- This server makes outbound requests to the CSE website. Symbols and request payloads sent through tools are transmitted to that external service.
- This server does not require API keys and does not include built-in telemetry or analytics.
- Tool outputs are returned to the MCP client you connect it to. Treat client logs, transcripts, and tool approval history as potentially sensitive.
- The server currently supports local `stdio` transport only. It does not yet expose a remote HTTP or SSE MCP endpoint.

## Requirements

- Node.js 20 or newer
- npm 10 or newer
- Internet access to `https://www.cse.lk`
- An MCP client that supports local `stdio` servers

## Getting Started

### Use a local build

Build locally:

```bash
npm install
npm run build
```

Minimum local MCP config:

```json
{
  "mcpServers": {
    "cse": {
      "command": "node",
      "args": ["C:/absolute/path/to/cse-mcp/dist/index.js"]
    }
  }
}
```

If you are developing locally, MCP Inspector is the fastest smoke test:

```bash
npm run inspector
```

### Use the published npm package

If the package is published to npm, the fastest install path becomes:

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

### First test prompt

```text
Use search_company to find John Keells Holdings, then call get_stock_quote for the correct symbol.
```

## MCP Client Configuration

This server supports local `stdio` usage only. In most clients, you can configure it in one of two ways:

- local development mode: `node C:/absolute/path/to/cse-mcp/dist/index.js`
- published package mode: `npx -y @gajarthan/cse-mcp`

### Local `stdio` vs remote HTTP

- Supported now: local `stdio` MCP clients that launch a process with `command` and `args`
- Not supported yet: remote-only MCP clients that require SSE or streaming HTTP transport

### Claude Code

Claude Code documents MCP support and works well with local stdio servers.

Add the server directly:

```bash
claude mcp add-json cse "{\"type\":\"stdio\",\"command\":\"node\",\"args\":[\"C:/absolute/path/to/cse-mcp/dist/index.js\"]}"
```

Published-package variant:

```bash
claude mcp add-json cse "{\"type\":\"stdio\",\"command\":\"npx\",\"args\":[\"-y\",\"@gajarthan/cse-mcp\"]}"
```

Or use `.mcp.json`:

```json
{
  "mcpServers": {
    "cse": {
      "command": "node",
      "args": ["C:/absolute/path/to/cse-mcp/dist/index.js"]
    }
  }
}
```

If Claude Desktop is already configured, you can also import those MCP entries into Claude Code:

```bash
claude mcp add-from-claude-desktop
```

### Codex

OpenAI documents MCP configuration in `~/.codex/config.toml`, and the Codex CLI and IDE extension share it.

CLI setup:

```bash
codex mcp add cse -- node C:/absolute/path/to/cse-mcp/dist/index.js
```

Published-package CLI setup:

```bash
codex mcp add cse -- npx -y @gajarthan/cse-mcp
```

`config.toml` setup:

```toml
[mcp_servers.cse]
command = "node"
args = ["C:/absolute/path/to/cse-mcp/dist/index.js"]
```

Published-package `config.toml` setup:

```toml
[mcp_servers.cse]
command = "npx"
args = ["-y", "@gajarthan/cse-mcp"]
```

### Cursor

Cursor MCP support is version-dependent. In versions that support local MCP servers, use a config equivalent to:

```json
{
  "mcpServers": {
    "cse": {
      "command": "node",
      "args": ["C:/absolute/path/to/cse-mcp/dist/index.js"]
    }
  }
}
```

If the client supports `npx`, you can usually replace the command with:

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

Verify the exact config path and UI flow in your installed Cursor version.

### VS Code / Copilot

VS Code and GitHub Copilot MCP support is version-dependent. In builds that support local MCP servers, the common pattern is a workspace or user `mcp.json`-style config using `command` and `args`:

```json
{
  "servers": {
    "cse": {
      "command": "node",
      "args": ["C:/absolute/path/to/cse-mcp/dist/index.js"]
    }
  }
}
```

Verify the exact file location and schema for your VS Code or Copilot version before relying on this example.

### Cline

Cline MCP support is version-dependent. In versions that support local MCP stdio servers, use the same process-launch pattern:

```json
{
  "mcpServers": {
    "cse": {
      "command": "node",
      "args": ["C:/absolute/path/to/cse-mcp/dist/index.js"]
    }
  }
}
```

Verify the current config file name and location in the Cline docs or extension UI.

### Continue

Continue support is version-dependent and may be configured through its YAML or UI-based MCP settings. The practical local setup is still the same:

```yaml
mcpServers:
  cse:
    command: node
    args:
      - C:/absolute/path/to/cse-mcp/dist/index.js
```

Verify the current `Continue` config format for your installed version.

### Roo Code

Roo Code MCP support is version-dependent. Use the same local `stdio` command pattern in the version-specific MCP settings:

```json
{
  "mcpServers": {
    "cse": {
      "command": "node",
      "args": ["C:/absolute/path/to/cse-mcp/dist/index.js"]
    }
  }
}
```

TODO: verify and document the exact current Roo Code config path.

### Gemini CLI

Gemini CLI MCP support is version-dependent. For versions that support local MCP servers, configure this server as a local stdio process:

```json
{
  "mcpServers": {
    "cse": {
      "command": "node",
      "args": ["C:/absolute/path/to/cse-mcp/dist/index.js"]
    }
  }
}
```

Verify the current Gemini CLI config path and schema in the version you are using.

## Smithery Publishing

This project is intended for Smithery publishing through the GitHub repository integration path.

What is verified:

- The server is a local `stdio` MCP server
- The npm package is published as `@gajarthan/cse-mcp`
- The repository is public on GitHub

What is intentionally not supported today:

- public HTTPS MCP deployment
- SSE transport
- hosted remote MCP URL publishing

For Smithery, that means the practical route is to connect the GitHub repo and let Smithery build from the repository, branch, and base directory instead of requiring a public MCP URL.

Recommended Smithery settings for this repo:

- repository: `Gajarthan/cse-mcp`
- branch: `master`
- base directory: `.`
- auto deploy: enable only after the first successful publish

See [SMITHERY.md](./SMITHERY.md) for the full GitHub-to-Smithery workflow, checklists, and common failure points.

## Releases

This repository already includes tag-driven release automation in [`.github/workflows/release.yml`](./.github/workflows/release.yml).

To create a GitHub release:

1. Update `package.json`, `src/index.ts`, `server.json`, and `glama.json` to the intended version
2. Add release notes to [CHANGELOG.md](./CHANGELOG.md)
3. Run `npm run release:check`
4. Create and push a semver tag such as `v2.0.1`
5. Open the draft GitHub release created by Actions, review the generated notes, and publish it

The workflow validates the release on both Ubuntu and Windows before drafting the GitHub release.

## Tool Reference

### `search_company`

Search the local CSV catalog by company name or ticker symbol.

Input:

```json
{
  "query": "john keells"
}
```

Returns:

- normalized query
- ranked matches
- symbol, company name, and match score

### `get_stock_quote`

Fetch a normalized quote for a valid CSE symbol.

Input:

```json
{
  "symbol": "JKH.N0000"
}
```

Returns:

- last price and previous close
- price change and percentage change
- day range and 52-week range
- volume, turnover, market cap, and beta values
- source metadata and fetched timestamp

### `get_market_status`

Fetch the current market session string from CSE and normalize it to a status plus inferred open/closed signal.

Input:

```json
{}
```

### `get_market_summary`

Fetch market-wide turnover, share volume, trade count, and trade date.

Input:

```json
{}
```

### `get_top_gainers`

Fetch the top market gainers.

Input:

```json
{
  "limit": 10
}
```

Notes:

- default `limit` is `10`
- maximum `limit` is `25`

### `get_top_losers`

Fetch the top market losers.

Input:

```json
{
  "limit": 10
}
```

Notes:

- default `limit` is `10`
- maximum `limit` is `25`

### `get_index_summary`

Fetch one or both supported index summaries.

Input:

```json
{
  "index": "all"
}
```

Allowed values:

- `aspi`
- `snp`
- `all`

## Configuration, Flags, and Environment Variables

### Current runtime configuration

- Transport: `stdio` only
- Required environment variables: none
- Required API keys: none
- Default upstream timeout: `10000ms`
- Default retry count for transient failures: `2`

### CLI flags

This project does not currently expose custom CLI flags. Run it with:

```bash
node dist/index.js
```

### Environment variables

This project does not currently require or document custom environment variables.

### TODO

If timeout, retry count, base URL override, or CSV path override should become user-configurable, they should be added explicitly and documented here rather than inferred from source code.

## Known Limitations

- This server supports `stdio` transport only
- The upstream CSE API is unofficial and may change without notice
- Market data correctness and availability depend on the CSE website
- Hosted HTTP/SSE deployment is not implemented yet
- Smithery GitHub publishing is documentation-aligned here, but the final build behavior should still be verified in your Smithery project UI and deployment logs

## Troubleshooting

### The client shows no tools

- Make sure the client supports local `stdio` MCP servers
- Make sure the path in `args` is absolute
- Run `npm run build` before pointing the client at `dist/index.js`
- Restart the MCP client after changing config
- If you are using the npm package path, make sure `npx @gajarthan/cse-mcp` works from your terminal

### The server fails to start

Run the server directly to inspect stderr:

```bash
node dist/index.js
```

Check:

- Node.js version is 20 or newer
- dependencies are installed
- `dist/index.js` exists
- the client config uses the correct path separator and quoting for your OS

### Quote lookup fails for a symbol

- Use `search_company` first to confirm the exact CSE symbol
- Symbols are validated against the bundled CSV catalog before quote calls
- If the symbol exists in CSE but not in the CSV, update `cse_companies.csv`

### Upstream timeouts or unexpected response errors

- The CSE API is unofficial and response shapes can change
- Retry a few minutes later to rule out transient issues
- Re-run with MCP Inspector or direct local execution to inspect stderr logs
- If the response shape changed, update the Zod parsing and normalization logic in `src/services/cseApi.ts`

### ChatGPT does not connect to this server

That is expected for now. This server is `stdio`-only, while ChatGPT's documented remote MCP flow expects SSE or streaming HTTP.

### Windows path issues

Use an absolute path and forward slashes in JSON config when possible:

```json
{
  "command": "node",
  "args": ["C:/absolute/path/to/cse-mcp/dist/index.js"]
}
```

If you do not want to deal with local paths, prefer the published package form:

```json
{
  "command": "npx",
  "args": ["-y", "@gajarthan/cse-mcp"]
}
```

If a client has trouble launching the package directly, use the explicit npm package form:

```json
{
  "command": "npx",
  "args": ["-y", "-p", "@gajarthan/cse-mcp", "cse-mcp"]
}
```

## Development

Install and build:

```bash
npm install
npm run build
```

Useful scripts:

- `npm run dev` - watch-mode development with `tsx`
- `npm run build` - compile TypeScript to `dist/`
- `npm run typecheck` - run TypeScript checks without emitting files
- `npm run start` - start the compiled server
- `npm run inspector` - launch MCP Inspector against the local build
- `npm run pack:check` - verify npm package contents without publishing
- `npm run release:check` - run typecheck, build, tests, and npm pack validation

Recommended local workflow:

1. Run `npm install`
2. Run `npm run typecheck`
3. Run `npm run build`
4. Run `npm run inspector`
5. Test at least:
   - `search_company`
   - `get_stock_quote`
   - `get_market_summary`
   - `get_index_summary`

Project layout:

- `src/index.ts` - MCP server bootstrap and stdio transport
- `src/services/companyLookup.ts` - CSV-backed symbol and company search
- `src/services/cseApi.ts` - CSE API HTTP calls, validation, retries, and normalization
- `src/tools/*.ts` - individual MCP tool definitions
- `src/utils/errors.ts` - safe error handling and stderr logging
- `src/utils/formatters.ts` - output formatting and normalization helpers

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).

## Contributing

This is an open source project, and contributions are welcome.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for local setup, validation steps, and pull request expectations.

Suggested contribution flow:

1. Fork the repository
2. Create a feature branch
3. Run `npm install`
4. Run `npm run typecheck`
5. Run `npm run build`
6. Test with MCP Inspector
7. Open a pull request with a clear summary

High-value contribution areas:

- new tools such as `chartData`, `allSectors`, and announcements
- stronger automated tests for normalization and error handling
- better handling of CSE response shape drift
- clearer client configuration docs as MCP client support evolves

If you discover a changed CSE response shape, include a sanitized example payload in the issue or PR whenever possible.
