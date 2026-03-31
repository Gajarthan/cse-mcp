# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project aims to follow Semantic Versioning.

## [Unreleased]

### Added
- Baseline automated tests for company lookup, formatter normalization, and mocked CSE API smoke coverage.
- Cross-platform GitHub Actions CI for install, typecheck, build, and tests.
- Open-source project hygiene files including `LICENSE`, `CONTRIBUTING.md`, issue templates, and Smithery publishing guidance.

### Changed
- Improved package metadata for npm and GitHub consumers.
- Added release-check scripts and `prepack` build automation.

## [2.0.1] - 2026-03-31

### Changed
- Aligned package metadata with MCP registry ownership requirements.
- Added `server.json` metadata for the official MCP Registry.

## [2.0.0] - 2026-03-31

### Added
- Initial TypeScript MCP server for Colombo Stock Exchange company search, stock quotes, market status, market summary, top movers, and index summaries.
- CSV-backed company lookup service.
- Defensive CSE API normalization, timeout handling, retries, and stderr-only logging.
- Initial README with MCP client configuration guidance.
