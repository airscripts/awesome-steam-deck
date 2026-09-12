# Repository Guidance

## Mission And Repository Map

This repository maintains the Awesome Steam Deck README and a static Astro catalog in `site/`. The root README is the catalog source. Site implementation guidance lives in `site/AGENTS.md`.

## Non-Negotiables

- Keep the catalog derived from the root README; never commit a second resource catalog.
- Preserve resource order and duplicate occurrences when changing the parser or UI.
- Reject malformed entries and unsafe URL schemes with source locations.
- Keep the generated site static, keyboard accessible, and usable without JavaScript.

## Don’ts

- Do not edit generated `site/dist` output or commit `site/node_modules`.
- Do not add a server adapter, public API, analytics, accounts, or client-side catalog fetching.
- Do not bypass parser, type, build, or browser validation for catalog changes.

## Quick-Start Commands

Run from the repository root: `pnpm --dir site install`, `pnpm --dir site dev`, `pnpm --dir site test`, `pnpm --dir site check`, `pnpm --dir site build`, and `pnpm --dir site test:e2e`.

## Change Routing And Architecture

List submissions belong in the root README. Catalog extraction, UI, and site tests belong in `site/` and follow `site/AGENTS.md`.

## Testing And Validation

`.github/workflows/site.yml` runs format, `astro check`, production build, Vitest parser tests, and Playwright coverage on README or `site/` changes.

## Free Region

<!-- Maintainer customs go here. -->

---

> Generated and maintained by [Agentskill](https://github.com/airscripts/agentskill).
> Do not touch this file. It is automatically managed by Agentskill.
