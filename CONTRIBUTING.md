# Contributing

Thanks for contributing to `cse-mcp`.

## What This Project Is

`cse-mcp` is a TypeScript MCP server for Colombo Stock Exchange data. It currently supports local `stdio` transport and packages cleanly for npm, the official MCP Registry, and GitHub-based Smithery publishing.

## Before You Start

- Node.js 20 or newer
- npm 10 or newer
- Internet access if you are testing against the live CSE API

Install dependencies:

```bash
npm install
```

## Local Development

Useful commands:

```bash
npm run dev
npm run build
npm run typecheck
npm test
npm run inspector
npm run release:check
```

## Project Layout

- `src/index.ts` - MCP server bootstrap and stdio transport
- `src/services/companyLookup.ts` - CSV-backed lookup and search
- `src/services/cseApi.ts` - upstream HTTP calls, retries, timeouts, and normalization
- `src/tools/*.ts` - thin MCP tool registration modules
- `src/utils/*.ts` - formatting and error helpers
- `tests/*.test.ts` - minimal automated coverage

## Contribution Guidelines

- Keep handlers thin. Put upstream request and normalization logic in services.
- Do not trust undocumented CSE response shapes blindly.
- Prefer safe, AI-friendly normalized JSON over raw payload pass-through.
- Log only to stderr, never stdout.
- Preserve `stdio` compatibility and MCP Inspector compatibility.
- Add or update tests when behavior changes.
- Keep documentation aligned with real package behavior.

## Pull Request Checklist

Before opening a pull request:

1. Run `npm run release:check`
2. Test at least one real MCP flow with Inspector or a compatible client
3. Update `README.md` if install flow, package behavior, or tool outputs changed
4. Update `CHANGELOG.md` for user-visible changes

## Releases

Use GitHub tags and releases for published versions. If a change affects packaging, registry metadata, or Smithery publishing, make sure `package.json`, `src/index.ts`, and `server.json` stay aligned.

### Semantic Version Tagging

Patch release:

```bash
git tag v2.0.2
git push origin v2.0.2
```

Minor release:

```bash
git tag v2.1.0
git push origin v2.1.0
```

Major release:

```bash
git tag v3.0.0
git push origin v3.0.0
```

Before tagging a release:

1. Update `CHANGELOG.md`
2. Confirm version alignment in `package.json`, `src/index.ts`, and `server.json`
3. Run `npm run release:check`
4. Publish npm if needed
5. Publish or verify downstream listings such as the MCP Registry and Smithery
