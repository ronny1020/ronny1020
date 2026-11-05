import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import {
  CURRENT_WORK_DAYS,
  DAY_MS,
  GITHUB_USERNAME,
  LIVE_BADGE_DIR,
  MAIN_PROFILE_PATH,
  README_PATH,
  RELEASE_SCAN_REPOS,
} from './utils/config.ts'
import { repoFullName } from './utils/format.ts'
import {
  getAuthoredPullRequests,
  getDeclaredDependencies,
  getFixedIssues,
  getLatestReleases,
  getMaintainedProject,
  getPublicEvents,
  getRepoStars,
  getRepos,
  getSocialAccounts,
  getStarredRepos,
  getUpstreamPullRequests,
  getUser,
} from './utils/github.ts'
import { renderLiveBadges } from './utils/liveBadge.ts'
import { fetchNpmPackages, fetchPackageManifests } from './utils/npm.ts'
import {
  fetchPackageDownloads,
  splitPackagesByReach,
} from './utils/npmDownloads.ts'
import {
  isOwnRepo,
  isShowcase,
  pickCurrentWork,
  pickFeaturedCandidates,
  pickFeaturedRepos,
  pickLatestReleases,
  pickRecentRepos,
} from './utils/repos.ts'
import { renderSections } from './utils/sections/index.ts'
import { fetchSiteLinks } from './utils/siteLinks.ts'
import { fetchStackOverflowStats } from './utils/stackOverflow.ts'
import { renderTemplate } from './utils/template.ts'
import { fetchForecast } from './utils/weather.ts'

async function writeLiveBadges(generatedAt: Date): Promise<void> {
  await mkdir(LIVE_BADGE_DIR, { recursive: true })
  await Promise.all(
    Object.entries(renderLiveBadges(generatedAt)).map(([file, svg]) =>
      writeFile(join(LIVE_BADGE_DIR, file), svg, 'utf8'),
    ),
  )
}

async function updateProfile(): Promise<void> {
  const generatedAt = new Date()
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
    weather,
    events,
    stackOverflow,
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
    fetchForecast(),
    getPublicEvents(
      new Date(generatedAt.getTime() - CURRENT_WORK_DAYS * DAY_MS),
    ),
    fetchStackOverflowStats(),
  ])

  const ownRepos = repos.filter(isOwnRepo)
  const candidates = pickFeaturedCandidates(repos)
  const currentWork = pickCurrentWork({ events, now: generatedAt, repos })
  const releases = pickLatestReleases({
    now: generatedAt,
    releases: await getLatestReleases(
      repos.filter(isShowcase).slice(0, RELEASE_SCAN_REPOS),
    ),
  })
  const shownAbove = new Set([
    ...releases.map((release) => release.repo),
    ...(currentWork ? [currentWork.repo.name] : []),
  ])

  const [npmPackages, repoStars, dependencyCounts] = await Promise.all([
    fetchNpmPackages(repos.filter(isShowcase)),
    getRepoStars([
      ...new Set(
        [...upstream.items, ...fixedIssues.items].map((item) =>
          repoFullName(item.repository_url),
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
  const featured = pickFeaturedRepos({
    candidates,
    listedPackages: new Set(
      splitPackagesByReach(downloads).listed.map(({ name }) => name),
    ),
    npmPackages,
    shownElsewhere: shownAbove,
  })
  const recent = pickRecentRepos(
    repos,
    new Set([...shownAbove, ...featured.map((repo) => repo.name)]),
  )
  const siteLinks = await fetchSiteLinks([...featured, ...recent])

  const readme = renderTemplate(
    template,
    renderSections({
      currentWork,
      dependencyCounts,
      featured,
      fixedIssues,
      generatedAt,
      maintained,
      monthlyDownloads: downloads.lastMonth,
      npmPackages,
      packageNames: downloads.packageNames,
      publishedPackages,
      recent,
      releases,
      repos,
      siteLinks,
      socialAccounts,
      stackOverflow,
      starred,
      upstream,
      repoStars,
      user,
      weather,
      yearlyDownloads: downloads.lastYearTotal,
    }),
  )

  await Promise.all([
    writeFile(README_PATH, `${readme.trimEnd()}\n`, 'utf8'),
    writeLiveBadges(generatedAt),
  ])
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
