import { describe, expect, it } from 'bun:test'

import { renderFixedIssues } from './fixedIssues.ts'
import type { Issue } from '../types.ts'

function issue(repo: string, title: string): Issue {
  return {
    closed_at: '2026-08-17T00:00:00Z',
    html_url: `https://github.com/${repo}/issues/1`,
    labels: [{ name: 'bug' }],
    repository_url: `https://api.github.com/repos/${repo}`,
    state_reason: 'completed',
    title,
  }
}

describe('renderFixedIssues', () => {
  it('names the project and links the report', () => {
    const section = renderFixedIssues({
      repoStars: new Map(),
      search: {
        items: [issue('vuejs/vitepress', 'Broken anchor on reload')],
        total_count: 1,
      },
    })

    expect(section).toContain(
      '**[vuejs/vitepress](https://github.com/vuejs/vitepress)**',
    )
    expect(section).toContain(
      '[Broken anchor on reload](https://github.com/vuejs/vitepress/issues/1)',
    )
  })

  it('caps the list at five reports', () => {
    const items = Array.from({ length: 9 }, (_, index) =>
      issue(`owner/repo-${index}`, `bug ${index}`),
    )

    expect(
      renderFixedIssues({
        repoStars: new Map(),
        search: { items, total_count: items.length },
      }).split('\n'),
    ).toHaveLength(5)
  })

  it('drops the [BUG] prefix, which the heading already says', () => {
    expect(
      renderFixedIssues({
        repoStars: new Map(),
        search: {
          items: [issue('a/b', '[BUG] it crashes')],
          total_count: 1,
        },
      }),
    ).toContain('[it crashes](https://github.com/a/b/issues/1)')
  })

  it('escapes brackets but keeps a code span readable', () => {
    expect(
      renderFixedIssues({
        repoStars: new Map(),
        search: {
          items: [issue('a/b', '`font-mono | mono` mismatch [regression]')],
          total_count: 1,
        },
      }),
    ).toContain('`font-mono | mono` mismatch \\[regression\\]')
  })

  it('reports when nothing was fixed', () => {
    expect(
      renderFixedIssues({
        repoStars: new Map(),
        search: { items: [], total_count: 0 },
      }),
    ).toBe('No fixed upstream issues available.')
  })

  it('gives the project scale and the fix date', () => {
    const section = renderFixedIssues({
      repoStars: new Map([['vuejs/vitepress', 15234]]),
      search: {
        items: [issue('vuejs/vitepress', 'Broken anchor')],
        total_count: 1,
      },
    })

    expect(section).toContain('⭐&nbsp;15,234<br>')
    expect(section).toContain('<sub>fixed Aug&nbsp;17,&nbsp;2026</sub>')
  })
})
