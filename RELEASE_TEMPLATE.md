# Release {{version}}

## Summary

Short description of what changed in this release.

## Highlights

- 
- 
- 

## Install

### npm

```bash
npx -y @gajarthan/cse-mcp
```

### Local development

```bash
npm install
npm run build
node dist/index.js
```

## MCP Client Example

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

## Validation

- [ ] `npm run release:check`
- [ ] npm package version published
- [ ] MCP Registry metadata verified
- [ ] Smithery publish verified
- [ ] README install flow rechecked

## Known Limitations

- `stdio` transport only
- no hosted HTTP or SSE endpoint yet
- upstream CSE API is unofficial and may change without notice

## Upgrade Notes

- 

## Links

- GitHub repo: https://github.com/Gajarthan/cse-mcp
- npm package: https://www.npmjs.com/package/@gajarthan/cse-mcp
- MCP Registry: https://registry.modelcontextprotocol.io/v0.1/servers?search=io.github.Gajarthan/cse-mcp
