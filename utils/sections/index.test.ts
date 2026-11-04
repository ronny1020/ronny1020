import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'bun:test'

import { MAIN_PROFILE_PATH } from '../config.ts'
import {
  buildMaintainedProject,
  buildRepo,
  buildStarredRepo,
  buildUser,
} from '../fixtures.ts'
import { renderTemplate } from '../template.ts'
import { renderSections } from './index.ts'

const sections = renderSections({
  dependencyCounts: new Map([
    ['typescript', 9],
    ['vite', 7],
    ['eslint', 7],
    ['prettier', 6],
    ['vitest', 4],
    ['react', 3],
  ]),
  featured: [buildRepo()],
  fixedIssues: { items: [], total_count: 0 },
  generatedAt: new Date('2026-11-04T06:52:00Z'),
  maintained: buildMaintainedProject(),
  monthlyDownloads: new Map([['example', 12]]),
  npmPackages: new Map(),
  packageNames: ['example'],
  publishedPackages: new Map(),
  recent: [buildRepo()],
  repos: [buildRepo()],
  siteLinks: new Map(),
  socialAccounts: [{ provider: 'twitter', url: 'https://twitter.com/someone' }],
  starred: [buildStarredRepo()],
  upstream: { items: [], total_count: 0 },
  repoStars: new Map(),
  user: buildUser(),
  weather: {
    code: 0,
    high: 30,
    low: 21,
    peakAqi: 42,
    rainChance: 0,
    sunrise: new Date('2026-11-03T22:00:00Z'),
    sunset: new Date('2026-11-04T09:15:00Z'),
  },
  yearlyDownloads: 380538,
})

describe('renderSections', () => {
  it('covers exactly the markers the template uses', () => {
    const template = readFileSync(MAIN_PROFILE_PATH, 'utf8')
    const markers = [
      ...template.matchAll(/<!--\s*generated:([\w-]+)\s*-->/g),
    ].map(([, name]) => name)

    expect([...markers].sort()).toEqual(Object.keys(sections).sort())
  })

  it('renders every section as non-empty markdown', () => {
    for (const [name, markdown] of Object.entries(sections)) {
      expect(markdown.trim(), `section ${name}`).not.toBe('')
    }
  })

  it('keeps the page centred when the forecast has no facts', () => {
    const template = readFileSync(MAIN_PROFILE_PATH, 'utf8')
    const html = Bun.markdown.html(
      renderTemplate(template, { ...sections, weatherFacts: '' }),
    )

    expect(html).toMatch(/<p align="center">\s*<sub>Weather data by/)
  })
})
