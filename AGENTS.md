# Repository guidance

## Mission and repository map

This repository maintains the Awesome Steam Deck README and a static Astro catalog in `site/`. The root README is the catalog source; `site/src/lib/parse-readme.ts` is the only catalog extraction path. UI code lives in `site/src/pages`, `site/src/layouts`, `site/src/scripts`, and `site/src/styles`; parser and browser tests live in `site/tests`.

## Non-negotiables

- Keep the catalog derived from the root README; never commit a second resource catalog.
- Preserve resource order and duplicate occurrences when changing the parser or UI.
- Reject malformed entries and unsafe URL schemes with source locations.
- Keep the generated site static, keyboard accessible, and usable without JavaScript.

## Don’ts

- Do not edit generated `site/dist` output or commit `site/node_modules`.
- Do not add a server adapter, public API, analytics, accounts, or client-side catalog fetching.
- Do not bypass parser, type, build, or browser validation for catalog changes.

## Quick-start commands

Run from the repository root: `pnpm --dir site install`, `pnpm --dir site dev`, `pnpm --dir site test`, `pnpm --dir site check`, `pnpm --dir site build`, and `pnpm --dir site test:e2e`.

## Change routing and architecture

README shape or extraction behavior belongs in `site/src/lib/parse-readme.ts` and `site/tests/parser.test.ts`. Build-time GitHub metadata belongs in `site/src/lib/github.ts`. Interaction changes belong in `site/src/scripts/catalog.ts` with browser coverage. Layout and visual tokens belong in `site/src/styles/global.css` and Astro components. Keep URL state in `q`, repeated `category`, and `sort` parameters.

## Testing and validation

Parser tests must cover the 20-category/158-occurrence baseline and malformed/reference-link cases. `astro check` must report no diagnostics; production builds must contain the complete catalog; browser tests cover search, external links, dialog focus, and serious/critical accessibility violations.

## Free Region

<!-- Maintainer customs go here. -->

---

> Generated and maintained by [Agentskill](https://github.com/airscripts/agentskill).
> Do not touch this file. It is automatically managed by Agentskill.
