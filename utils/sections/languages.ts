import { MAX_LANGUAGES } from '../config.ts'
import { isOwnRepo } from '../repos.ts'
import type { GithubRepo } from '../types.ts'

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
 * A mermaid pie: it renders natively, follows the reader's theme, and scales to
 * the column, where a badge row spans 825 of 846 available pixels and wraps to
 * four ragged rows on a phone.
 */
export function renderLanguages(repos: GithubRepo[]): string {
  const counts = countReposByLanguage(repos)
  const total = [...counts.values()].reduce((sum, count) => sum + count, 0)

  if (total === 0) {
    return 'No language data available.'
  }

  const slices = [...counts.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, MAX_LANGUAGES)
    .map(
      ([language, count]) =>
        `  "${language}" : ${((count / total) * 100).toFixed(1)}`,
    )

  return [
    '```mermaid',
    'pie showData title Repositories by language',
    ...slices,
    '```',
  ].join('\n')
}
