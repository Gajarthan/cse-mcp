# Smithery Publishing Guide

This project is prepared for Smithery publishing through the GitHub repository integration path.

## Current Support

- Transport: local `stdio`
- Package source: npm package `@gajarthan/cse-mcp`
- Repository source: `Gajarthan/cse-mcp`
- Public HTTPS MCP endpoint: not implemented

This means the intended Smithery path is GitHub-based publishing, not public URL publishing.

## What Smithery Needs

Verified from Smithery docs:

- A connected GitHub repository
- A selected branch
- A base directory inside that repository
- Optional `autoDeploy`

The Smithery repository connection API documents these fields:

- `repoOwner`
- `repoName`
- `baseDirectory`
- `branch`
- `autoDeploy`

## Recommended Settings For This Repo

- Repository: `Gajarthan/cse-mcp`
- Branch: `master`
- Base directory: `.`
- Auto deploy: `true` after the first successful publish, otherwise `false` for the first run if you want a manual checkpoint

## Recommended Release Structure

For GitHub-based Smithery publishing, keep the repo in this shape:

- `package.json` with correct package metadata
- clean `bin` entry
- reproducible `build` script
- passing `npm test`
- published npm package version that matches the code you want Smithery to use
- stable README install instructions
- clear changelog and release notes

## Pre-Publish Checklist

1. Confirm `package.json`, `src/index.ts`, and `server.json` all use the same version
2. Run:

```bash
npm run release:check
```

3. Confirm the npm package can start from outside the repo:

```bash
npx -y @gajarthan/cse-mcp
```

4. Publish the intended package version to npm:

```bash
npm publish --access public
```

5. Confirm the new version is live:

```bash
npm view @gajarthan/cse-mcp version
```

## GitHub-To-Smithery Publish Flow

1. Connect the GitHub repository in Smithery
2. Select branch `master`
3. Set base directory to `.`
4. Choose whether to enable `autoDeploy`
5. Trigger the initial publish from the connected repo
6. Watch Smithery deployment logs until the release completes
7. Verify the generated install page and server metadata

## Post-Publish Checklist

1. Verify the Smithery page shows the correct repository and branch
2. Verify install instructions match the npm package you published
3. Test the installed server from a supported MCP client
4. Add a GitHub release note if the publish corresponds to a tagged version

## Common Failure Points

- `package.json` version does not match the code being built
- README install commands drift from real package behavior
- npm package version has not been published before Smithery tries to use it
- GitHub branch or base directory is set incorrectly
- repo build passes locally but fails in CI because of shell-specific test commands
- missing permissions or disconnected GitHub App integration in Smithery

## Known Limitations

- No hosted HTTP or SSE transport yet
- Upstream CSE API is unofficial and may change without notice
- Smithery GitHub/repo integration behavior is partly documentation-based here and should be verified in your actual Smithery project UI before enabling `autoDeploy`
