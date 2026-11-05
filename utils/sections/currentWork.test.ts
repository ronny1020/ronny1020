import { describe, expect, it } from 'bun:test'

import { buildRepo } from '../fixtures.ts'
import { renderCurrentWork } from './currentWork.ts'

describe('renderCurrentWork', () => {
  it('names the project, its description and the push count', () => {
    expect(
      renderCurrentWork({
        pushes: 2,
        repo: buildRepo({
          description: 'Run AI agent CLIs in tabs',
          html_url: 'https://github.com/ronny1020/muster',
          name: 'muster',
        }),
      }),
    ).toBe(
      "🔨 Lately I'm mostly pushing to [**muster**](https://github.com/ronny1020/muster) — Run AI agent CLIs in tabs <sub>2&nbsp;pushes in 14&nbsp;days</sub>",
    )
  })

  it('says push, not pushes, for one', () => {
    expect(renderCurrentWork({ pushes: 1, repo: buildRepo() })).toContain(
      '1&nbsp;push in',
    )
  })

  it('keeps brackets in a description from turning into a link', () => {
    expect(
      renderCurrentWork({
        pushes: 1,
        repo: buildRepo({ description: 'see [docs](x)' }),
      }),
    ).toContain('see \\[docs\\](x)')
  })

  it('is empty after a quiet stretch', () => {
    expect(renderCurrentWork(null)).toBe('')
  })
})
