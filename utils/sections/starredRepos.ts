import { escapeTableCell, formatNumber } from '../format.ts'
import type { StarredRepo } from '../types.ts'

/** What I have been reading lately, straight from my GitHub stars. */
export function renderStarredRepos(repos: StarredRepo[]): string {
  if (repos.length === 0) {
    return 'No starred repositories available.'
  }

  return repos
    .map(
      (repo) =>
        `- [${repo.full_name}](${repo.html_url}) — ${escapeTableCell(repo.description ?? 'no description')} \`${repo.language ?? 'n/a'}\` ⭐ ${formatNumber(repo.stargazers_count)}`,
    )
    .join('\n')
}
