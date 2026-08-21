import { describe, expect, it } from 'bun:test'

import { buildRepo } from '../fixtures.ts'
import { renderRecentRepos } from './recentRepos.ts'

describe('renderRecentRepos', () => {
  it('fits two columns and states language and push date under the name', () => {
    const section = renderRecentRepos({
      npmPackages: new Map(),
      repos: [
        buildRepo({ name: 'twinlink', pushed_at: '2026-07-11T00:00:00Z' }),
      ],
    })

    expect(section.split('\n')[0]).toBe('| Repository | What it does |')
    expect(section).toContain(
      '<sub>TypeScript · pushed Jul&nbsp;11,&nbsp;2026</sub>',
    )
  })

  it('no longer embeds remote repository cards', () => {
    expect(
      renderRecentRepos({ npmPackages: new Map(), repos: [buildRepo()] }),
    ).not.toContain('gh-card.dev')
  })

  it('falls back to the npm description', () => {
    expect(
      renderRecentRepos({
        npmPackages: new Map([
          [
            'twinlink',
            {
              description: 'WebRTC toolkit',
              name: 'twinlink',
              version: '1.0.0',
            },
          ],
        ]),
        repos: [buildRepo({ description: null, name: 'twinlink' })],
      }),
    ).toContain('WebRTC toolkit')
  })

  it('tolerates a repository that was never pushed to', () => {
    expect(
      renderRecentRepos({
        npmPackages: new Map(),
        repos: [buildRepo({ pushed_at: null })],
      }),
    ).toContain('<sub>TypeScript</sub>')
  })

  it('reports an empty list', () => {
    expect(renderRecentRepos({ npmPackages: new Map(), repos: [] })).toBe(
      'No recent repositories available.',
    )
  })
})
