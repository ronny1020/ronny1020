import { describe, expect, it } from 'bun:test'

import { buildPullRequest, buildPullRequestLink } from '../fixtures.ts'
import type { PullRequest } from '../types.ts'
import { renderUpstreamPullRequests } from './upstreamPullRequests.ts'

function pullRequest(repo: string, overrides: Partial<PullRequest> = {}) {
  return buildPullRequest({
    repository_url: `https://api.github.com/repos/${repo}`,
    ...overrides,
  })
}

function render(items: PullRequest[], repoStars = new Map<string, number>()) {
  return renderUpstreamPullRequests({
    repoStars,
    search: { items, total_count: items.length },
  })
}

describe('renderUpstreamPullRequests', () => {
  it('reports the scale of each project it landed in', () => {
    expect(
      render(
        [pullRequest('TanStack/query')],
        new Map([['TanStack/query', 50178]]),
      ),
    ).toContain(
      '**[TanStack/query](https://github.com/TanStack/query)** ⭐&nbsp;50,178',
    )
  })

  it('renders a list, which cannot clip on a phone', () => {
    expect(render([pullRequest('TanStack/query')])).not.toContain('| --- |')
  })

  it('drops pull requests that were never merged', () => {
    const section = render([
      pullRequest('pixijs/pixijs', {
        pull_request: buildPullRequestLink(null),
        title: 'still open',
      }),
      pullRequest('TanStack/query', { title: 'merged work' }),
    ])

    expect(section).toContain('merged work')
    expect(section).not.toContain('still open')
  })

  it('keeps the newest merge per project', () => {
    const section = render([
      pullRequest('TanStack/query', {
        pull_request: buildPullRequestLink('2024-01-01T00:00:00Z'),
        title: 'older',
      }),
      pullRequest('TanStack/query', { title: 'newest' }),
    ])

    expect(section).toContain('newest')
    expect(section).not.toContain('older')
  })

  it('caps the list at eight projects', () => {
    const section = render(
      Array.from({ length: 12 }, (_, index) =>
        pullRequest(`owner/repo-${index}`),
      ),
    )

    expect(
      section.split('\n').filter((line) => line.startsWith('- ')),
    ).toHaveLength(8)
  })

  it('reports the total from the search, not the list length', () => {
    expect(
      renderUpstreamPullRequests({
        repoStars: new Map(),
        search: { items: [pullRequest('TanStack/query')], total_count: 7 },
      }),
    ).toContain('7 pull requests merged')
  })

  it('escapes a title that would break the line', () => {
    expect(
      render([
        pullRequest('TanStack/query', { title: 'fix: allow a|b [RFC]' }),
      ]),
    ).toContain('fix: allow a\\|b \\[RFC\\]')
  })

  it('reports when nothing was merged', () => {
    expect(
      render([
        pullRequest('a/b', { pull_request: buildPullRequestLink(null) }),
      ]),
    ).toBe('No merged upstream pull requests available.')
  })
})
