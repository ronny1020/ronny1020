import { centered, formatNumber, shieldsBadge } from '../format.ts'
import { isOwnRepo, sumBy } from '../repos.ts'
import type { GithubRepo, GithubUser } from '../types.ts'

export function renderHighlights({
  pullRequestCount,
  repos,
  user,
}: {
  pullRequestCount: number
  repos: GithubRepo[]
  user: GithubUser
}): string {
  const ownRepos = repos.filter(isOwnRepo)
  const highlights = [
    {
      color: '2f81f7',
      label: 'Public repos',
      value: formatNumber(user.public_repos),
    },
    {
      color: 'e3b341',
      label: 'Stars earned',
      value: formatNumber(sumBy(ownRepos, (repo) => repo.stargazers_count)),
    },
    {
      color: 'a371f7',
      label: 'Forks',
      value: formatNumber(sumBy(ownRepos, (repo) => repo.forks_count)),
    },
    {
      color: '3fb950',
      label: 'Pull requests',
      value: formatNumber(pullRequestCount),
    },
    {
      color: '58a6ff',
      label: 'Followers',
      value: formatNumber(user.followers),
    },
    {
      color: 'f78166',
      label: 'On GitHub since',
      value: user.created_at.slice(0, 4),
    },
  ]

  return centered(
    highlights.map(
      (badge) =>
        `  <img alt="${badge.label}: ${badge.value}" src="${shieldsBadge(badge)}">`,
    ),
  )
}
