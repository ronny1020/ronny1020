import { afterEach, describe, expect, it, jest } from 'bun:test'

import { buildRepo, mockFetch } from './fixtures.ts'
import { fetchNpmPackages } from './npm.ts'

afterEach(() => {
  jest.restoreAllMocks()
})

type Manifest = {
  name: string
  description?: string
  repository?: string | { url?: string }
  version?: string
}

function mockRegistry(packages: Record<string, Manifest>) {
  return mockFetch((url) => {
    const requested = url
      .replace('https://registry.npmjs.org/', '')
      .replace('/latest', '')
    const manifest = Object.entries(packages).find(
      ([name]) => name.replace('/', '%2F') === requested,
    )?.[1]

    return {
      json: () => Promise.resolve(manifest),
      ok: manifest !== undefined,
    } as Response
  })
}

function ownedManifest(name: string, repo: string, description?: string) {
  return {
    description,
    name,
    repository: { url: `git+https://github.com/ronny1020/${repo}.git` },
    version: '1.0.0',
  }
}

describe('fetchNpmPackages', () => {
  it('reads the scoped package name out of an npm homepage', async () => {
    const fetchMock = mockRegistry({
      '@channel-state/core': ownedManifest(
        '@channel-state/core',
        'channel-state',
        'Cross-tab state',
      ),
    })

    const packages = await fetchNpmPackages([
      buildRepo({
        homepage: 'https://www.npmjs.com/package/@channel-state/core',
        name: 'channel-state',
      }),
    ])

    expect(packages.get('channel-state')).toEqual({
      description: 'Cross-tab state',
      name: '@channel-state/core',
      version: '1.0.0',
    })
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('%2Fcore/latest')
  })

  it('ignores the version path of an npm homepage', async () => {
    mockRegistry({
      'condition-switch': ownedManifest('condition-switch', 'condition-switch'),
    })

    const packages = await fetchNpmPackages([
      buildRepo({
        homepage: 'https://www.npmjs.com/package/condition-switch/v/1.2.0',
        name: 'condition-switch',
      }),
    ])

    expect(packages.get('condition-switch')?.name).toBe('condition-switch')
  })

  it('falls back to the repository name', async () => {
    mockRegistry({ twinlink: ownedManifest('twinlink', 'twinlink') })

    const packages = await fetchNpmPackages([buildRepo({ name: 'twinlink' })])

    expect(packages.get('twinlink')).toEqual({
      description: null,
      name: 'twinlink',
      version: '1.0.0',
    })
  })

  it('rejects a same-named package published by somebody else', async () => {
    mockRegistry({
      docs: {
        description: "A stranger's package",
        name: 'docs',
        repository: { url: 'git+https://github.com/other-person/docs.git' },
      },
    })

    const packages = await fetchNpmPackages([buildRepo({ name: 'docs' })])

    expect(packages.size).toBe(0)
  })

  it('omits repositories that publish nothing', async () => {
    mockRegistry({})

    const packages = await fetchNpmPackages([buildRepo({ name: 'private' })])

    expect(packages.size).toBe(0)
  })

  it('survives a registry request that throws', async () => {
    mockFetch(() => Promise.reject(new TypeError('Unable to connect')))

    expect(await fetchNpmPackages([buildRepo()])).toEqual(new Map())
  })
})
