import {
  EXCLUDED_REPOS,
  GITHUB_USERNAME,
  MAX_FEATURED_REPOS,
  MAX_RECENT_REPOS,
} from './config.ts'
import type { GithubRepo, NpmPackage } from './types.ts'

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

function isShowcase(repo: GithubRepo): boolean {
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
}: {
  candidates: GithubRepo[]
  listedPackages: Set<string>
  npmPackages: Map<string, NpmPackage>
}): GithubRepo[] {
  const listedFamilies = new Set([...listedPackages].map(packageFamily))

  return candidates
    .filter((repo) => {
      const name = npmPackages.get(repo.name)?.name ?? repo.name

      return !listedFamilies.has(packageFamily(name))
    })
    .slice(0, MAX_FEATURED_REPOS)
}

export function pickRecentRepos(repos: GithubRepo[]): GithubRepo[] {
  return repos.filter(isShowcase).slice(0, MAX_RECENT_REPOS)
}

/** Repository description, falling back to the published npm description. */
export function repoDescription(
  repo: GithubRepo,
  npmPackage?: NpmPackage,
): string {
  return repo.description ?? npmPackage?.description ?? '—'
}
