import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const GITHUB_USERNAME = 'ronny1020'
export const GITHUB_API_URL = 'https://api.github.com'
export const NPM_REGISTRY_URL = 'https://registry.npmjs.org'
export const NPM_DOWNLOADS_API_URL = 'https://api.npmjs.org/downloads/point'
export const REPOS_PER_PAGE = 100
export const MAX_RECENT_REPOS = 4
export const MAX_FEATURED_REPOS = 4
export const MAX_LANGUAGES = 6
/** Table columns wrap their own words when a description runs longer. */
export const MAX_DESCRIPTION_LENGTH = 90
export const MAX_UPSTREAM_PULL_REQUESTS = 8
export const MAX_STAR_TOPICS = 10
/** A theme or a tool has to recur before it says anything. */
export const MIN_EVIDENCE_COUNT = 2
export const MAX_FIXED_ISSUES = 5
export const MIN_STACK_TOOLS = 6
/** Fetched before the private ones are filtered out. */
export const STARRED_PAGE_SIZE = 100
export const PROFILE_TIME_ZONE = 'Asia/Taipei'

const PROJECT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..')

export const MAIN_PROFILE_PATH = resolve(PROJECT_DIR, 'mainProfile.md')
export const README_PATH = resolve(PROJECT_DIR, 'README.md')

/** Repositories kept out of the README, no matter how many stars they have. */
export const EXCLUDED_REPOS = ['vue-reactive-form']

/**
 * Accounts whose repositories are mine too, so a pull request to them is not an
 * upstream contribution. Add private organisations through the
 * `EXCLUDED_OWNERS` environment variable instead of this list, which is public.
 */
/** The community project I maintain, reported on its own rather than as upstream. */
export const MAINTAINED_REPO = 'travel-guide-tw/travel-guide-tw.github.io'

export const EXCLUDED_OWNERS = [
  GITHUB_USERNAME,
  'travel-guide-tw',
  ...(process.env.EXCLUDED_OWNERS ?? '')
    .split(',')
    .map((owner) => owner.trim())
    .filter(Boolean),
]
