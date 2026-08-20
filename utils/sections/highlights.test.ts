import { describe, expect, it } from 'bun:test'

import { buildRepo, buildUser } from '../fixtures.ts'
import { renderHighlights } from './highlights.ts'

describe('renderHighlights', () => {
  const section = renderHighlights({
    pullRequestCount: 172,
    repos: [
      buildRepo({ forks_count: 3, stargazers_count: 14 }),
      buildRepo({ name: 'fork', fork: true, stargazers_count: 500 }),
    ],
    user: buildUser(),
  })

  it('counts stars and forks from own repositories only', () => {
    expect(section).toContain('Stars%20earned-14')
    expect(section).toContain('Forks-3')
  })

  it('shows the authored pull request count and the join year', () => {
    expect(section).toContain('Pull%20requests-172')
    expect(section).toContain('On%20GitHub%20since-2019')
  })

  it('centers the badges', () => {
    expect(section.startsWith('<p align="center">')).toBe(true)
    expect(section.endsWith('</p>')).toBe(true)
  })
})
