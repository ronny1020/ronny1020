import { NPM_DOWNLOADS_API_URL, NPM_REGISTRY_URL } from './config.ts'
import type { NpmPackage } from './types.ts'

type DownloadPoint = { downloads: number } | null

/** Packages published under this maintainer, by npm's own search index. */
async function fetchPublishedPackages(maintainer: string): Promise<string[]> {
  const response = await fetch(
    `${NPM_REGISTRY_URL}/-/v1/search?text=maintainer:${maintainer}&size=100`,
  )

  if (!response.ok) {
    return []
  }

  const results = (await response.json()) as {
    objects?: { package?: { name?: string } }[]
  }

  return (results.objects ?? [])
    .map((entry) => entry.package?.name)
    .filter((name): name is string => Boolean(name))
}

async function fetchDownloadPoint(
  period: string,
  packageName: string,
): Promise<number> {
  const response = await fetch(
    `${NPM_DOWNLOADS_API_URL}/${period}/${packageName.replace('/', '%2F')}`,
  )

  if (!response.ok) {
    return 0
  }

  const point = (await response.json()) as DownloadPoint

  return point?.downloads ?? 0
}

/**
 * Install counts per package. The bulk endpoint takes many names at once but
 * rejects scoped ones, so those are fetched individually.
 */
async function fetchDownloads(
  period: string,
  packageNames: string[],
): Promise<Map<string, number>> {
  const scoped = packageNames.filter((name) => name.startsWith('@'))
  const plain = packageNames.filter((name) => !name.startsWith('@'))

  const bulk: Record<string, DownloadPoint> = plain.length
    ? await fetch(`${NPM_DOWNLOADS_API_URL}/${period}/${plain.join(',')}`)
        .then(async (response) =>
          response.ok
            ? ((await response.json()) as Record<string, DownloadPoint>)
            : {},
        )
        .catch(() => ({}))
    : {}

  const counts = new Map<string, number>(
    Object.entries(bulk).map(([name, point]) => [name, point?.downloads ?? 0]),
  )

  // A single name makes the bulk endpoint answer with a bare point, not a map.
  if (plain.length === 1 && !counts.has(plain[0] as string)) {
    counts.set(
      plain[0] as string,
      await fetchDownloadPoint(period, plain[0] as string),
    )
  }

  for (const name of scoped) {
    counts.set(name, await fetchDownloadPoint(period, name))
  }

  return counts
}

/** Every published package with its monthly and yearly install counts. */
export async function fetchPackageDownloads({
  maintainer,
  repoPackages,
}: {
  maintainer: string
  repoPackages: NpmPackage[]
}): Promise<{
  lastMonth: Map<string, number>
  lastYearTotal: number
  packageNames: string[]
}> {
  const published = await fetchPublishedPackages(maintainer)
  const packageNames = [
    ...new Set([...published, ...repoPackages.map((entry) => entry.name)]),
  ].sort()

  const [lastMonth, lastYear] = await Promise.all([
    fetchDownloads('last-month', packageNames),
    fetchDownloads('last-year', packageNames),
  ])

  return {
    lastMonth,
    lastYearTotal: [...lastYear.values()].reduce((sum, n) => sum + n, 0),
    packageNames,
  }
}
