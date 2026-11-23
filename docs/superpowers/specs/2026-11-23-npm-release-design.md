# npm publication for the ekho fork

## Intent

Create a public fork of timoncool/telegram-api-mcp and publish its built MCP CLI
to npm through GitHub Actions. Keep upstream attribution and runtime behavior.

## Approach

Use npm Trusted Publishing (OIDC), a published stable GitHub release, and a
separate CI workflow. A permanent npm token would need rotation and is unnecessary.
Manual local publication remains a one-time bootstrap option, not the release flow.

Implementation choices: repository `ekho/telegram-api-mcp`, npm package
`@ekho/telegram-api-mcp` (explicitly selected by the user), unchanged CLI
binary `telegram-api-mcp`, Node 24 for releases, and version `0.2.1` for the fork.
The npm account has not been authenticated; registry bootstrap and trusted-publisher
binding must be completed before the first automated publication.

## Behavior

- Add `prepare` so Git dependencies and packed packages contain `dist/index.js`.
- Align package, lockfile, MCP metadata, and installation examples with the fork.
- CI validates pushes and pull requests targeting `master`.
- A published stable release must have a tag exactly matching `v<package version>`.
- Manual publication-workflow runs validate the package without publishing it.
- Build, test, pack, install the actual archive, and complete an MCP handshake before publishing.
- Only the publication job receives `id-token: write`; no npm token is stored.
- Preserve the original license and author, and disable upstream-only star-chart automation in forks.

## Completion

Changes are committed to the fork and CI passes. Account-side npm setup is either
completed through an authenticated user session or clearly handed off with exact steps.
