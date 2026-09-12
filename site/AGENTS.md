# Site Guidance

## Scope

- Path: site
- Parent: .
- Inheritance: additive; nearest scope wins.

This package inherits repository rules from `../AGENTS.md`.

## Mission And Repository Map

This package turns the root `../README.md` into a static Astro catalog. `src/lib/parse-readme.ts` is the only extraction path. UI lives in `src/pages`, `src/layouts`, `src/scripts`, and `src/styles`. Parser tests live in `tests/parser.test.ts`; browser coverage lives in `tests/e2e/catalog.spec.ts`.

## Non-Negotiables

- Extract every catalog entry at build time through `src/lib/parse-readme.ts`.
- Preserve README resource order and duplicate occurrences; resource ids are `{categoryId}-{sourceOrder}`.
- Reject malformed entries and non-HTTP(S) URLs with `README.md:line:column` locations.
- Keep `output: "static"` in `astro.config.mjs` and keep the catalog usable without JavaScript.

## Don’ts

- Do not edit generated `dist` output or commit `node_modules`.
- Do not change `output: "static"` in `astro.config.mjs`.
- Do not replace URL state keys `q`, repeated `category`, and `sort`.

## Quick-Start Commands

From this directory: `pnpm install`, `pnpm dev`, `pnpm format:check`, `pnpm check`, `pnpm build`, `pnpm test`, and `pnpm test:e2e`. Node.js 24+ and pnpm 11.15.0+ are required by `package.json`.

## Change Routing And Architecture

README shape or extraction belongs in `src/lib/parse-readme.ts` and `tests/parser.test.ts`. Build-time GitHub stars belong in `src/lib/github.ts` and must fail open. Interaction belongs in `src/scripts/catalog.ts` with Playwright coverage. Layout and tokens belong in `src/styles/global.css` and Astro components. Import site modules with the `@` path alias from `tsconfig.json`.

## Implementation Conventions

TypeScript and Astro use ESM and 2-space indentation. Format with Prettier (`prettier.config.mjs` plus `prettier-plugin-astro`). `astro.config.mjs` lets Vite read the repo root, reloads when `../README.md` changes, and uses `PUBLIC_SITE_URL` (default `https://awesome-steam-deck.vercel.app`). Preview deploys (`VERCEL_ENV=preview`) are `noindex`. `vercel.json` builds to `dist` with a frozen pnpm install.

## Testing And Validation

`pnpm test` (Vitest) must keep the 20-category/158-occurrence baseline plus malformed and reference-link cases. `pnpm check` must report no diagnostics. `pnpm build` must contain the complete catalog. `pnpm test:e2e` (Playwright) covers search, external links, dialog focus, URL state, and serious/critical axe violations.

## Free Region

<!-- Maintainer customs go here. -->

## Further Context

See `AGENTS.reference.md` for provenance and rationale.

---

> Generated and maintained by [Agentskill](https://github.com/airscripts/agentskill).
> Do not touch this file. It is automatically managed by Agentskill.
