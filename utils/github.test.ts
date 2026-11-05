import { afterEach, describe, expect, it, jest } from 'bun:test'

import {
  buildPushEvent,
  buildRepo,
  jsonResponse,
  mockFetch,
} from './fixtures.ts'
import {
  getAuthoredPullRequests,
  getFixedIssues,
  getLatestReleases,
  getPublicEvents,
  getRepos,
  getStarredRepos,
  getUpstreamPullRequests,
  getUser,
} from './github.ts'

afterEach(() => {
  jest.restoreAllMocks()
})

/** Runs `work` with GITHUB_TOKEN set (or unset), then restores the real value. */
async function withToken(
  token: string | undefined,
  work: () => Promise<unknown>,
): Promise<void> {
  const previousToken = process.env.GITHUB_TOKEN

  if (token === undefined) {
    delete process.env.GITHUB_TOKEN
  } else {
    process.env.GITHUB_TOKEN = token
  }

  try {
    await work()
  } finally {
    if (previousToken === undefined) {
      delete process.env.GITHUB_TOKEN
    } else {
      process.env.GITHUB_TOKEN = previousToken
    }
  }
}

function requestHeaders(
  fetchMock: ReturnType<typeof mockFetch>,
): Record<string, string> {
  return (fetchMock.mock.calls[0]?.[1] as RequestInit).headers as Record<
    string,
    string
  >
}

describe('getUser', () => {
  it('sends the API version header and no token when none is set', async () => {
    const fetchMock = mockFetch(() => jsonResponse({ followers: 18 }))

    await withToken(undefined, getUser)

    expect(requestHeaders(fetchMock)['X-GitHub-Api-Version']).toBe('2022-11-28')
    expect(requestHeaders(fetchMock).Authorization).toBeUndefined()
  })

  it('authorizes with GITHUB_TOKEN when present', async () => {
    const fetchMock = mockFetch(() => jsonResponse({ followers: 18 }))

    await withToken('secret', getUser)

    expect(requestHeaders(fetchMock).Authorization).toBe('Bearer secret')
  })

  it('throws with the response body when GitHub rejects the request', async () => {
    mockFetch(
      () =>
        ({
          ok: false,
          status: 403,
          statusText: 'Forbidden',
          text: () => Promise.resolve('rate limit exceeded'),
        }) as Response,
    )

    const error: unknown = await getUser().catch((error: unknown) => error)

    expect(error).toBeInstanceOf(Error)
    expect(error instanceof Error && error.message).toContain(
      'rate limit exceeded',
    )
  })

  it('throws when the payload is not JSON', async () => {
    mockFetch(
      () => ({ ok: true, text: () => Promise.resolve('<html>') }) as Response,
    )

    const error: unknown = await getUser().catch((error: unknown) => error)

    expect(error).toBeInstanceOf(Error)
    expect(error instanceof Error && error.message).toContain('invalid JSON')
  })
})

describe('getRepos', () => {
  it('follows pagination until a short page arrives', async () => {
    const fullPage = Array.from({ length: 100 }, (_, index) => ({
      name: `repo-${index}`,
    }))
    const fetchMock = mockFetch((url) =>
      jsonResponse(url.includes('&page=1&') ? fullPage : [{ name: 'last' }]),
    )

    const repos = await getRepos()

    expect(repos).toHaveLength(101)
    expect(fetchMock.mock.calls).toHaveLength(2)
  })
})

describe('pull request searches', () => {
  it('restrict every query to public repositories', async () => {
    const fetchMock = mockFetch(() =>
      jsonResponse({ items: [], total_count: 0 }),
    )

    await getAuthoredPullRequests()
    await getUpstreamPullRequests()

    for (const [url] of fetchMock.mock.calls) {
      expect(decodeURIComponent(url as string)).toContain('is:public')
    }
  })

  it('excludes every account I belong to from the upstream query', async () => {
    const fetchMock = mockFetch(() =>
      jsonResponse({ items: [], total_count: 0 }),
    )

    await getUpstreamPullRequests()

    const query = decodeURIComponent(fetchMock.mock.calls[0]?.[0] as string)
    expect(query).toContain('is:merged')
    expect(query).toContain('-user:ronny1020')
    expect(query).toContain('-user:travel-guide-tw')
  })
})

