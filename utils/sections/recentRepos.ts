import { MAX_DESCRIPTION_LENGTH } from '../config.ts'
import {
  escapeTableCell,
  formatDate,
  markdownTable,
  truncate,
} from '../format.ts'
import { repoDescription } from '../repos.ts'
import type { GithubRepo, NpmPackage } from '../types.ts'

/** Two columns: four columns clip on a phone, and repo cards were remote images. */
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

  const rows = repos.map((repo) => {
    const facts = [
      ...(repo.language ? [repo.language] : []),
      ...(repo.pushed_at ? [`pushed ${formatDate(repo.pushed_at)}`] : []),
    ]
    const description = escapeTableCell(
      truncate(
        repoDescription(repo, npmPackages.get(repo.name)),
        MAX_DESCRIPTION_LENGTH,
      ),
    )

    return `| [**${repo.name}**](${repo.html_url})<br><sub>${facts.join(' · ')}</sub> | ${description} |`
  })

  return markdownTable(['Repository', 'What it does'], rows)
}
