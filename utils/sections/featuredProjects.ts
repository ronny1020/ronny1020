import { MAX_DESCRIPTION_LENGTH } from '../config.ts'
import {
  escapeTableCell,
  formatNumber,
  markdownTable,
  truncate,
} from '../format.ts'
import { repoDescription } from '../repos.ts'
import type { GithubRepo, NpmPackage, RepoLinks } from '../types.ts'

/**
 * Three columns, because a five-column table needs 469px and GitHub gives a
 * phone 348px with no scroll container — the surplus is simply cut off. Stars,
 * language, and the version live under the project name instead.
 */
function projectCell({
  npmPackage,
  repo,
  site,
}: {
  npmPackage: NpmPackage | undefined
  repo: GithubRepo
  site: string | undefined
}): string {
  const facts = [
    `⭐&nbsp;${repo.stargazers_count}`,
    ...(repo.language ? [repo.language] : []),
    ...(npmPackage
      ? [
          `[![npm](https://img.shields.io/npm/v/${npmPackage.name}?style=flat-square&label=&color=cb3837)](https://www.npmjs.com/package/${npmPackage.name})`,
        ]
      : []),
    ...(site ? [`[site](${site})`] : []),
  ]

  return `[**${repo.name}**](${repo.html_url})<br><sub>${facts.join(' · ')}</sub>`
}

export function renderFeaturedProjects({
  monthlyDownloads,
  npmPackages,
  repos,
  siteLinks,
}: RepoLinks & {
  monthlyDownloads: Map<string, number>
  repos: GithubRepo[]
}): string {
  if (repos.length === 0) {
    return 'No featured projects available.'
  }

  const rows = repos.map((repo) => {
    const npmPackage = npmPackages.get(repo.name)
    const downloads = npmPackage
      ? monthlyDownloads.get(npmPackage.name)
      : undefined
    const reach = downloads ? `${formatNumber(downloads)}/mo` : '—'
    const description = escapeTableCell(
      truncate(repoDescription(repo, npmPackage), MAX_DESCRIPTION_LENGTH),
    )

    return `| ${projectCell({ npmPackage, repo, site: siteLinks.get(repo.name) })} | ${description} | ${reach} |`
  })

  return markdownTable(['Project', 'What it does', 'Installs'], rows)
}
