# npm Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Configure a tested npm release pipeline in `ekho/telegram-api-mcp`.

**Architecture:** Existing TypeScript server, npm lifecycle preparation, packed-artifact smoke test, CI for `master`, and OIDC publication on a stable GitHub release. A manual workflow run is validation-only.

**Tech Stack:** Node 24, npm 11.21.3, TypeScript, Vitest, GitHub Actions, npm OIDC.

**Spec:** `docs/superpowers/specs/2026-11-23-npm-release-design.md`

## Global Constraints

- Repository: `ekho/telegram-api-mcp`; npm package: `@ekho/telegram-api-mcp`; CLI: `telegram-api-mcp`.
- Preserve upstream MIT license and author.
- Do not publish a version until the npm account and publisher are configured.
- Do not send Telegram requests during CI or local verification.

## Review Focus

- A missing compiled CLI must fail the package smoke test.
- A mismatched release tag must fail before publication.
- PR and manual validation runs must not publish or inherit registry tokens.
- Provenance metadata must reference the fork and the exact tested archive must be published.
- Initial npm account setup must not rely on the GitHub username matching an npm scope.

### Task 1: Package preparation and artifact verification

**Files:** `package.json`, `package-lock.json`, `server.json`, `smithery.yaml`, `scripts/smoke-package.mjs`, `README.md`.

- [x] Check the existing test baseline.
- [x] Demonstrate a smoke-test failure for an archive lacking the compiled CLI.
- [x] Add preparation and fork metadata; update lockfile and pnpx instructions.
- [x] Build, test, pack, and verify MCP initialize/tools/list from the installed archive.

### Task 2: Publication automation

**Files:** `.github/workflows/ci.yml`, `.github/workflows/publish.yml`, `.github/workflows/star-history.yml`, `docs/PUBLISHING.md`.

- [x] Add stable release/version and repository checks, OIDC, and a validation-only manual trigger.
- [x] Correct CI branch and verify YAML and release conditions.
- [x] Review the complete diff independently and address material findings.
- [x] Commit to the fork, enable Actions, and observe CI.
- [ ] Complete or hand off authenticated npm bootstrap and Trusted Publisher settings.

## Verification and decisions

- Remote [CI run 45138279792](https://github.com/ekho/telegram-api-mcp/actions/runs/45138279792)
  passed all six OS/Node jobs at commit `30d1e196c3a680e88c0d4bd0c50f0cae861a33f2`.
- The validation-only [manual publish workflow run 45138470793](https://github.com/ekho/telegram-api-mcp/actions/runs/45138470793)
  also passed; it did not publish an npm version.
- Upstream baseline: 58 Vitest tests passed.
- The smoke test rejected an archive with no compiled CLI; after adding `prepare`,
  the installed archive completed MCP initialize/tools/list (190 tools).
- A matching release tag passed; a mismatching tag failed.
- User correction: package name is `@ekho/telegram-api-mcp`; no npm scope was inferred
  from the GitHub account.
- Independent review found that the initial single job exposed OIDC permission to
  manual validation. Fixed by splitting read-only validation from release-only
  publication and passing the tested archive by artifact ID. The permission check
  failed before this change and passed afterward.
- npm bootstrap and Trusted Publisher configuration require the user's authenticated
  npm account. No npm token or Telegram credential has been stored.
