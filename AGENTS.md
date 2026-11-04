# AGENTS.md

## What this repo is

The source for the GitHub profile shown at <https://github.com/ronny1020>. `README.md` is **generated** — a GitHub Action rebuilds it daily from the GitHub, npm, and Open-Meteo APIs.

## Commands

```bash
bun install
bun run update:readme   # regenerate README.md and live-badge/
bun test                # unit tests (no network)
bun run typecheck       # bun --check (TypeScript built into Bun)
bun lint                # type-aware, fails on any warning (gated in CI)
bun run format          # bun fmt
bun run format:check    # bun fmt --check (gated in CI)
```

`update:readme` calls the GitHub API. Unauthenticated runs share a 60 requests/hour limit and the search endpoint is stricter, so export a token before rebuilding locally:

```bash
GITHUB_TOKEN=$(gh auth token) bun run update:readme
```

## Architecture

```
mainProfile.md          hand-written template with <!-- generated:<name> --> markers
updateREADME.ts         entry point: fetch → render → write README.md and live-badge/
utils/config.ts         username, endpoints, limits, paths, EXCLUDED_REPOS
utils/types.ts          response types derived from @octokit/types
utils/github.ts         GitHub REST client and fetchers
utils/npm.ts            npm registry lookups
utils/npmDownloads.ts   install counts (bulk endpoint rejects scoped names) and the packages-table floor
utils/repos.ts          repo filtering, selection, descriptions
utils/siteLinks.ts      reachable-homepage checks for demo links
utils/weather.ts        today's Taipei forecast, sun times and peak US AQI via the `openmeteo` client (no key)
utils/liveBadge.ts      animated "live" status pill (SVG)
utils/format.ts         numbers, dates, shields URLs, markdown table helpers
utils/template.ts       marker replacement
utils/sections/*.ts     one module per generated section (except plain formatter calls)
utils/sections/index.ts renderSections(): marker name → rendered markdown
utils/fixtures.ts       test payload builders
README.md               generated output — never edit by hand
live-badge/             generated {light,dark}.svg — never edit by hand
```

Every static heading, badge, and prose line lives in `mainProfile.md`; everything data-driven is a marker filled by a section renderer, including a sentence whose wording changes with the data (the weather greeting). The live badge's label is the exception: it is drawn inside the SVG, so its wording lives in `utils/liveBadge.ts`.

## Adding a generated section

1. Add `<!-- generated:<name> -->` to `mainProfile.md` where it belongs.
2. Add `utils/sections/<name>.ts` exporting `render<Name>()`, and export it from `utils/sections/index.ts`.
3. Add the marker name and its renderer to `renderSections` in `utils/sections/index.ts` — `utils/sections/index.test.ts` asserts the marker set and the registry keys match exactly.
4. Add `utils/sections/<name>.test.ts` covering the empty case and the data it formats.

A marker whose value is a single `utils/format.ts` call (`lastUpdated` is `formatTimestamp`) skips steps 2 and 4 and maps straight to that call in `renderSections`; its test lives with the formatter.

An unmapped marker is left verbatim in `README.md`, which is the signal that step 3 is missing.

## Conventions

