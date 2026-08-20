import { describe, expect, it } from 'bun:test'

import { buildRepo } from '../fixtures.ts'
import { renderFeaturedProjects } from './featuredProjects.ts'

const repo = buildRepo({ name: 'channel-state', stargazers_count: 14 })

describe('renderFeaturedProjects', () => {
  it('adds an npm version badge and links for a published package', () => {
    const section = renderFeaturedProjects({
      npmPackages: new Map([
        ['channel-state', { description: null, name: '@channel-state/core' }],
      ]),
      repos: [repo],
      siteLinks: new Map(),
    })

    expect(section).toContain(
      'img.shields.io/npm/v/@channel-state/core?style=flat-square',
    )
    expect(section).toContain(
      '[npm](https://www.npmjs.com/package/@channel-state/core)',
    )
    expect(section).not.toContain('[site]')
  })

  it('links a reachable demo site', () => {
    const section = renderFeaturedProjects({
      npmPackages: new Map(),
      repos: [repo],
      siteLinks: new Map([['channel-state', 'https://demo.example']]),
    })

    expect(section).toContain('[site](https://demo.example)')
    expect(section).not.toContain('img.shields.io/npm/v/')
  })

  it('prefers the npm description when the repository has none', () => {
    const section = renderFeaturedProjects({
      npmPackages: new Map([
        ['channel-state', { description: 'From npm', name: 'channel-state' }],
      ]),
      repos: [buildRepo({ name: 'channel-state', description: null })],
      siteLinks: new Map(),
    })

    expect(section).toContain('From npm')
  })

  it('keeps the star emoji and count on one line', () => {
    const section = renderFeaturedProjects({
      npmPackages: new Map(),
      repos: [repo],
      siteLinks: new Map(),
    })

    expect(section).toContain('⭐&nbsp;14')
  })

  it('escapes a description that would split a row', () => {
    const section = renderFeaturedProjects({
      npmPackages: new Map(),
      repos: [buildRepo({ description: 'Parses a|b|c [pipes]' })],
      siteLinks: new Map(),
    })

    expect(section).toContain('Parses a\\|b\\|c \\[pipes\\]')
  })

  it('reports an empty project list', () => {
    expect(
      renderFeaturedProjects({
        npmPackages: new Map(),
        repos: [],
        siteLinks: new Map(),
      }),
    ).toBe('No featured projects available.')
  })
})
