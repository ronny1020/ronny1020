import { describe, expect, it } from 'bun:test'

import { renderPackages } from './packages.ts'

const packageNames = ['condition-switch', 'react-json-formatter', 'twinlink']

function render(
  lastMonth: [string, number][],
  descriptions: [string, string][] = [],
) {
  return renderPackages({
    descriptions: new Map(
      descriptions.map(([name, description]) => [name, { description, name }]),
    ),
    lastMonth: new Map(lastMonth),
    packageNames,
  })
}

describe('renderPackages', () => {
  it('ranks by installs rather than by stars', () => {
    const rows = render([
      ['condition-switch', 76],
      ['react-json-formatter', 25447],
      ['twinlink', 21],
    ]).split('\n')

    expect(rows[2]).toContain('react-json-formatter')
    expect(rows[2]).toContain('25,447')
    expect(rows[3]).toContain('condition-switch')
    expect(rows[4]).toContain('twinlink')
  })

  it('includes scoped packages that share a repository with others', () => {
    const section = renderPackages({
      descriptions: new Map(),
      lastMonth: new Map([['@channel-state/core', 55]]),
      packageNames: ['@channel-state/core', '@channel-state/react'],
    })

    expect(section).toContain('[`@channel-state/core`]')
    expect(section).toContain('[`@channel-state/react`]')
  })

  it('shows the registry description when there is one', () => {
    expect(
      render([['twinlink', 21]], [['twinlink', 'WebRTC data channels']]),
    ).toContain('WebRTC data channels')
  })

  it('counts a package with no download data as zero', () => {
    expect(render([])).toContain('| 0 |')
  })

  it('reports an empty package list', () => {
    expect(
      renderPackages({
        descriptions: new Map(),
        lastMonth: new Map(),
        packageNames: [],
      }),
    ).toBe('No published packages available.')
  })
})
