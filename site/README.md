# Site

A static catalog of the Awesome Steam Deck list.

## Contents

- [Overview](#overview)
- [Source of Truth](#source-of-truth)
- [Requirements](#requirements)
- [Quick Start](#quick-start)
- [Layout](#layout)
- [Validation](#validation)
- [Deployment](#deployment)
- [Security](#security)
- [Contributing](#contributing)
- [Sponsorship](#sponsorship)
- [License](#license)

## Overview

This package turns the curated resources in the repository-root
[`README.md`](../README.md) into a searchable, keyboard-accessible website.
The generated site is fully static: there is no server adapter, public API,
analytics surface, or client-side catalog fetch.

The list remains the product. The catalog is a derived view of that list,
not a second inventory of resources.

## Source of Truth

Every catalog entry is extracted at build time from the root README by
[`src/lib/parse-readme.ts`](src/lib/parse-readme.ts). That parser is the only
extraction path.

Malformed entries and non-HTTP(S) URLs fail the build with a README source
location. Resource order and duplicate occurrences are preserved on purpose:
the catalog should match the list, not invent a different ranking.

GitHub star counts are requested during the build with a short timeout. A
failed request leaves a normal GitHub button in the generated HTML instead of
blocking the site.

Client URL state uses `q`, repeated `category`, and `sort` parameters. Search,
filters, and sorting enhance the page when JavaScript is available; the full
catalog remains usable without it.

## Requirements

| Tool    | Version          |
| ------- | ---------------- |
| Node.js | 24 or newer      |
| pnpm    | 11.15.0 or newer |

Install dependencies from the repository root:

```bash
pnpm --dir site install
```

## Quick Start

```bash
pnpm --dir site dev
```

The development server watches the root README and performs a full reload when
that file changes.

## Layout

| Path                                                                                                             | Responsibility                    |
| ---------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| [`src/lib/parse-readme.ts`](src/lib/parse-readme.ts)                                                             | README extraction                 |
| [`src/lib/github.ts`](src/lib/github.ts)                                                                         | Build-time GitHub metadata        |
| [`src/pages`](src/pages), [`src/layouts`](src/layouts), [`src/scripts`](src/scripts), [`src/styles`](src/styles) | Catalog UI                        |
| [`tests`](tests)                                                                                                 | Parser tests and browser coverage |

Do not edit generated `dist` output or commit `node_modules`.

## Validation

Required gates from the repository root:

```bash
pnpm --dir site format:check
pnpm --dir site check
pnpm --dir site build
pnpm --dir site test
pnpm --dir site test:e2e
```

| Command                        | What it checks                                                             |
| ------------------------------ | -------------------------------------------------------------------------- |
| `pnpm --dir site format:check` | Prettier formatting                                                        |
| `pnpm --dir site check`        | Astro and TypeScript diagnostics                                           |
| `pnpm --dir site build`        | Production output contains the complete catalog                            |
| `pnpm --dir site test`         | Parser baseline, malformed entries, and reference links                    |
| `pnpm --dir site test:e2e`     | Search, external links, dialog focus, and serious accessibility violations |

The Site GitHub Actions workflow runs those gates sequentially as Verify, Build,
and Test on changes to the README or this package. Deployment is handled by
Vercel, not GitHub Actions.

## Deployment

Configure the Vercel project root as `site/` and allow the build to read parent
source files so it can parse the root README. [`vercel.json`](vercel.json) uses
a frozen pnpm install and emits `dist`. The repository-level fallback config
supports deployments that are configured from the repository root instead.

`PUBLIC_SITE_URL` sets the canonical production origin and sitemap host. Vercel
preview deployments receive `noindex` metadata through `VERCEL_ENV=preview`.

The default production origin is
[awesome-steam-deck.vercel.app](https://awesome-steam-deck.vercel.app/).

## Security

Report catalog or site vulnerabilities through the process in
[`SECURITY.md`](../SECURITY.md). Do not include tokens or other credentials in
reports.

## Contributing

List submissions belong in the root README and must follow
[`CONTRIBUTING.md`](../CONTRIBUTING.md). Catalog or site changes belong in this
directory and should keep the generated page derived from that README.

## Sponsorship

Awesome Steam Deck is maintained by Airscripts. If the list or catalog is
useful, sponsor ongoing curation through
[GitHub Sponsors](https://github.com/sponsors/airscripts).

## License

This package is dual licensed:

| Material                                                  | License | File                       |
| --------------------------------------------------------- | ------- | -------------------------- |
| Curated list content from the root README                 | CC0 1.0 | [`../LICENSE`](../LICENSE) |
| Site source, styles, tests, and tooling in this directory | MIT     | [`LICENSE`](LICENSE)       |

The generated catalog HTML includes derived list content. Reuse of that content
follows the root CC0 dedication. Reuse of the site implementation follows MIT.
