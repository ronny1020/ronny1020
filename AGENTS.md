# AGENTS.md

## What this repo is

The source for the GitHub profile shown at <https://github.com/ronny1020>. `README.md` is **generated** — a GitHub Action rebuilds it daily from the GitHub and npm APIs.

## Commands

```bash
bun install
bun run update:readme   # regenerate README.md
bun test                # unit tests (no network)
bun run typecheck       # tsc --noEmit
bun run format          # prettier --write .
bun run format:check    # prettier --check . (gated in CI)
```

`update:readme` calls the GitHub API. Unauthenticated runs share a 60 requests/hour limit and the search endpoint is stricter, so export a token before rebuilding locally:

```bash
GITHUB_TOKEN=$(gh auth token) bun run update:readme
```

## Architecture

```
mainProfile.md          hand-written template with <!-- generated:<name> --> markers
updateREADME.ts         entry point: fetch → render → write README.md
utils/config.ts         username, endpoints, limits, paths, EXCLUDED_REPOS
utils/types.ts          response types derived from @octokit/types
utils/github.ts         GitHub REST client and fetchers
utils/npm.ts            npm registry lookups
utils/npmDownloads.ts   install counts (bulk endpoint rejects scoped names)
utils/repos.ts          repo filtering, selection, descriptions
utils/siteLinks.ts      reachable-homepage checks for demo links
utils/format.ts         numbers, dates, shields URLs, markdown table helpers
utils/template.ts       marker replacement
utils/sections/*.ts     one module per generated section
utils/sections/index.ts renderSections(): marker name → rendered markdown
utils/fixtures.ts       test payload builders
README.md               generated output — never edit by hand
```

Every static heading, badge, and prose line lives in `mainProfile.md`; everything data-driven is a marker filled by a section renderer.

## Adding a generated section

1. Add `<!-- generated:<name> -->` to `mainProfile.md` where it belongs.
2. Add `utils/sections/<name>.ts` exporting `render<Name>()`, and export it from `utils/sections/index.ts`.
3. Add the marker name and its renderer to `renderSections` in `utils/sections/index.ts` — `utils/sections/index.test.ts` asserts the marker set and the registry keys match exactly.
4. Add `utils/sections/<name>.test.ts` covering the empty case and the data it formats.

An unmapped marker is left verbatim in `README.md`, which is the signal that step 3 is missing.

## Conventions

- **Reach beats vanity.** Lead with what shows outside use — installs, upstream reach, maintained commits — not repository, follower, or profile-view counts.
- **Tables must fit 348px.** GitHub gives a phone README column 348px and wraps nothing in a scroll container, so anything wider is silently cut off. Keep tables at three columns or fewer and push extra facts into a `<br><sub>` line under the first cell; a list never clips at all.
- **Evidence floors.** A tool or theme needs `MIN_EVIDENCE_COUNT` repositories behind it, and the generated stack stays silent below `MIN_STACK_TOOLS` rather than publishing an almost-empty row.
- **Escape API text in tables** with `escapeTableCell`; a `|` or `[` in a description or PR title otherwise breaks the row.
- **Types come from `@octokit/types`**, narrowed with `Required<Pick<…>>`. Do not hand-write GitHub response shapes.
- **Renderers are pure** — they take data and return markdown. All fetching lives in `github.ts`, `npm.ts`, and `siteLinks.ts`.
- **Tests never hit the network.** Mock `globalThis.fetch` with the `mockFetch` helper and build payloads with `utils/fixtures.ts`.
- **Own-organisation work is not an upstream contribution.** `EXCLUDED_OWNERS` in `utils/config.ts` drops those accounts from the contributions search; add private organisations through the `EXCLUDED_OWNERS` environment variable (comma separated) so their names stay out of this public repo.
- **Dates and counts use `&nbsp;`** so a narrow table column cannot wrap `Aug 17, 2026` after the comma.
- **Hide a repository** by adding its name to `EXCLUDED_REPOS` in `utils/config.ts`; that filter also removes it from star, fork, and language totals.
- **Never publish private data.** Both PR searches pin `is:public` and `getStarredRepos` filters `private` stars — a local run uses a `repo`-scoped token that can see work repositories.
- **Summary cards are self-hosted.** The workflow runs `vn7n24fzkq/github-profile-summary-cards` with `AUTO_PUSH: false` and commits `profile-summary-card-output/{default,github_dark}` alongside the README; the shared card service rate limits and rendered "Cards are temporarily rate limited" in place of four of the five cards. The action writes all 65 themes — only those two folders are added to git.
- **Card hosts must answer fast.** GitHub proxies every image through camo, which gives up after a few seconds and serves a 504 — a card host that needs 6s renders as broken on the profile even though `curl` says 200. Time a new host before adding it (`streak-stats.demolab.com` was dropped for this).
- **Only publish links that resolve.** `siteLinks.ts` drops homepages that 404, time out, or fail to connect, and card hosts are checked before being introduced — the profile previously broke when `github-readme-stats.vercel.app` was paused.
- Prettier is the formatter, and `bun run format:check` is gated in CI — run `bun run format` before pushing.

## Committing

README-bot pushes a regenerated `README.md` after every run, so `git pull --rebase` before committing; otherwise the push is rejected and the generated file conflicts. Resolve such a conflict by rerunning `bun run update:readme`, never by hand-merging `README.md`.

## CI

`.github/workflows/build_profile.yml` runs on push to `master`, daily at 16:00 UTC, and on demand: install → typecheck + format check + test → generate summary cards → regenerate → commit as `README-bot` if `README.md` changed. The generator step receives `GITHUB_TOKEN`.
