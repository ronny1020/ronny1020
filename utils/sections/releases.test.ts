import { describe, expect, it } from 'bun:test'

import { buildRelease } from '../fixtures.ts'
import { renderReleases } from './releases.ts'

describe('renderReleases', () => {
  it('links each release to its release page with the date', () => {
    expect(
      renderReleases([
        buildRelease({
          html_url: 'https://github.com/ronny1020/muster/releases/tag/v0.7.1',
          published_at: '2026-11-04T05:50:53Z',
          repo: 'muster',
          tag_name: 'v0.7.1',
        }),
      ]),
    ).toBe(
      '- [**muster** v0.7.1](<https://github.com/ronny1020/muster/releases/tag/v0.7.1>) <sub>Nov&nbsp;4,&nbsp;2026</sub>',
    )
  })

  it('names the window when there is nothing to list', () => {
    expect(renderReleases([])).toBe('No releases in the last 365&nbsp;days.')
  })
})
