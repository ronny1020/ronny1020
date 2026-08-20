import { escapeTableCell, markdownTable } from '../format.ts'
import { repoDescription } from '../repos.ts'
import type { GithubRepo, NpmPackage, RepoLinks } from '../types.ts'

function npmVersionBadge(npmPackage: NpmPackage): string {
  return ` ![npm](https://img.shields.io/npm/v/${npmPackage.name}?style=flat-square&label=&color=cb3837)`
}

function projectLinks({
  npmPackage,
  repo,
  site,
}: {
  npmPackage: NpmPackage | undefined
  repo: GithubRepo
  site: string | undefined
}): string {
  return [
    `[repo](${repo.html_url})`,
    ...(npmPackage
      ? [`[npm](https://www.npmjs.com/package/${npmPackage.name})`]
      : []),
    ...(site ? [`[site](${site})`] : []),
  ].join(' · ')
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
    const name = `**${repo.name}**${npmPackage ? npmVersionBadge(npmPackage) : ''}`
    const links = projectLinks({
      npmPackage,
      repo,
      site: siteLinks.get(repo.name),
    })

    return `| ${name} | ${escapeTableCell(repoDescription(repo, npmPackage))} | ${repo.language ?? '—'} | ⭐&nbsp;${repo.stargazers_count} | ${links} |`
  })

  return markdownTable(
    ['Project', 'What it does', 'Language', 'Stars', 'Links'],
    rows,
  )
}
