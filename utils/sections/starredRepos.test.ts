import { describe, expect, it } from 'bun:test'

import { buildStarredRepo } from '../fixtures.ts'
import { renderStarredRepos } from './starredRepos.ts'

describe('renderStarredRepos', () => {
  it('lists each star with its language and star count', () => {
    expect(
      renderStarredRepos([
        buildStarredRepo({
          full_name: 'warpdotdev/warp',
          stargazers_count: 64369,
        }),
      ]),
    ).toContain(
      '[warpdotdev/warp](https://github.com/owner/starred) — Starred repository `Rust` ⭐ 64,369',
    )
  })

  it('handles a repository without a description or language', () => {
    expect(
      renderStarredRepos([
        buildStarredRepo({ description: null, language: null }),
      ]),
    ).toContain('no description `n/a`')
  })

  it('escapes a description that would split a row', () => {
    expect(
      renderStarredRepos([
        buildStarredRepo({ description: 'parses a|b [RFC]' }),
      ]),
    ).toContain('parses a\\|b \\[RFC\\]')
  })

  it('reports an empty list', () => {
    expect(renderStarredRepos([])).toBe('No starred repositories available.')
  })
})
