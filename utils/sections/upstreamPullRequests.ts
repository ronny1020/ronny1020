import { MAX_UPSTREAM_PULL_REQUESTS } from '../config.ts'
import {
  escapeTableCell,
  formatDate,
  formatNumber,
  repoFullName,
} from '../format.ts'
import type { PullRequest, PullRequestSearch } from '../types.ts'

/** One entry per upstream repository, so a single busy project cannot fill it. */
function pickOnePerRepo(pullRequests: PullRequest[]): PullRequest[] {
  const seenRepos = new Set<string>()
  const picked: PullRequest[] = []

  for (const pullRequest of pullRequests) {
    const fullName = repoFullName(pullRequest.repository_url)

    if (
      !seenRepos.has(fullName) &&
      picked.length < MAX_UPSTREAM_PULL_REQUESTS
    ) {
      seenRepos.add(fullName)
      picked.push(pullRequest)
    }
  }

  return picked
}

function byMergeDate(left: PullRequest, right: PullRequest): number {
  return (
    Date.parse(right.pull_request.merged_at ?? '') -
    Date.parse(left.pull_request.merged_at ?? '')
  )
}

/**
 * Merged pull requests only — accepted work, not everything I opened. A list
 * rather than a table: at 348px a three-column table loses its last column, and
 * the star count is what tells a reader the scale of the project.
 */
export function renderUpstreamPullRequests({
  repoStars,
  search,
}: {
  repoStars: Map<string, number>
  search: PullRequestSearch
}): string {
  const merged = pickOnePerRepo(
    search.items
      .filter((pullRequest) => pullRequest.pull_request.merged_at != null)
      .sort(byMergeDate),
  )

  if (merged.length === 0) {
    return 'No merged upstream pull requests available.'
  }

  const entries = merged.map((pullRequest) => {
    const fullName = repoFullName(pullRequest.repository_url)
    const stars = repoStars.get(fullName)
    const scale = stars ? ` ⭐&nbsp;${formatNumber(stars)}` : ''
    const mergedAt = pullRequest.pull_request.merged_at

    return [
      `- **[${fullName}](https://github.com/${fullName})**${scale}<br>`,
      `  [${escapeTableCell(pullRequest.title)}](${pullRequest.html_url})`,
      mergedAt ? ` <sub>merged ${formatDate(mergedAt)}</sub>` : '',
    ].join('')
  })

  return [
    `${formatNumber(search.total_count)} pull requests merged into repositories I do not own:`,
    '',
    ...entries,
  ].join('\n')
}
