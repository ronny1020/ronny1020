import { afterEach, describe, expect, it, jest } from 'bun:test'

import { buildRepo } from './fixtures.ts'
import {
  byStars,
  isOwnRepo,
  pickFeaturedCandidates,
  pickFeaturedRepos,
  pickRecentRepos,
  repoDescription,
  sumBy,
} from './repos.ts'

afterEach(() => {
  jest.restoreAllMocks()
})

describe('isOwnRepo', () => {
  it('keeps a plain repository', () => {
    expect(isOwnRepo(buildRepo())).toBe(true)
  })

  it('drops forks, the profile repo, and excluded repos', () => {
    expect(isOwnRepo(buildRepo({ fork: true }))).toBe(false)
    expect(isOwnRepo(buildRepo({ name: 'ronny1020' }))).toBe(false)
    expect(isOwnRepo(buildRepo({ name: 'vue-reactive-form' }))).toBe(false)
  })
})

describe('byStars', () => {
  it('sorts descending', () => {
    const repos = [
      buildRepo({ name: 'low', stargazers_count: 1 }),
      buildRepo({ name: 'high', stargazers_count: 9 }),
    ].sort(byStars)

    expect(repos.map((repo) => repo.name)).toEqual(['high', 'low'])
  })
})

describe('sumBy', () => {
  it('adds the picked field', () => {
    expect(
      sumBy(
        [
          buildRepo({ stargazers_count: 2 }),
          buildRepo({ stargazers_count: 5 }),
        ],
        (repo) => repo.stargazers_count,
      ),
    ).toBe(7)
  })
})

describe('pickFeaturedCandidates', () => {
  it('takes the most starred non-archived repositories', () => {
    const featured = pickFeaturedCandidates([
      buildRepo({ name: 'archived', archived: true, stargazers_count: 99 }),
      buildRepo({ name: 'fork', fork: true, stargazers_count: 50 }),
      buildRepo({ name: 'a', stargazers_count: 5 }),
      buildRepo({ name: 'b', stargazers_count: 8 }),
    ])

    expect(featured.map((repo) => repo.name)).toEqual(['b', 'a'])
  })

  it('keeps every eligible project, so exclusions cannot leave a slot empty', () => {
    const repos = Array.from({ length: 12 }, (_, index) =>
      buildRepo({ name: `repo-${index}`, stargazers_count: index }),
    )

    expect(pickFeaturedCandidates(repos)).toHaveLength(12)
  })
})

describe('pickFeaturedRepos', () => {
  const npmPackage = { description: '', name: 'listed-pkg', version: '1.0.0' }

  it('skips a project whose package already has a packages-table row', () => {
    const featured = pickFeaturedRepos({
      candidates: [buildRepo({ name: 'listed' }), buildRepo({ name: 'other' })],
      listedPackages: new Set(['listed-pkg']),
      npmPackages: new Map([['listed', npmPackage]]),
    })

    expect(featured.map((repo) => repo.name)).toEqual(['other'])
  })

  it('skips every repository of a scoped family with a row', () => {
    const featured = pickFeaturedRepos({
      candidates: [
        buildRepo({ name: 'channel-state' }),
        buildRepo({ name: 'b' }),
      ],
      listedPackages: new Set(['@channel-state/react']),
      npmPackages: new Map([
        ['channel-state', { ...npmPackage, name: '@channel-state/core' }],
      ]),
    })

    expect(featured.map((repo) => repo.name)).toEqual(['b'])
  })

  it('still skips a listed project when its package lookup failed', () => {
    const featured = pickFeaturedRepos({
      candidates: [buildRepo({ name: 'listed-pkg' }), buildRepo({ name: 'b' })],
      listedPackages: new Set(['listed-pkg']),
      npmPackages: new Map(),
    })

    expect(featured.map((repo) => repo.name)).toEqual(['b'])
  })

  it('caps the list at four projects', () => {
    const candidates = Array.from({ length: 8 }, (_, index) =>
      buildRepo({ name: `repo-${index}` }),
    )

    expect(
      pickFeaturedRepos({
        candidates,
        listedPackages: new Set(),
        npmPackages: new Map(),
      }),
    ).toHaveLength(4)
  })
})

describe('pickRecentRepos', () => {
  it('caps the list at four repositories', () => {
    const repos = Array.from({ length: 9 }, (_, index) =>
      buildRepo({ name: `repo-${index}` }),
    )

    expect(pickRecentRepos(repos)).toHaveLength(4)
  })

  it('preserves API order, which is newest push first', () => {
    const repos = pickRecentRepos([
      buildRepo({ name: 'newest' }),
      buildRepo({ name: 'fork', fork: true }),
      buildRepo({ name: 'older' }),
    ])

    expect(repos.map((repo) => repo.name)).toEqual(['newest', 'older'])
  })

  it('skips Homebrew taps and Scoop buckets, which only hold manifests', () => {
    const repos = pickRecentRepos([
      buildRepo({ name: 'homebrew-tap' }),
      buildRepo({ name: 'Scoop-Bucket' }),
      buildRepo({ name: 'scoop-ui' }),
      buildRepo({ name: 'react-tap' }),
      buildRepo({ name: 'token-bucket' }),
    ])

    expect(repos.map((repo) => repo.name)).toEqual([
      'scoop-ui',
      'react-tap',
      'token-bucket',
    ])
  })
})

describe('repoDescription', () => {
  it('falls back to the npm description, then to a dash', () => {
    const repo = buildRepo({ description: null })

    expect(repoDescription(buildRepo())).toBe('A test repository')
    expect(
      repoDescription(repo, {
        description: 'From npm',
        name: 'example',
        version: '1.0.0',
      }),
    ).toBe('From npm')
    expect(repoDescription(repo)).toBe('—')
  })
})
