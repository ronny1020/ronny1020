import {
  CURRENT_WORK_DAYS,
  DAY_MS,
  EXCLUDED_REPOS,
  GITHUB_USERNAME,
  MAX_FEATURED_REPOS,
  MAX_RECENT_REPOS,
  MAX_RELEASES,
  RELEASE_WINDOW_DAYS,
} from './config.ts'
import type {
  CurrentWork,
  GithubEvent,
  GithubRelease,
  GithubRepo,
  NpmPackage,
} from './types.ts'

/** Repositories written here, excluding forks, the profile repo, and opt-outs. */
export function isOwnRepo(repo: GithubRepo): boolean {
  return (
    !repo.fork &&
    repo.name !== GITHUB_USERNAME &&
    !EXCLUDED_REPOS.includes(repo.name)
  )
}

export function byStars(a: GithubRepo, b: GithubRepo): number {
  return b.stargazers_count - a.stargazers_count
}

export function sumBy(
  repos: GithubRepo[],
  pick: (repo: GithubRepo) => number,
): number {
  return repos.reduce((total, repo) => total + pick(repo), 0)
}

/**
 * Homebrew taps (which Homebrew requires to be named `homebrew-*`) and Scoop
 * buckets only hold install manifests for other repositories.
 */
function isReleaseManifest(repo: GithubRepo): boolean {
  return /^homebrew-|scoop-bucket$/i.test(repo.name)
}

export function isShowcase(repo: GithubRepo): boolean {
  return isOwnRepo(repo) && !isReleaseManifest(repo)
}

/** Every project that could be featured, most starred first. */
export function pickFeaturedCandidates(repos: GithubRepo[]): GithubRepo[] {
  return repos
    .filter((repo) => isShowcase(repo) && !repo.archived)
    .sort(byStars)
}

/** A scoped package stands for its whole family: `@scope/core` covers `@scope/react`. */
function packageFamily(name: string): string {
  return name.startsWith('@') ? (name.split('/')[0] ?? name) : name
}

/** The most starred projects whose package is not already a packages-table row. */
export function pickFeaturedRepos({
  candidates,
  listedPackages,
  npmPackages,
  shownElsewhere = new Set(),
}: {
  candidates: GithubRepo[]
  listedPackages: Set<string>
  npmPackages: Map<string, NpmPackage>
  /** Projects another section already shows. */
  shownElsewhere?: Set<string>
}): GithubRepo[] {
  const listedFamilies = new Set([...listedPackages].map(packageFamily))

  return candidates
    .filter((repo) => {
      if (shownElsewhere.has(repo.name)) {
        return false
      }

      const name = npmPackages.get(repo.name)?.name ?? repo.name

      return !listedFamilies.has(packageFamily(name))
    })
    .slice(0, MAX_FEATURED_REPOS)
}

/** Newest pushes first, skipping projects another section already shows. */
export function pickRecentRepos(
  repos: GithubRepo[],
  shownElsewhere: Set<string> = new Set(),
): GithubRepo[] {
  return repos
    .filter((repo) => isShowcase(repo) && !shownElsewhere.has(repo.name))
    .slice(0, MAX_RECENT_REPOS)
}

/** Releases within `RELEASE_WINDOW_DAYS`, newest first, at most `MAX_RELEASES`. */
export function pickLatestReleases({
  now,
  releases,
}: {
  now: Date
  releases: GithubRelease[]
}): GithubRelease[] {
  const cutoff = now.getTime() - RELEASE_WINDOW_DAYS * DAY_MS
  const publishedAt = (release: GithubRelease) =>
    Date.parse(release.published_at ?? '')

  return releases
    .filter((release) => publishedAt(release) >= cutoff)
    .sort((a, b) => publishedAt(b) - publishedAt(a))
    .slice(0, MAX_RELEASES)
}

/**
 * The showcase project I pushed to most within `CURRENT_WORK_DAYS`, or null
 * when nothing was pushed. Counts pushes; push events carry no commit list.
 */
export function pickCurrentWork({
  events,
  now,
  repos,
}: {
  events: GithubEvent[]
  now: Date
  repos: GithubRepo[]
}): CurrentWork | null {
  const cutoff = now.getTime() - CURRENT_WORK_DAYS * DAY_MS
  const showcase = new Map(
    repos
      .filter(isShowcase)
      .map((repo) => [`${GITHUB_USERNAME}/${repo.name}`, repo]),
  )
  const pushes = new Map<GithubRepo, number>()

  for (const event of events) {
    const repo = showcase.get(event.repo.name)

    if (
      repo &&
      event.type === 'PushEvent' &&
      Date.parse(event.created_at ?? '') >= cutoff
    ) {
      pushes.set(repo, (pushes.get(repo) ?? 0) + 1)
    }
  }

  // Events arrive newest first and a Map keeps insertion order, so a stable
  // sort breaks a tie in favour of the most recent push.
  const [busiest] = [...pushes].sort(([, a], [, b]) => b - a)

  return busiest ? { pushes: busiest[1], repo: busiest[0] } : null
}

/** Repository description, falling back to the published npm description. */
export function repoDescription(
  repo: GithubRepo,
  npmPackage?: NpmPackage,
): string {
  return repo.description ?? npmPackage?.description ?? '—'
}
