import { centered, formatNumber } from '../format.ts'
import { isOwnRepo, sumBy } from '../repos.ts'
import type { GithubRepo, GithubUser, MaintainedProject } from '../types.ts'

/**
 * A sentence rather than badges: six shields pills need 926px in an 846px
 * column, so the last one is orphaned on its own line and the row breaks into
 * four on a phone. Text reflows, and installs lead because they are the only
 * number here that shows somebody else depending on the code.
 */
export function renderHighlights({
  maintained,
  repos,
  upstreamCount,
  upstreamStars,
  user,
  yearlyDownloads,
}: {
  maintained: MaintainedProject
  repos: GithubRepo[]
  upstreamCount: number
  upstreamStars: number
  user: GithubUser
  yearlyDownloads: number
}): string {
  const ownRepos = repos.filter(isOwnRepo)
  const facts = [
    `<b>${formatNumber(yearlyDownloads)}</b> npm installs in the last year`,
    `<b>${formatNumber(upstreamCount)}</b> pull requests merged into projects with <b>${formatNumber(upstreamStars)}</b> stars between them`,
    `<b>${formatNumber(maintained.commits)}</b> commits maintaining a community docs site`,
    `<b>${formatNumber(sumBy(ownRepos, (repo) => repo.stargazers_count))}</b> stars on my own repositories`,
    `on GitHub since <b>${user.created_at.slice(0, 4)}</b>`,
  ]

  return centered([`  <sub>${facts.join(' · ')}</sub>`])
}
