import {
  EXCLUDED_OWNERS,
  GITHUB_API_URL,
  GITHUB_USERNAME,
  MAX_STARRED_REPOS,
  REPOS_PER_PAGE,
  STARRED_PAGE_SIZE,
} from './config.ts'
import type {
  GithubRepo,
  GithubUser,
  PullRequestSearch,
  StarredRepo,
} from './types.ts'

async function githubJson<T>(path: string): Promise<T> {
  const token = process.env.GITHUB_TOKEN
  const response = await fetch(`${GITHUB_API_URL}${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'ronny1020-readme-updater',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  const payload = await response.text()

  if (!response.ok) {
    throw new Error(
      `GitHub request failed: ${path} → ${response.status} ${response.statusText}\n${payload}`,
    )
  }

  try {
    return JSON.parse(payload) as T
  } catch (error) {
    throw new Error(`GitHub returned invalid JSON for ${path}.`, {
      cause: error,
    })
  }
}

export async function getUser(): Promise<GithubUser> {
  return githubJson<GithubUser>(`/users/${GITHUB_USERNAME}`)
}

/** Every public repository, own and forked, newest push first. */
export async function getRepos(): Promise<GithubRepo[]> {
  const repos: GithubRepo[] = []

  for (let page = 1; ; page += 1) {
    const batch = await githubJson<GithubRepo[]>(
      `/users/${GITHUB_USERNAME}/repos?per_page=${REPOS_PER_PAGE}&page=${page}&sort=pushed&direction=desc`,
    )

    repos.push(...batch)

    if (batch.length < REPOS_PER_PAGE) {
      return repos
    }
  }
}

/**
 * Every public pull request this account authored, newest activity first.
 * `is:public` is required: a token with private access would otherwise pull
 * work repositories into a public README.
 */
export async function getAuthoredPullRequests(): Promise<PullRequestSearch> {
  return searchPullRequests(`type:pr is:public author:${GITHUB_USERNAME}`)
}

/**
 * Merged pull requests sent to repositories nobody I belong to owns — my own
 * organisations' projects are my work, not an upstream contribution.
 */
export async function getUpstreamPullRequests(): Promise<PullRequestSearch> {
  const excluded = EXCLUDED_OWNERS.map((owner) => `-user:${owner}`).join(' ')

  return searchPullRequests(
    `type:pr is:public is:merged author:${GITHUB_USERNAME} ${excluded}`,
  )
}

/**
 * Recent stars, public ones only: this endpoint returns whatever the requesting
 * token can see, and a private star must never reach a public README.
 */
export async function getStarredRepos(): Promise<StarredRepo[]> {
  const starred = await githubJson<StarredRepo[]>(
    `/users/${GITHUB_USERNAME}/starred?per_page=${STARRED_PAGE_SIZE}`,
  )

  return starred.filter((repo) => !repo.private).slice(0, MAX_STARRED_REPOS)
}

async function searchPullRequests(query: string): Promise<PullRequestSearch> {
  return githubJson<PullRequestSearch>(
    `/search/issues?q=${encodeURIComponent(query)}&sort=updated&order=desc&per_page=100&advanced_search=true`,
  )
}