- **Reach beats vanity.** Lead with what shows outside use — installs, upstream reach, maintained commits — not repository, follower, or profile-view counts.
- **Tables must fit 348px.** GitHub gives a phone README column 348px and wraps nothing in a scroll container, so anything wider is silently cut off. Keep tables at three columns or fewer and push extra facts into a `<br><sub>` line under the first cell; a list never clips at all.
- **Evidence floors.** A tool or theme needs `MIN_EVIDENCE_COUNT` repositories behind it, and the generated stack stays silent below `MIN_STACK_TOOLS` rather than publishing an almost-empty row.
- **Escape API text in tables** with `escapeTableCell`; a `|` or `[` in a description or PR title otherwise breaks the row.
- **Types come from `@octokit/types`**, narrowed with `Required<Pick<…>>`. Do not hand-write GitHub response shapes.
- **Packages and Featured don't overlap.** A package needs `MIN_MONTHLY_INSTALLS` for a packages-table row; the rest are counted on one line under the table. A project whose package family has a row is left out of Featured projects, which then takes the next most starred project. That check looks up npm metadata for every candidate repository, one registry request each.
- **Credit Open-Meteo and CAMS.** Their terms require a visible reference wherever their data appears — Open-Meteo for the forecast, CAMS for air quality; both links sit at the foot of `mainProfile.md`.
- **Renderers are pure** — they take data and return markdown or SVG. All fetching lives in `github.ts`, `npm.ts`, `npmDownloads.ts`, `siteLinks.ts`, and `weather.ts`; all file writes in `updateREADME.ts`.
- **Tests never hit the network.** Mock `globalThis.fetch` with the `mockFetch` helper (the `openmeteo` client, which parses FlatBuffers, is mocked whole with `mock.module`) and build payloads with `utils/fixtures.ts`.
- **Own-organisation work is not an upstream contribution.** `EXCLUDED_OWNERS` in `utils/config.ts` drops those accounts from the contributions search; add private organisations through the `EXCLUDED_OWNERS` environment variable (comma separated) so their names stay out of this public repo.
- **Dates and counts use `&nbsp;`** so a narrow table column cannot wrap `Aug 17, 2026` after the comma.
- **Release manifests stay out of the showcase.** Homebrew taps (`homebrew-*`) and Scoop buckets (`*scoop-bucket`) are skipped from Featured and Recently pushed, but still count in totals.
- **Hide a repository** by adding its name to `EXCLUDED_REPOS` in `utils/config.ts`; that filter also removes it from star, fork, and language totals.
- **Never publish private data.** Both PR searches pin `is:public` and `getStarredRepos` filters `private` stars — a local run uses a `repo`-scoped token that can see work repositories.
- **Motion lives in SVG.** GitHub strips CSS and scripts from a README, so the live badge animates inside its own SVG, which the workflow commits with the README. It honours `prefers-reduced-motion`.
- **Summary cards are self-hosted.** The workflow runs `vn7n24fzkq/github-profile-summary-cards` with `AUTO_PUSH: false` and commits `profile-summary-card-output/{default,github_dark}` alongside the README; the shared card service rate limits and rendered "Cards are temporarily rate limited" in place of four of the five cards. The action writes all 65 themes — only those two folders are added to git.
- **Card hosts must answer fast.** GitHub proxies every image through camo, which gives up after a few seconds and serves a 504 — a card host that needs 6s renders as broken on the profile even though `curl` says 200. Time a new host before adding it (`streak-stats.demolab.com` was dropped for this).
- **Only publish links that resolve.** `siteLinks.ts` drops homepages that 404, time out, or fail to connect, and card hosts are checked before being introduced — the profile previously broke when `github-readme-stats.vercel.app` was paused, and when `github-readme-activity-graph.vercel.app` began returning 402.
- **Bun is the whole toolchain** — no Prettier, ESLint, or `typescript` package:
  - `bun fmt` formats with `.prettierrc.json` and skips `.prettierignore`.
  - `bun lint` runs type-aware rules and fails on any warning (`bunfig.toml`); fix a finding rather than suppressing it. It ships only in canary builds so far, so CI installs `canary` — run `bun upgrade --canary` locally.
  - `bun --check` type-checks with the TypeScript built into Bun; `utils/toolchain.test.ts` pins its version so a Bun upgrade that moves it fails loudly.
  - `.githooks/pre-commit` formats and lint-fixes staged files, then runs the format, lint, and type checks on an export of the index, so unstaged edits and untracked files neither hide nor cause a failure. A file with both staged and unstaged edits that still needs fixing blocks the commit — Bun won't rewrite it; stage it whole or fix it first. `bun install` enables it through the `prepare` script. CI runs format and lint across every file, plus the type-check and tests.

## Committing

README-bot pushes a regenerated `README.md` and `live-badge/` after every run, so `git pull --rebase` before committing; otherwise the push is rejected and the generated file conflicts. Resolve such a conflict by rerunning `bun run update:readme`, never by hand-merging `README.md` or the badges.

## CI

`.github/workflows/build_profile.yml` runs on push to `master`, daily at 16:00 UTC, and on demand: install → typecheck + lint + format check + test → generate summary cards → regenerate → commit `README.md` and `live-badge/` as `README-bot` if they changed. The generator step receives `GITHUB_TOKEN`; Open-Meteo needs no key.
