import { readFile, writeFile } from 'node:fs/promises'

import { MAIN_PROFILE_PATH, README_PATH } from './utils/config.ts'
import {
  getAuthoredPullRequests,
  getRepos,
  getStarredRepos,
  getUpstreamPullRequests,
  getUser,
} from './utils/github.ts'
import { fetchNpmPackages } from './utils/npm.ts'
import { pickFeaturedRepos, pickRecentRepos } from './utils/repos.ts'
import { renderSections } from './utils/sections/index.ts'
import { fetchSiteLinks } from './utils/siteLinks.ts'
import { renderTemplate } from './utils/template.ts'
import type { GithubRepo, RepoLinks } from './utils/types.ts'

/** Repositories the README links to, each listed once. */
function dedupe(repos: GithubRepo[]): GithubRepo[] {
  return [...new Map(repos.map((repo) => [repo.name, repo])).values()]
}

async function fetchRepoLinks(repos: GithubRepo[]): Promise<RepoLinks> {
  const [npmPackages, siteLinks] = await Promise.all([
    fetchNpmPackages(repos),
    fetchSiteLinks(repos),
  ])

  return { npmPackages, siteLinks }
}

async function updateProfile(): Promise<void> {
  const [template, user, repos, authored, upstream, starred] =
    await Promise.all([
      readFile(MAIN_PROFILE_PATH, 'utf8'),
      getUser(),
      getRepos(),
      getAuthoredPullRequests(),
      getUpstreamPullRequests(),
      getStarredRepos(),
    ])

  const featured = pickFeaturedRepos(repos)
  const recent = pickRecentRepos(repos)
  const links = await fetchRepoLinks(dedupe([...featured, ...recent]))

  const readme = renderTemplate(
    template,
    renderSections({
      ...links,
      authoredPullRequestCount: authored.total_count,
      featured,
      recent,
      repos,
      starred,
      upstream,
      user,
    }),
  )

  await writeFile(README_PATH, `${readme.trimEnd()}\n`, 'utf8')
  console.log(
    `README updated from ${repos.length} repositories, ${authored.total_count} pull requests and ${links.npmPackages.size} npm packages.`,
  )
}

updateProfile().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
