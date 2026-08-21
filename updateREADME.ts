import { readFile, writeFile } from 'node:fs/promises'

import {
  GITHUB_USERNAME,
  MAIN_PROFILE_PATH,
  README_PATH,
} from './utils/config.ts'
import { repoFullName } from './utils/format.ts'
import {
  getAuthoredPullRequests,
  getDeclaredDependencies,
  getFixedIssues,
  getMaintainedProject,
  getRepoStars,
  getRepos,
  getSocialAccounts,
  getStarredRepos,
  getUpstreamPullRequests,
  getUser,
} from './utils/github.ts'
import { fetchNpmPackages, fetchPackageManifests } from './utils/npm.ts'
import { fetchPackageDownloads } from './utils/npmDownloads.ts'
import { isOwnRepo, pickFeaturedRepos, pickRecentRepos } from './utils/repos.ts'
import { renderSections } from './utils/sections/index.ts'
import { fetchSiteLinks } from './utils/siteLinks.ts'
import { renderTemplate } from './utils/template.ts'
import type { GithubRepo } from './utils/types.ts'

/** Repositories the README links to, each listed once. */
function dedupe(repos: GithubRepo[]): GithubRepo[] {
  return [...new Map(repos.map((repo) => [repo.name, repo])).values()]
}

async function updateProfile(): Promise<void> {
  const [
    template,
    user,
    repos,
    authored,
    upstream,
    starred,
    fixedIssues,
    maintained,
    socialAccounts,
  ] = await Promise.all([
    readFile(MAIN_PROFILE_PATH, 'utf8'),
    getUser(),
    getRepos(),
    getAuthoredPullRequests(),
    getUpstreamPullRequests(),
    getStarredRepos(),
    getFixedIssues(),
    getMaintainedProject(),
    getSocialAccounts(),
  ])

  const ownRepos = repos.filter(isOwnRepo)
  const featured = pickFeaturedRepos(repos)
  const recent = pickRecentRepos(repos)
  const linked = dedupe([...featured, ...recent])

  const [npmPackages, siteLinks, upstreamStars, dependencyCounts] =
    await Promise.all([
      fetchNpmPackages(linked),
      fetchSiteLinks(linked),
      getRepoStars([
        ...new Set(
          upstream.items.map((pullRequest) =>
            repoFullName(pullRequest.repository_url),
          ),
        ),
      ]),
      getDeclaredDependencies(ownRepos),
    ])

  const downloads = await fetchPackageDownloads({
    maintainer: GITHUB_USERNAME,
    repoPackages: [...npmPackages.values()],
  })
  const publishedPackages = await fetchPackageManifests(downloads.packageNames)

  const readme = renderTemplate(
    template,
    renderSections({
      dependencyCounts,
      featured,
      fixedIssues,
      maintained,
      monthlyDownloads: downloads.lastMonth,
      npmPackages,
      packageNames: downloads.packageNames,
      publishedPackages,
      recent,
      repos,
      siteLinks,
      socialAccounts,
      starred,
      upstream,
      upstreamStars,
      user,
      yearlyDownloads: downloads.lastYearTotal,
    }),
  )

  await writeFile(README_PATH, `${readme.trimEnd()}\n`, 'utf8')
  console.log(
    [
      `README updated from ${repos.length} repositories`,
      `${downloads.packageNames.length} packages`,
      `${authored.total_count} pull requests`,
      `${dependencyCounts.size} distinct dependencies`,
    ].join(', '),
  )
}

updateProfile().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
