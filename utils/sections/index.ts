import type {
  GithubRepo,
  GithubUser,
  IssueSearch,
  MaintainedProject,
  NpmPackage,
  PullRequestSearch,
  RepoLinks,
  SocialAccount,
  StarredRepo,
} from '../types.ts'
import { renderFeaturedProjects } from './featuredProjects.ts'
import { renderFixedIssues } from './fixedIssues.ts'
import { renderFooter } from './footer.ts'
import { renderHighlights } from './highlights.ts'
import { renderLanguages } from './languages.ts'
import { renderMaintained } from './maintained.ts'
import { renderPackages } from './packages.ts'
import { renderRecentRepos } from './recentRepos.ts'
import { renderSocialLinks } from './socialLinks.ts'
import { renderStarTopics } from './starTopics.ts'
import { renderTechStack } from './techStack.ts'
import { renderUpstreamPullRequests } from './upstreamPullRequests.ts'

export type ProfileData = RepoLinks & {
  dependencyCounts: Map<string, number>
  featured: GithubRepo[]
  fixedIssues: IssueSearch
  maintained: MaintainedProject
  monthlyDownloads: Map<string, number>
  packageNames: string[]
  publishedPackages: Map<string, NpmPackage>
  recent: GithubRepo[]
  repos: GithubRepo[]
  socialAccounts: SocialAccount[]
  starred: StarredRepo[]
  upstream: PullRequestSearch
  upstreamStars: Map<string, number>
  user: GithubUser
  yearlyDownloads: number
}

/**
 * Every `<!-- generated:<name> -->` marker `mainProfile.md` may use, mapped to
 * its rendered markdown. A marker with no entry here survives into the README,
 * which is what the marker test asserts against.
 */
export function renderSections(data: ProfileData): Record<string, string> {
  const upstreamStarTotal = [...data.upstreamStars.values()].reduce(
    (sum, stars) => sum + stars,
    0,
  )

  return {
    featured: renderFeaturedProjects({
      monthlyDownloads: data.monthlyDownloads,
      npmPackages: data.npmPackages,
      repos: data.featured,
      siteLinks: data.siteLinks,
    }),
    fixedIssues: renderFixedIssues(data.fixedIssues),
    footer: renderFooter(data.user),
    highlights: renderHighlights({
      maintained: data.maintained,
      repos: data.repos,
      upstreamCount: data.upstream.total_count,
      upstreamStars: upstreamStarTotal,
      user: data.user,
      yearlyDownloads: data.yearlyDownloads,
    }),
    languages: renderLanguages(data.repos),
    maintained: renderMaintained(data.maintained),
    packages: renderPackages({
      descriptions: data.publishedPackages,
      lastMonth: data.monthlyDownloads,
      packageNames: data.packageNames,
    }),
    recent: renderRecentRepos({
      npmPackages: data.npmPackages,
      repos: data.recent,
    }),
    social: renderSocialLinks(data.socialAccounts),
    starTopics: renderStarTopics(data.starred),
    techStack: renderTechStack(data.dependencyCounts),
    upstream: renderUpstreamPullRequests({
      repoStars: data.upstreamStars,
      search: data.upstream,
    }),
  }
}