describe('getStarredRepos', () => {
  it('drops private stars a broad token can see', async () => {
    mockFetch(() =>
      jsonResponse([
        { full_name: 'linkervision/secret', private: true },
        ...Array.from({ length: 9 }, (_, index) => ({
          full_name: `owner/public-${index}`,
          private: false,
        })),
      ]),
    )

    const starred = await getStarredRepos()

    expect(starred).toHaveLength(9)
    expect(starred.map((repo) => repo.full_name)).not.toContain(
      'linkervision/secret',
    )
  })
})

describe('getFixedIssues', () => {
  function issue(
    title: string,
    labels: string[],
    stateReason: string | null = 'completed',
  ) {
    return {
      html_url: 'https://github.com/owner/repo/issues/1',
      labels: labels.map((name) => ({ name })),
      repository_url: 'https://api.github.com/repos/owner/repo',
      state_reason: stateReason,
      title,
    }
  }

  it('keeps only reports a maintainer labelled as a bug', async () => {
    mockFetch(() =>
      jsonResponse({
        items: [
          issue('[BUG] `font-mono` is not recognised', ['bug']),
          issue('imported error during build', ['upstream bug', 'workaround']),
          issue('Can I get custom FIELDS by PCD loader.', []),
          issue('`editLink` should use the rewrites keys', ['has-workaround']),
          issue('Since the render is async, can rules be too?', [
            'enhancement',
          ]),
          issue('a real bug nobody fixed', ['bug'], 'not_planned'),
          issue('debug output is noisy', ['debug']),
        ],
        total_count: 7,
      }),
    )

    const fixed = await getFixedIssues()

    expect(fixed.items.map((entry) => entry.title)).toEqual([
      '[BUG] `font-mono` is not recognised',
      'imported error during build',
    ])
    expect(fixed.total_count).toBe(2)
  })
})

describe('getLatestReleases', () => {
  it('keeps repositories that have a release and tags each with its name', async () => {
    mockFetch((url) =>
      url.includes('/muster/')
        ? jsonResponse({ html_url: 'h', published_at: 'p', tag_name: 'v1' })
        : ({
            ok: false,
            status: 404,
            text: () => Promise.resolve(''),
          } as Response),
    )

    const releases = await getLatestReleases([
      buildRepo({ name: 'muster' }),
      buildRepo({ name: 'unreleased' }),
    ])

    expect(releases).toEqual([
      { html_url: 'h', published_at: 'p', repo: 'muster', tag_name: 'v1' },
    ])
  })
})

describe('getLatestReleases failures', () => {
  it('throws on anything but a 404, so a rate limit cannot empty the section', async () => {
    mockFetch(
      () =>
        ({
          ok: false,
          status: 403,
          statusText: 'Forbidden',
          text: () => Promise.resolve('rate limited'),
        }) as Response,
    )

    let failure = ''

    try {
      await getLatestReleases([buildRepo()])
    } catch (error) {
      failure = String(error)
    }

    expect(failure).toContain('403')
  })
})

describe('getPublicEvents', () => {
  it('stops paging once a page reaches past the cutoff', async () => {
    const fetchMock = mockFetch(() =>
      jsonResponse(
        Array.from({ length: 100 }, () =>
          buildPushEvent({ created_at: '2026-10-01T00:00:00Z' }),
        ),
      ),
    )

    await getPublicEvents(new Date('2026-10-20T00:00:00Z'))

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('pages on while every event is inside the window, up to three pages', async () => {
    const fetchMock = mockFetch(() =>
      jsonResponse(
        Array.from({ length: 100 }, () =>
          buildPushEvent({ created_at: '2026-11-03T00:00:00Z' }),
        ),
      ),
    )

    const events = await getPublicEvents(new Date('2026-10-20T00:00:00Z'))

    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(events).toHaveLength(300)
  })
})
