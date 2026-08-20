import { GITHUB_USERNAME } from '../config.ts'
import { MAX_DESCRIPTION_LENGTH } from '../config.ts'
import {
  centered,
  escapeTableCell,
  formatDate,
  markdownTable,
  truncate,
} from '../format.ts'
import { repoDescription } from '../repos.ts'
import type { GithubRepo, NpmPackage } from '../types.ts'

function repoCard(repo: GithubRepo): string {
  return `  <a href="${repo.html_url}"><img alt="${repo.name}" src="https://gh-card.dev/repos/${GITHUB_USERNAME}/${repo.name}.svg"></a>`
}

export function renderRecentRepos({
  npmPackages,
  repos,
}: {
  npmPackages: Map<string, NpmPackage>
  repos: GithubRepo[]
}): string {
  if (repos.length === 0) {
    return 'No recent repositories available.'
  }

  const rows = repos.map(
    (repo) =>
      `| [${repo.name}](${repo.html_url}) | ${escapeTableCell(truncate(repoDescription(repo, npmPackages.get(repo.name)), MAX_DESCRIPTION_LENGTH))} | ${repo.language ?? '—'} | ${repo.pushed_at ? formatDate(repo.pushed_at) : '—'} |`,
  )

  return [
    markdownTable(['Repository', 'Description', 'Language', 'Last push'], rows),
    '',
    centered(repos.map(repoCard)),
  ].join('\n')
}
