import { describe, expect, it } from 'bun:test'

import { buildRepo } from '../fixtures.ts'
import { renderFeaturedProjects } from './featuredProjects.ts'

const repo = buildRepo({ name: 'channel-state', stargazers_count: 14 })

function render(overrides = {}) {
  return renderFeaturedProjects({
    monthlyDownloads: new Map(),
    npmPackages: new Map(),
    repos: [repo],
    siteLinks: new Map(),
    ...overrides,
  })
}

describe('renderFeaturedProjects', () => {
  it('fits three columns so a phone cannot clip a cell', () => {
    expect(render().split('\n')[0]).toBe(
      '| Project | What it does | Installs |',
    )
  })

  it('puts stars, language, and the version under the name as text', () => {
    const section = render({
      npmPackages: new Map([
        [
          'channel-state',
          { description: null, name: '@channel-state/core', version: '1.0.0' },
        ],
      ]),
    })

    expect(section).toContain(
      '[**channel-state**](https://github.com/ronny1020/example)<br><sub>⭐&nbsp;14 · TypeScript · [v1.0.0](https://www.npmjs.com/package/@channel-state/core)</sub>',
    )
  })

  it('reports monthly installs for a published package', () => {
    const section = render({
      monthlyDownloads: new Map([['@channel-state/core', 25447]]),
      npmPackages: new Map([
        [
          'channel-state',
          { description: null, name: '@channel-state/core', version: '1.0.0' },
        ],
      ]),
    })

    expect(section).toContain('| 25,447/mo |')
  })

  it('shows a dash when a project publishes nothing', () => {
    expect(render()).toContain('| — |')
  })

  it('links a reachable demo site', () => {
    expect(
      render({
        siteLinks: new Map([['channel-state', 'https://demo.example']]),
      }),
    ).toContain('[site](https://demo.example)')
  })

  it('truncates a description that would squeeze the other columns', () => {
    expect(
      render({
        repos: [buildRepo({ description: 'word '.repeat(40).trim() })],
      }),
    ).toContain('word…')
  })

  it('escapes a description that would split a row', () => {
    expect(
      render({ repos: [buildRepo({ description: 'Parses a|b|c [pipes]' })] }),
    ).toContain('Parses a\\|b\\|c \\[pipes\\]')
  })

  it('reports an empty project list', () => {
    expect(render({ repos: [] })).toBe('No featured projects available.')
  })
})

describe('featured project sub-line', () => {
  it('uses no badge image, which would wrap onto its own row', () => {
    expect(
      renderFeaturedProjects({
        monthlyDownloads: new Map(),
        npmPackages: new Map([
          [
            'channel-state',
            { description: null, name: 'channel-state', version: '0.1.0' },
          ],
        ]),
        repos: [repo],
        siteLinks: new Map(),
      }),
    ).not.toContain('img.shields.io')
  })
})
