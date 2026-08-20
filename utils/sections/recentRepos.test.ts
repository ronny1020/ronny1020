import { describe, expect, it } from 'bun:test'

import { buildRepo } from '../fixtures.ts'
import { renderRecentRepos } from './recentRepos.ts'

describe('renderRecentRepos', () => {
  it('lists a repository card per row and formats the push date', () => {
    const section = renderRecentRepos({
      npmPackages: new Map(),
      repos: [
        buildRepo({ name: 'twinlink', pushed_at: '2026-07-11T00:00:00Z' }),
      ],
    })

    expect(section).toContain('Jul 11, 2026')
    expect(section).toContain('gh-card.dev/repos/ronny1020/twinlink.svg')
  })

  it('falls back to the npm description', () => {
    const section = renderRecentRepos({
      npmPackages: new Map([
        ['twinlink', { description: 'WebRTC toolkit', name: 'twinlink' }],
      ]),
      repos: [buildRepo({ name: 'twinlink', description: null })],
    })

    expect(section).toContain('WebRTC toolkit')
  })

  it('tolerates a repository that was never pushed to', () => {
    const section = renderRecentRepos({
      npmPackages: new Map(),
      repos: [buildRepo({ pushed_at: null })],
    })

    expect(section).toContain('| — |')
  })

  it('reports an empty list', () => {
    expect(renderRecentRepos({ npmPackages: new Map(), repos: [] })).toBe(
      'No recent repositories available.',
    )
  })
})
