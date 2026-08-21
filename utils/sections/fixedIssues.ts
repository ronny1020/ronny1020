import { MAX_FIXED_ISSUES } from '../config.ts'
import { escapeLinkText, repoFullName } from '../format.ts'
import type { IssueSearch } from '../types.ts'

/**
 * Bugs I reported in other people's projects that their maintainers closed as
 * completed. Only a maintainer can add a row here, so it cannot fill with noise.
 */
export function renderFixedIssues(search: IssueSearch): string {
  const issues = search.items.slice(0, MAX_FIXED_ISSUES)

  if (issues.length === 0) {
    return 'No fixed upstream issues available.'
  }

  return issues
    .map((issue) => {
      const fullName = repoFullName(issue.repository_url)

      return `- **[${fullName}](https://github.com/${fullName})** — [${escapeLinkText(issue.title)}](${issue.html_url})`
    })
    .join('\n')
}
