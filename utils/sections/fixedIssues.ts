import { MAX_FIXED_ISSUES } from '../config.ts'
import {
  escapeLinkText,
  formatDate,
  formatNumber,
  repoFullName,
} from '../format.ts'
import type { IssueSearch } from '../types.ts'

/**
 * Bugs I reported in other people's projects that their maintainers closed as
 * completed. Only a maintainer can add a row here, so it cannot fill with noise.
 */
export function renderFixedIssues({
  repoStars,
  search,
}: {
  repoStars: Map<string, number>
  search: IssueSearch
}): string {
  const issues = search.items.slice(0, MAX_FIXED_ISSUES)

  if (issues.length === 0) {
    return 'No fixed upstream issues available.'
  }

  return issues
    .map((issue) => {
      const fullName = repoFullName(issue.repository_url)
      const title = issue.title.replace(/^\s*\[bug\]\s*/i, '')

      const stars = repoStars.get(fullName)
      const scale = stars ? ` ⭐&nbsp;${formatNumber(stars)}` : ''

      return [
        `- **[${fullName}](https://github.com/${fullName})**${scale}<br>`,
        `  [${escapeLinkText(title)}](${issue.html_url})`,
        issue.closed_at
          ? ` <sub>fixed ${formatDate(issue.closed_at)}</sub>`
          : '',
      ].join('')
    })
    .join('\n')
}
