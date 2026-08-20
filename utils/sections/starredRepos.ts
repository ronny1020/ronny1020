import { MAX_DESCRIPTION_LENGTH } from '../config.ts'
import { escapeTableCell, formatNumber, truncate } from '../format.ts'
import type { StarredRepo } from '../types.ts'

/** What I have been reading lately, straight from my GitHub stars. */
export function renderStarredRepos(repos: StarredRepo[]): string {
  if (repos.length === 0) {
    return 'No starred repositories available.'
  }

  return repos
    .map(
      (repo) =>
        `- [${repo.full_name}](${repo.html_url}) — ${escapeTableCell(truncate(repo.description ?? 'no description', MAX_DESCRIPTION_LENGTH))} \`${repo.language ?? 'n/a'}\` ⭐ ${formatNumber(repo.stargazers_count)}`,
    )
    .join('\n')
}
