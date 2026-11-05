import { describe, expect, it } from 'bun:test'

import { buildMaintainedProject, buildRepo, buildUser } from '../fixtures.ts'
import { renderHighlights } from './highlights.ts'

const section = renderHighlights({
  maintained: buildMaintainedProject(),
  repos: [
    buildRepo({ forks_count: 3, stargazers_count: 14 }),
    buildRepo({ fork: true, name: 'fork', stargazers_count: 500 }),
  ],
  stackOverflow: { accepted: 17, answers: 58, reputation: 881 },
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

  it('counts Stack Overflow answers, accepted ones and reputation', () => {
    expect(section).toContain(
      '<b>58</b> Stack Overflow answers, <b>17</b> accepted, <b>881</b> reputation',
    )
  })

  it('says answer, not answers, for one', () => {
    expect(
      renderHighlights({
        maintained: buildMaintainedProject(),
        repos: [],
        stackOverflow: { accepted: 0, answers: 1, reputation: 1 },
        upstreamCount: 0,
        upstreamStars: 0,
        user: buildUser(),
        yearlyDownloads: 0,
      }),
    ).toContain('<b>1</b> Stack Overflow answer, <b>0</b> accepted')
  })

  it('leaves Stack Overflow out when the API gave nothing', () => {
    expect(
      renderHighlights({
        maintained: buildMaintainedProject(),
        repos: [],
        stackOverflow: null,
        upstreamCount: 0,
        upstreamStars: 0,
        user: buildUser(),
        yearlyDownloads: 0,
      }),
    ).not.toContain('Stack Overflow')
  })

  it('counts stars from own repositories only', () => {
    expect(section).toContain('<b>14</b> stars on my own repositories')
  })

  it('is text, so it reflows instead of wrapping into an orphan badge', () => {
    expect(section).not.toContain('img.shields.io')
    expect(section).toContain('<sub>')
  })
})
