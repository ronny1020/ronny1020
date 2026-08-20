import { LANGUAGE_COLORS, MAX_LANGUAGES } from '../config.ts'
import { centered, shieldsBadge } from '../format.ts'
import { isOwnRepo } from '../repos.ts'
import type { GithubRepo } from '../types.ts'

const FALLBACK_LANGUAGE_COLOR = '8b949e'

function countReposByLanguage(repos: GithubRepo[]): Map<string, number> {
  const counts = new Map<string, number>()

  for (const { language } of repos.filter(isOwnRepo)) {
    if (language) {
      counts.set(language, (counts.get(language) ?? 0) + 1)
    }
  }

  return counts
}

/**
 * One badge per language in its linguist color. An ASCII bar renders as
 * monochrome hatching on GitHub, which reads as noise rather than as a chart.
 */
export function renderLanguages(repos: GithubRepo[]): string {
  const counts = countReposByLanguage(repos)
  const total = [...counts.values()].reduce((sum, count) => sum + count, 0)

  if (total === 0) {
    return 'No language data available.'
  }

  const badges = [...counts.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, MAX_LANGUAGES)
    .map(([language, count]) => {
      const share = `${((count / total) * 100).toFixed(1)}%`
      const source = shieldsBadge({
        color: LANGUAGE_COLORS[language] ?? FALLBACK_LANGUAGE_COLOR,
        label: language,
        value: share,
      })

      return `  <img alt="${language}: ${share} of my repositories" src="${source}">`
    })

  return centered(badges)
}
