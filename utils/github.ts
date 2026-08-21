import {
  EXCLUDED_OWNERS,
  MAINTAINED_REPO,
  GITHUB_API_URL,
  GITHUB_USERNAME,
  REPOS_PER_PAGE,
  STARRED_PAGE_SIZE,
} from './config.ts'
import type {
  GithubRepo,
  GithubUser,
  Issue,
  IssueSearch,
  MaintainedProject,
  PullRequestSearch,
  RepoSummary,
  SocialAccount,
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
 * My stars, public ones only: this endpoint returns whatever the requesting
 * token can see, and a private star must never reach a public README. The whole
 * page is kept — a theme only means something across many repositories.
 */
export async function getStarredRepos(): Promise<StarredRepo[]> {
  const starred = await githubJson<StarredRepo[]>(
    `/users/${GITHUB_USERNAME}/starred?per_page=${STARRED_PAGE_SIZE}`,
  )

  return starred.filter((repo) => !repo.private)
}

async function searchPullRequests(query: string): Promise<PullRequestSearch> {
  return githubJson<PullRequestSearch>(
    `/search/issues?q=${encodeURIComponent(query)}&sort=updated&order=desc&per_page=100&advanced_search=true`,
  )
}

/** Accounts that commit on a workflow's behalf rather than as a contributor. */
const AUTOMATION_LOGINS =
  /\[bot\]$|^(actions-user|github-actions|dependabot|renovate)$/

/**
 * A maintainer's own label is the only trustworthy signal that a report was a
 * bug: half of my closed issues are questions or feature requests, and their
 * titles do not say so. `debug` must not match, hence the boundaries.
 */
const BUG_LABEL = /(^|[\s/:_-])bugs?($|[\s/:_-])/i
const BUG_TITLE = /^\s*\[bug\b/i

function isFixedBug(issue: Issue): boolean {
  return (
    issue.state_reason === 'completed' &&
    (issue.labels.some((label) =>
      BUG_LABEL.test(typeof label === 'string' ? label : (label.name ?? '')),
    ) ||
      BUG_TITLE.test(issue.title))
  )
}

/**
 * Issues I opened in other people's projects that the maintainers closed as
 * completed — a fix landed because of the report.
 */
export async function getFixedIssues(): Promise<IssueSearch> {
  const excluded = EXCLUDED_OWNERS.map((owner) => `-user:${owner}`).join(' ')
  const search = await githubJson<IssueSearch>(
    `/search/issues?q=${encodeURIComponent(`type:issue is:public author:${GITHUB_USERNAME} ${excluded}`)}&sort=updated&order=desc&per_page=100&advanced_search=true`,
  )

  const fixed = search.items.filter(isFixedBug)

  return { items: fixed, total_count: fixed.length }
}

/** Star counts for the repositories a set of pull requests landed in. */
export async function getRepoStars(
  fullNames: string[],
): Promise<Map<string, number>> {
  const entries = await Promise.all(
    fullNames.map(async (fullName) => {
      try {
        const repo = await githubJson<RepoSummary>(`/repos/${fullName}`)

        return [fullName, repo.stargazers_count] as const
      } catch {
        return [fullName, 0] as const
      }
    }),
  )

  return new Map(entries)
}

/** My share of the community project I maintain, from its own numbers. */
export async function getMaintainedProject(): Promise<MaintainedProject> {
  const [repo, contributors, pullRequests] = await Promise.all([
    githubJson<RepoSummary>(`/repos/${MAINTAINED_REPO}`),
    githubJson<{ login: string; contributions: number }[]>(
      `/repos/${MAINTAINED_REPO}/contributors?per_page=100`,
    ),
    searchPullRequests(
      `type:pr is:public is:merged author:${GITHUB_USERNAME} repo:${MAINTAINED_REPO}`,
    ),
  ])

  const humans = contributors.filter(
    (contributor) => !AUTOMATION_LOGINS.test(contributor.login),
  )
  const mine = humans.find(
    (contributor) => contributor.login === GITHUB_USERNAME,
  )

  return {
    commits: mine?.contributions ?? 0,
    fullName: MAINTAINED_REPO,
    lastMergedAt: pullRequests.items[0]?.pull_request.merged_at ?? null,
    mergedPullRequests: pullRequests.total_count,
    stars: repo.stargazers_count,
    teamSize: humans.length,
    totalCommits: humans.reduce(
      (total, contributor) => total + contributor.contributions,
      0,
    ),
  }
}

/** The accounts I list on my GitHub profile, whatever they happen to be. */
export async function getSocialAccounts(): Promise<SocialAccount[]> {
  return githubJson<SocialAccount[]>(
    `/users/${GITHUB_USERNAME}/social_accounts`,
  )
}

/**
 * Dependencies declared across my own repositories — the tools I actually use,
 * as opposed to the ones I remember using.
 */
export async function getDeclaredDependencies(
  repos: GithubRepo[],
): Promise<Map<string, number>> {
  const manifests = await Promise.all(
    repos.map(async (repo) => {
      try {
        const file = await githubJson<{ content?: string }>(
          `/repos/${GITHUB_USERNAME}/${repo.name}/contents/package.json`,
        )
        const manifest = JSON.parse(
          Buffer.from(file.content ?? '', 'base64').toString('utf8'),
        ) as Record<string, Record<string, string> | undefined>

        return Object.keys({
          ...manifest.dependencies,
          ...manifest.devDependencies,
          ...manifest.peerDependencies,
        })
      } catch {
        return []
      }
    }),
  )

  const repoCountByDependency = new Map<string, number>()

  for (const dependencies of manifests) {
    for (const dependency of new Set(dependencies)) {
      repoCountByDependency.set(
        dependency,
        (repoCountByDependency.get(dependency) ?? 0) + 1,
      )
    }
  }

  return repoCountByDependency
}
