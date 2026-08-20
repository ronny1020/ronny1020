import type { GithubRepo } from './types.ts'

const REQUEST_TIMEOUT_MS = 10_000

type RepoWithHomepage = GithubRepo & { homepage: string }

function hasDemoHomepage(repo: GithubRepo): repo is RepoWithHomepage {
  return (
    repo.homepage !== null &&
    repo.homepage !== '' &&
    !repo.homepage.includes('npmjs.com')
  )
}

/** A homepage counts as reachable only when it answers with a success status. */
async function resolveHomepage(repo: RepoWithHomepage): Promise<string | null> {
  try {
    const response = await fetch(repo.homepage, {
      redirect: 'follow',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })

    return response.ok ? repo.homepage : null
  } catch {
    return null
  }
}

/**
 * Repository homepages that are publicly reachable, keyed by repo name.
 * Dead, offline, or login-walled demo links (an expired Chromatic build, say)
 * are dropped instead of being published.
 */
export async function fetchSiteLinks(
  repos: GithubRepo[],
): Promise<Map<string, string>> {
  const entries = await Promise.all(
    repos
      .filter(hasDemoHomepage)
      .map(async (repo) => [repo.name, await resolveHomepage(repo)] as const),
  )

  return new Map(
    entries.filter((entry): entry is [string, string] => entry[1] !== null),
  )
}
