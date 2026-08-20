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

export function pickFeaturedRepos(repos: GithubRepo[]): GithubRepo[] {
  return repos
    .filter((repo) => isOwnRepo(repo) && !repo.archived)
    .sort(byStars)
    .slice(0, MAX_FEATURED_REPOS)
}

export function pickRecentRepos(repos: GithubRepo[]): GithubRepo[] {
  return repos.filter(isOwnRepo).slice(0, MAX_RECENT_REPOS)
}

/** Repository description, falling back to the published npm description. */
export function repoDescription(
  repo: GithubRepo,
  npmPackage?: NpmPackage,
): string {
  return repo.description ?? npmPackage?.description ?? '—'
}
