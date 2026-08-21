import { describe, expect, it } from 'bun:test'

import { buildMaintainedProject } from '../fixtures.ts'
import { renderMaintained } from './maintained.ts'

describe('renderMaintained', () => {
  const section = renderMaintained(buildMaintainedProject())

  it('states my share of the commits and the merged pull requests', () => {
    expect(section).toContain('479 of the 680 human commits')
    expect(section).toContain('122 merged pull requests')
    expect(section).toContain('3 other contributors')
    expect(renderMaintained(buildMaintainedProject({ teamSize: 2 }))).toContain(
      '1 other contributor.',
    )
  })

  it('dates the last merge instead of claiming the project is active', () => {
    expect(section).toContain('most recently on May&nbsp;1,&nbsp;2026')
    expect(section).not.toContain('active')
  })

  it('omits the date when nothing has been merged', () => {
    expect(
      renderMaintained(buildMaintainedProject({ lastMergedAt: null })),
    ).not.toContain('most recently')
  })

  it('reports when there is no maintained project', () => {
    expect(renderMaintained(buildMaintainedProject({ commits: 0 }))).toBe(
      'No maintained project available.',
    )
  })
})
