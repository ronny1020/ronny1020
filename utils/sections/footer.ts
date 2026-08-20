import { formatTimestamp } from '../format.ts'
import type { GithubUser } from '../types.ts'

export function renderFooter(user: GithubUser): string {
  const location = user.location ? `${user.location} · ` : ''

  return `<sub>${location}README rebuilt from the GitHub API — last run ${formatTimestamp(new Date())}</sub>`
}
