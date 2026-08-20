import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const GITHUB_USERNAME = 'ronny1020'
export const GITHUB_API_URL = 'https://api.github.com'
export const NPM_REGISTRY_URL = 'https://registry.npmjs.org'
export const REPOS_PER_PAGE = 100
export const MAX_RECENT_REPOS = 4
export const MAX_FEATURED_REPOS = 4
export const MAX_LANGUAGES = 6
export const MAX_UPSTREAM_PULL_REQUESTS = 5
export const MAX_STARRED_REPOS = 5
/** Fetched before the private ones are filtered out. */
export const STARRED_PAGE_SIZE = 20
export const LANGUAGE_BAR_WIDTH = 18
export const PROFILE_TIME_ZONE = 'Asia/Taipei'

const PROJECT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..')

export const MAIN_PROFILE_PATH = resolve(PROJECT_DIR, 'mainProfile.md')
export const README_PATH = resolve(PROJECT_DIR, 'README.md')

/** Language bar colors, taken from GitHub's linguist palette. */
export const LANGUAGE_COLORS: Record<string, string> = {
  Dockerfile: '384d54',
  HTML: 'e34c26',
  Java: 'b07219',
  JavaScript: 'f1e05a',
  PHP: '4F5D95',
  Python: '3572A5',
  SCSS: 'c6538c',
  Shell: '89e051',
  TypeScript: '3178c6',
  Vue: '41b883',
}

/** Repositories kept out of the README, no matter how many stars they have. */
export const EXCLUDED_REPOS = ['vue-reactive-form']
