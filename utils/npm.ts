import { GITHUB_USERNAME, NPM_REGISTRY_URL } from './config.ts'
import type { GithubRepo, NpmManifest, NpmPackage } from './types.ts'

const REQUEST_TIMEOUT_MS = 10_000

/** An npm homepage names the package; only a scoped name spans two segments. */
function packageNameFromHomepage(homepage: string | null): string | undefined {
  return (
    homepage?.match(/npmjs\.com\/package\/(@[^/?#]+\/[^/?#]+|[^/@?#]+)/)?.[1] ??
    undefined
  )
}

/**
 * Guards against a name collision: a repository named like someone else's
 * package must not borrow that package's version badge or description.
 */
function belongsToRepo(manifest: NpmManifest, repo: GithubRepo): boolean {
  const repositoryUrl =
    typeof manifest.repository === 'string'
      ? manifest.repository
      : manifest.repository?.url

  return Boolean(
    repositoryUrl?.includes(`github.com/${GITHUB_USERNAME}/${repo.name}`),
  )
}

/** The npm package a repository publishes, if it publishes one. */
async function fetchNpmPackage(repo: GithubRepo): Promise<NpmPackage | null> {
  const fromHomepage = packageNameFromHomepage(repo.homepage)
  const packageName = fromHomepage ?? repo.name

  try {
    const response = await fetch(
      `${NPM_REGISTRY_URL}/${packageName.replace('/', '%2F')}/latest`,
      { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) },
    )

    if (!response.ok) {
      return null
    }

    const manifest = (await response.json()) as NpmManifest

    if (!belongsToRepo(manifest, repo)) {
      return null
    }

    return {
      description: manifest.description ?? null,
      name: manifest.name ?? packageName,
    }
  } catch {
    return null
  }
}

/** npm metadata for the repositories the README links to, keyed by repo name. */
export async function fetchNpmPackages(
  repos: GithubRepo[],
): Promise<Map<string, NpmPackage>> {
  const entries = await Promise.all(
    repos.map(
      async (repo) => [repo.name, await fetchNpmPackage(repo)] as const,
    ),
  )

  return new Map(
    entries.filter((entry): entry is [string, NpmPackage] => entry[1] !== null),
  )
}

/** Registry metadata for published packages, keyed by package name. */
export async function fetchPackageManifests(
  packageNames: string[],
): Promise<Map<string, NpmPackage>> {
  const entries = await Promise.all(
    packageNames.map(async (name) => {
      try {
        const response = await fetch(
          `${NPM_REGISTRY_URL}/${name.replace('/', '%2F')}/latest`,
          { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) },
        )

        if (!response.ok) {
          return null
        }

        const manifest = (await response.json()) as NpmManifest

        return [
          name,
          { description: manifest.description ?? null, name },
        ] as const
      } catch {
        return null
      }
    }),
  )

  return new Map(
    entries.filter(
      (entry): entry is readonly [string, NpmPackage] => entry !== null,
    ),
  )
}
