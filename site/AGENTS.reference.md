# Site Reference

## Provenance And Decisions

- Agentskill version: `2.1.0`
- Evidence schema version: `4`
- Repository revision: `f4b0c1cccf4d03aa2c30a4b0998a0879afdf6d87`
- Configuration: default signature enabled
- Maintainer-confirmed decisions: Adopt `site` as a managed scope. Budget `standard`. Signature `auto`.
- Unresolved uncertainty: Analyzer evidence labels TypeScript tests as jest; `package.json` and configs use Vitest plus Playwright. Treat source as authoritative.

## Architecture

The catalog is a derived view of `../README.md`, not a second inventory. `src/lib/parse-readme.ts` parses GFM with `unified`/`remark-gfm`, skips the Contents heading, keeps duplicate occurrences, and fails the build on missing links, empty names, empty descriptions, undefined reference links, and non-`http`/`https` URLs.

`src/lib/github.ts` requests star counts with a 1500ms timeout and returns `null` on failure so the page still renders a GitHub control. `src/pages/index.astro` serializes resources into `#catalog-data`; `src/scripts/catalog.ts` enhances search, filters, and sorting when JavaScript is available.

Client URL state uses `q`, repeated `category`, and `sort` (`classic`, `relevance`, `az`, `za`). Theme is stored under `awesome-steam-deck-theme`. Visual tokens live in `src/styles/global.css` (Tailwind v4 plus CSS custom properties).

## Testing Topology

- Vitest: `tests/parser.test.ts`, Node environment, `@` path alias from `vitest.config.ts`.
- Playwright: `tests/e2e/catalog.spec.ts`, Chromium, `pnpm preview` on `127.0.0.1:4321`.
- CI: the repository Site workflow runs format, `astro check`, build, Vitest, then Playwright.

## Ownership

List submissions belong in `../README.md` and `../CONTRIBUTING.md`. Site source is MIT (`LICENSE`); curated list content is CC0.

---

> Generated and maintained by [Agentskill](https://github.com/airscripts/agentskill).
> Do not touch this file. It is automatically managed by Agentskill.
