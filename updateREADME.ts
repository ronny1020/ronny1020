import { readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

type GithubRepo = {
  name: string
  html_url: string
}

const GITHUB_USERNAME = 'ronny1020'
const GITHUB_REPOS_API_URL = `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&direction=desc`
const MAX_RECENT_REPOS = 3
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const MAIN_PROFILE_PATH = resolve(SCRIPT_DIR, 'mainProfile.md')
const README_PATH = resolve(SCRIPT_DIR, 'README.md')

function isGithubRepo(value: unknown): value is GithubRepo {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const repo = value as Record<string, unknown>

  return typeof repo.name === 'string' && typeof repo.html_url === 'string'
}

async function getRecentRepos(): Promise<GithubRepo[]> {
  const response = await fetch(GITHUB_REPOS_API_URL, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'ronny1020-readme-updater',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })

  const payload = await response.text()

  if (!response.ok) {
    throw new Error(
      `Failed to fetch repositories: ${response.status} ${response.statusText}\n${payload}`,
    )
  }

  let repos: unknown

  try {
    repos = JSON.parse(payload) as unknown
  } catch (error) {
    throw new Error('GitHub API returned invalid JSON.', { cause: error })
  }

  if (!Array.isArray(repos)) {
    throw new Error('GitHub API response was not an array of repositories.')
  }

  return repos
    .filter(isGithubRepo)
    .filter(({ name }) => name !== GITHUB_USERNAME)
    .slice(0, MAX_RECENT_REPOS)
}

function formatRepoCards(repos: GithubRepo[]): string {
  if (repos.length === 0) {
    return 'No recent repositories available.'
  }

  return repos
    .map(
      (repo) =>
        `[![ReadMe Card](https://github-readme-stats.vercel.app/api/pin/?username=${GITHUB_USERNAME}&repo=${repo.name})](${repo.html_url})`,
    )
    .join('\n\n')
}

async function updateProfile(): Promise<void> {
  const [mainProfile, recentRepos] = await Promise.all([
    readFile(MAIN_PROFILE_PATH, 'utf8'),
    getRecentRepos(),
  ])

  const readme = [
    mainProfile.trimEnd(),
    '',
    '## Last repositories (auto updated by github action)',
    '',
    formatRepoCards(recentRepos),
    '',
  ].join('\n')

  await writeFile(README_PATH, readme, 'utf8')
  console.log(
    `README update complete. ${recentRepos.length} repositories written.`,
  )
}

updateProfile().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
