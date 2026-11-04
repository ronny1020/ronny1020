import { MAX_DESCRIPTION_LENGTH } from '../config.ts'
import {
  escapeTableCell,
  formatNumber,
  markdownTable,
  truncate,
} from '../format.ts'
import { type PackageInstalls, splitPackagesByReach } from '../npmDownloads.ts'
import type { NpmPackage } from '../types.ts'

/**
 * Install counts, not stars: a package with nine stars and 25,000 monthly
 * installs is used, and the star count says the opposite.
 */
export function renderPackages({
  descriptions,
  ...installs
}: PackageInstalls & { descriptions: Map<string, NpmPackage> }): string {
  const { listed, smaller } = splitPackagesByReach(installs)

  if (listed.length === 0 && smaller.length === 0) {
    return 'No published packages available.'
  }

  const rows = listed.map(({ downloads, name }) => {
    const description = escapeTableCell(
      truncate(
        descriptions.get(name)?.description ?? '—',
        MAX_DESCRIPTION_LENGTH,
      ),
    )

    return `| [\`${name}\`](https://www.npmjs.com/package/${name}) | ${description} | ${formatNumber(downloads)} |`
  })
  const table =
    rows.length > 0
      ? markdownTable(['Package', 'What it is', 'Installs / month'], rows)
      : ''
  const count = `${smaller.length} ${rows.length > 0 ? 'smaller' : 'published'} package${smaller.length === 1 ? '' : 's'}`
  const smallerLine =
    smaller.length > 0
      ? `<sub>${rows.length > 0 ? `…and ${count}` : count}</sub>`
      : ''

  return [table, smallerLine].filter(Boolean).join('\n\n')
}
