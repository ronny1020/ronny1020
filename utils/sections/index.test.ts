import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'bun:test'

import { MAIN_PROFILE_PATH } from '../config.ts'
import { buildRepo, buildStarredRepo, buildUser } from '../fixtures.ts'
import { renderSections } from './index.ts'

const sections = renderSections({
  authoredPullRequestCount: 172,
  featured: [buildRepo()],
  npmPackages: new Map(),
  recent: [buildRepo()],
  repos: [buildRepo()],
  siteLinks: new Map(),
  starred: [buildStarredRepo()],
  upstream: { items: [], total_count: 0 },
  user: buildUser(),
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
