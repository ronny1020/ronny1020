import { afterEach, describe, expect, it, jest } from 'bun:test'

import { buildRepo, mockFetch } from './fixtures.ts'
import { fetchSiteLinks } from './siteLinks.ts'

afterEach(() => {
  jest.restoreAllMocks()
})

describe('fetchSiteLinks', () => {
  it('keeps reachable homepages and drops dead or npm ones', async () => {
    jest.spyOn(globalThis, 'fetch').mockImplementation(((url: string) =>
      Promise.resolve({
        ok: url.includes('live'),
      } as Response)) as typeof fetch)

    const siteLinks = await fetchSiteLinks([
      buildRepo({ homepage: 'https://live.example', name: 'live' }),
      buildRepo({ homepage: 'https://dead.example', name: 'dead' }),
      buildRepo({
        homepage: 'https://www.npmjs.com/package/example',
        name: 'onNpm',
      }),
      buildRepo({ homepage: '', name: 'blank' }),
    ])

    expect([...siteLinks]).toEqual([['live', 'https://live.example']])
  })

  it('drops a homepage whose host no longer resolves instead of failing the build', async () => {
    mockFetch(() => Promise.reject(new TypeError('Unable to connect')))

    expect(
      await fetchSiteLinks([
        buildRepo({ homepage: 'https://expired.example', name: 'expired' }),
      ]),
    ).toEqual(new Map())
  })

  it('bounds each request with a timeout', async () => {
    const fetchMock = mockFetch(() => ({ ok: true }) as Response)

    await fetchSiteLinks([
      buildRepo({ homepage: 'https://live.example', name: 'live' }),
    ])

    expect((fetchMock.mock.calls[0]?.[1] as RequestInit).signal).toBeDefined()
  })
})
