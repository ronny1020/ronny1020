import { afterEach, describe, expect, it, jest } from 'bun:test'

import { jsonResponse, mockFetch } from './fixtures.ts'
import {
  getAuthoredPullRequests,
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

    await expect(getUser()).rejects.toThrow('rate limit exceeded')
  })

  it('throws when the payload is not JSON', async () => {
    mockFetch(
      () => ({ ok: true, text: () => Promise.resolve('<html>') }) as Response,
    )

    await expect(getUser()).rejects.toThrow('invalid JSON')
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
      expect(decodeURIComponent(String(url))).toContain('is:public')
    }
  })

  it('excludes own repositories from the upstream query', async () => {
    const fetchMock = mockFetch(() =>
      jsonResponse({ items: [], total_count: 0 }),
    )

    await getUpstreamPullRequests()

    const query = decodeURIComponent(String(fetchMock.mock.calls[0]?.[0]))
    expect(query).toContain('is:merged')
    expect(query).toContain('-user:ronny1020')
  })
})

describe('getStarredRepos', () => {
  it('drops private stars a broad token can see and caps the rest', async () => {
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

    expect(starred).toHaveLength(5)
    expect(starred.map((repo) => repo.full_name)).not.toContain(
      'linkervision/secret',
    )
  })
})
