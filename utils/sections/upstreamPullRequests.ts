import { MAX_UPSTREAM_PULL_REQUESTS } from '../config.ts'
import {
  escapeTableCell,
  formatDate,
  formatNumber,
  markdownTable,
  repoFullName,
} from '../format.ts'
import type { PullRequest, PullRequestSearch } from '../types.ts'

/** One row per upstream repository, so a single busy project cannot fill the table. */
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
 * Merged pull requests only — accepted work, not everything I opened. The search
 * orders by last update, so the rows are re-sorted by merge date before one is
 * picked per project.
 */
export function renderUpstreamPullRequests(search: PullRequestSearch): string {
  const merged = pickOnePerRepo(
    search.items
      .filter((pullRequest) => pullRequest.pull_request.merged_at != null)
      .sort(byMergeDate),
  )

  if (merged.length === 0) {
    return 'No merged upstream pull requests available.'
  }

  const rows = merged.map((pullRequest) => {
    const fullName = repoFullName(pullRequest.repository_url)
    const mergedAt = pullRequest.pull_request.merged_at
    const title = escapeTableCell(pullRequest.title)

    return `| [${fullName}](https://github.com/${fullName}) | [${title}](${pullRequest.html_url}) | ${mergedAt ? formatDate(mergedAt) : '—'} |`
  })

  return [
    `${formatNumber(search.total_count)} pull requests merged into repositories I do not own — the most recent one per project:`,
    '',
    markdownTable(['Project', 'Pull request', 'Merged'], rows),
  ].join('\n')
}
