import { describe, expect, it } from 'bun:test'

import { buildMaintainedProject, buildRepo, buildUser } from '../fixtures.ts'
import { renderHighlights } from './highlights.ts'

const section = renderHighlights({
  maintained: buildMaintainedProject(),
  repos: [
    buildRepo({ forks_count: 3, stargazers_count: 14 }),
    buildRepo({ fork: true, name: 'fork', stargazers_count: 500 }),
  ],
  upstreamCount: 7,
  upstreamStars: 145000,
  user: buildUser(),
  yearlyDownloads: 380538,
})

describe('renderHighlights', () => {
  it('leads with installs, the only number showing outside use', () => {
    expect(section).toContain('<b>380,538</b> npm installs in the last year')
    expect(section.indexOf('installs')).toBeLessThan(section.indexOf('stars'))
  })

  it('states upstream reach and maintained commits', () => {
    expect(section).toContain(
      '<b>7</b> pull requests merged into projects with <b>145,000</b> stars',
    )
    expect(section).toContain('<b>479</b> commits maintaining')
  })

  it('counts stars from own repositories only', () => {
    expect(section).toContain('<b>14</b> stars on my own repositories')
  })

  it('is text, so it reflows instead of wrapping into an orphan badge', () => {
    expect(section).not.toContain('img.shields.io')
    expect(section).toContain('<sub>')
  })
})
