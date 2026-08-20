import { afterEach, describe, expect, it, jest } from 'bun:test'

import { buildRepo } from './fixtures.ts'
import {
  byStars,
  isOwnRepo,
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

describe('pickFeaturedRepos', () => {
  it('takes the most starred non-archived repositories', () => {
    const featured = pickFeaturedRepos([
      buildRepo({ name: 'archived', archived: true, stargazers_count: 99 }),
      buildRepo({ name: 'fork', fork: true, stargazers_count: 50 }),
      buildRepo({ name: 'a', stargazers_count: 5 }),
      buildRepo({ name: 'b', stargazers_count: 8 }),
    ])

    expect(featured.map((repo) => repo.name)).toEqual(['b', 'a'])
  })

  it('caps the list at four projects', () => {
    const repos = Array.from({ length: 9 }, (_, index) =>
      buildRepo({ name: `repo-${index}`, stargazers_count: index }),
    )

    expect(pickFeaturedRepos(repos)).toHaveLength(4)
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
})

describe('repoDescription', () => {
  it('falls back to the npm description, then to a dash', () => {
    const repo = buildRepo({ description: null })

    expect(repoDescription(buildRepo())).toBe('A test repository')
    expect(
      repoDescription(repo, { description: 'From npm', name: 'example' }),
    ).toBe('From npm')
    expect(repoDescription(repo)).toBe('—')
  })
})
