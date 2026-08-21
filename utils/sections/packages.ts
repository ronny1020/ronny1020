import { MAX_DESCRIPTION_LENGTH } from '../config.ts'
import {
  escapeTableCell,
  formatNumber,
  markdownTable,
  truncate,
} from '../format.ts'
import type { NpmPackage } from '../types.ts'

/**
 * Install counts, not stars: a package with nine stars and 25,000 monthly
 * installs is used, and the star count says the opposite.
 */
export function renderPackages({
  descriptions,
  lastMonth,
  packageNames,
}: {
  descriptions: Map<string, NpmPackage>
  lastMonth: Map<string, number>
  packageNames: string[]
}): string {
  const ranked = packageNames
    .map((name) => ({ downloads: lastMonth.get(name) ?? 0, name }))
    .sort((a, b) => b.downloads - a.downloads)

  if (ranked.length === 0) {
    return 'No published packages available.'
  }

  const rows = ranked.map(({ downloads, name }) => {
    const description = escapeTableCell(
      truncate(
        descriptions.get(name)?.description ?? '—',
        MAX_DESCRIPTION_LENGTH,
      ),
    )

    return `| [\`${name}\`](https://www.npmjs.com/package/${name}) | ${description} | ${formatNumber(downloads)} |`
  })

  return markdownTable(['Package', 'What it is', 'Installs / month'], rows)
}
