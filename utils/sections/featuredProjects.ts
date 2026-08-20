import { MAX_DESCRIPTION_LENGTH } from '../config.ts'
import { escapeTableCell, markdownTable, truncate } from '../format.ts'
import { repoDescription } from '../repos.ts'
import type { GithubRepo, NpmPackage, RepoLinks } from '../types.ts'

/**
 * The version badge doubles as the npm link, and the project name as the repo
 * link: a separate Links column is too narrow for `repo · npm` and wraps into
 * an orphaned separator.
 */
function versionCell(npmPackage: NpmPackage | undefined): string {
  if (!npmPackage) {
    return '—'
  }

  const badge = `![npm](https://img.shields.io/npm/v/${npmPackage.name}?style=flat-square&label=&color=cb3837)`

  return `[${badge}](https://www.npmjs.com/package/${npmPackage.name})`
}

function projectCell(repo: GithubRepo, site: string | undefined): string {
  const name = `[**${repo.name}**](${repo.html_url})`

  return site ? `${name}<br>[site](${site})` : name
}

export function renderFeaturedProjects({
  npmPackages,
  repos,
  siteLinks,
}: RepoLinks & { repos: GithubRepo[] }): string {
  if (repos.length === 0) {
    return 'No featured projects available.'
  }

  const rows = repos.map((repo) => {
    const npmPackage = npmPackages.get(repo.name)
    const cells = [
      projectCell(repo, siteLinks.get(repo.name)),
      versionCell(npmPackage),
      escapeTableCell(
        truncate(repoDescription(repo, npmPackage), MAX_DESCRIPTION_LENGTH),
      ),
      repo.language ?? '—',
      `⭐&nbsp;${repo.stargazers_count}`,
    ]

    return `| ${cells.join(' | ')} |`
  })

  return markdownTable(
    ['Project', 'Version', 'What it does', 'Language', 'Stars'],
    rows,
  )
}
