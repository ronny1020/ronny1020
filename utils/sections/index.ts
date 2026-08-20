import type {
  GithubRepo,
  GithubUser,
  PullRequestSearch,
  RepoLinks,
  StarredRepo,
} from '../types.ts'
import { renderFeaturedProjects } from './featuredProjects.ts'
import { renderFooter } from './footer.ts'
import { renderHighlights } from './highlights.ts'
import { renderLanguages } from './languages.ts'
import { renderRecentRepos } from './recentRepos.ts'
import { renderStarredRepos } from './starredRepos.ts'
import { renderUpstreamPullRequests } from './upstreamPullRequests.ts'

export type ProfileData = RepoLinks & {
  authoredPullRequestCount: number
  featured: GithubRepo[]
  recent: GithubRepo[]
  repos: GithubRepo[]
  starred: StarredRepo[]
  upstream: PullRequestSearch
  user: GithubUser
}

/**
 * Every `<!-- generated:<name> -->` marker `mainProfile.md` may use, mapped to
 * its rendered markdown. A marker with no entry here survives into the README,
 * which is what the marker test asserts against.
 */
export function renderSections(data: ProfileData): Record<string, string> {
  return {
    featured: renderFeaturedProjects({
      npmPackages: data.npmPackages,
      repos: data.featured,
      siteLinks: data.siteLinks,
    }),
    footer: renderFooter(data.user),
    highlights: renderHighlights({
      pullRequestCount: data.authoredPullRequestCount,
      repos: data.repos,
      user: data.user,
    }),
    languages: renderLanguages(data.repos),
    recent: renderRecentRepos({
      npmPackages: data.npmPackages,
      repos: data.recent,
    }),
    starred: renderStarredRepos(data.starred),
    upstream: renderUpstreamPullRequests(data.upstream),
  }
}
