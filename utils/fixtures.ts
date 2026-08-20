import { jest } from 'bun:test'

import type {
  GithubRepo,
  GithubUser,
  PullRequest,
  StarredRepo,
} from './types.ts'

/** Test fixtures: minimal API payloads the renderers can run against. */
export function buildRepo(overrides: Partial<GithubRepo> = {}): GithubRepo {
  return {
    archived: false,
    description: 'A test repository',
    fork: false,
    forks_count: 1,
    homepage: null,
    html_url: 'https://github.com/ronny1020/example',
    language: 'TypeScript',
    name: 'example',
    pushed_at: '2026-08-01T00:00:00Z',
    stargazers_count: 3,
    topics: [],
    ...overrides,
  }
}

export function buildUser(overrides: Partial<GithubUser> = {}): GithubUser {
  return {
    created_at: '2019-01-18T07:49:24Z',
    followers: 18,
    location: 'Taipei',
    public_repos: 67,
    ...overrides,
  }
}

/** The nested link object a search result carries for a pull request. */
export function buildPullRequestLink(
  mergedAt: string | null,
): PullRequest['pull_request'] {
  return {
    diff_url: null,
    html_url: null,
    merged_at: mergedAt,
    patch_url: null,
    url: null,
  }
}

export function buildPullRequest(
  overrides: Partial<PullRequest> = {},
): PullRequest {
  return {
    html_url: 'https://github.com/TanStack/query/pull/1',
    pull_request: buildPullRequestLink('2026-08-17T00:00:00Z'),
    repository_url: 'https://api.github.com/repos/TanStack/query',
    title: 'docs: fix a link',
    updated_at: '2026-08-17T00:00:00Z',
    ...overrides,
  }
}

export function buildStarredRepo(
  overrides: Partial<StarredRepo> = {},
): StarredRepo {
  return {
    description: 'Starred repository',
    full_name: 'owner/starred',
    html_url: 'https://github.com/owner/starred',
    language: 'Rust',
    private: false,
    stargazers_count: 1234,
    ...overrides,
  }
}

/** Replaces `globalThis.fetch` for a test; restore with `jest.restoreAllMocks`. */
export function mockFetch(
  handler: (url: string, init?: RequestInit) => Promise<Response> | Response,
) {
  return jest
    .spyOn(globalThis, 'fetch')
    .mockImplementation(((url: string, init?: RequestInit) =>
      Promise.resolve(handler(url, init))) as unknown as typeof fetch)
}

/** A JSON response body, as `fetch` would deliver it. */
export function jsonResponse(body: unknown): Response {
  return {
    json: () => Promise.resolve(body),
    ok: true,
    text: () => Promise.resolve(JSON.stringify(body)),
  } as Response
}
