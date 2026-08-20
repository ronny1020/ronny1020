import { describe, expect, it } from 'bun:test'

import { buildPullRequest, buildPullRequestLink } from '../fixtures.ts'
import type { PullRequest } from '../types.ts'
import { renderUpstreamPullRequests } from './upstreamPullRequests.ts'

function upstream(items: ReturnType<typeof buildPullRequest>[]) {
  return { items, total_count: items.length }
}

function pullRequest(repo: string, overrides: Partial<PullRequest> = {}) {
  return buildPullRequest({
    repository_url: `https://api.github.com/repos/${repo}`,
    ...overrides,
  })
}

describe('renderUpstreamPullRequests', () => {
  it('drops pull requests that were never merged', () => {
    const section = renderUpstreamPullRequests(
      upstream([
        pullRequest('pixijs/pixijs', {
          pull_request: buildPullRequestLink(null),
          title: 'still open',
        }),
        pullRequest('TanStack/query', { title: 'merged work' }),
      ]),
    )

    expect(section).toContain('merged work')
    expect(section).not.toContain('still open')
  })

  it('keeps only the most recent pull request per project', () => {
    const section = renderUpstreamPullRequests(
      upstream([
        pullRequest('TanStack/query', { title: 'newest' }),
        pullRequest('TanStack/query', { title: 'older' }),
      ]),
    )

    expect(section).toContain('newest')
    expect(section).not.toContain('older')
  })

  it('caps the table at five projects', () => {
    const section = renderUpstreamPullRequests(
      upstream(
        Array.from({ length: 9 }, (_, index) =>
          pullRequest(`owner/repo-${index}`),
        ),
      ),
    )

    expect(
      section
        .split('\n')
        .filter((line) => line.includes('](https://github.com/owner/')),
    ).toHaveLength(5)
  })

  it('reports the total merged count from the search, not the table size', () => {
    const section = renderUpstreamPullRequests({
      items: [pullRequest('TanStack/query')],
      total_count: 129,
    })

    expect(section).toContain('129 pull requests merged')
  })

  it('escapes a title that would split a row', () => {
    const section = renderUpstreamPullRequests(
      upstream([
        pullRequest('TanStack/query', { title: 'fix: allow a|b [RFC]' }),
      ]),
    )

    expect(section).toContain('fix: allow a\\|b \\[RFC\\]')
  })

  it('reports when nothing was merged', () => {
    expect(
      renderUpstreamPullRequests(
        upstream([
          pullRequest('a/b', { pull_request: buildPullRequestLink(null) }),
        ]),
      ),
    ).toBe('No merged upstream pull requests available.')
  })
})
