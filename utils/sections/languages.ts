import {
  LANGUAGE_BAR_WIDTH,
  LANGUAGE_COLORS,
  MAX_LANGUAGES,
} from '../config.ts'
import { markdownTable } from '../format.ts'
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

function bar(share: number): string {
  const filled = Math.max(1, Math.round(share * LANGUAGE_BAR_WIDTH))

  return '█'.repeat(filled) + '░'.repeat(LANGUAGE_BAR_WIDTH - filled)
}

function swatch(language: string): string {
  const color = LANGUAGE_COLORS[language] ?? FALLBACK_LANGUAGE_COLOR

  return `![](https://img.shields.io/badge/-${color}?style=flat-square&label=%20&labelColor=${color})`
}

export function renderLanguages(repos: GithubRepo[]): string {
  const counts = countReposByLanguage(repos)
  const total = [...counts.values()].reduce((sum, count) => sum + count, 0)

  if (total === 0) {
    return 'No language data available.'
  }

  const rows = [...counts.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, MAX_LANGUAGES)
    .map(([language, count]) => {
      const share = count / total

      return `| ${swatch(language)} ${language} | \`${bar(share)}\` | ${(share * 100).toFixed(1)}% |`
    })

  return markdownTable(['Language', '', 'Share of repos'], rows)
}
