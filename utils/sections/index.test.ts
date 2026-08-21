import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'bun:test'

import { MAIN_PROFILE_PATH } from '../config.ts'
import {
  buildMaintainedProject,
  buildRepo,
  buildStarredRepo,
  buildUser,
} from '../fixtures.ts'
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
  upstreamStars: new Map(),
  user: buildUser(),
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
})
