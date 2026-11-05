import { afterEach, describe, expect, it, jest } from 'bun:test'

import { jsonResponse, mockFetch } from './fixtures.ts'
import { fetchStackOverflowStats } from './stackOverflow.ts'

afterEach(() => {
  jest.restoreAllMocks()
})

/** Answers on page 1 and 2, and the user record; anything else is a refusal. */
function stackExchange(url: string): Response {
  if (url.includes('/answers?')) {
    return jsonResponse(
      url.endsWith('page=1')
        ? { has_more: true, items: [{ is_accepted: true }, {}] }
        : { has_more: false, items: [{ is_accepted: false }] },
    )
  }

  return jsonResponse({ items: [{ reputation: 881 }] })
}

describe('fetchStackOverflowStats', () => {
  it('counts answers across pages, the accepted ones, and reputation', async () => {
    mockFetch(stackExchange)

    expect(await fetchStackOverflowStats()).toEqual({
      accepted: 1,
      answers: 3,
      reputation: 881,
    })
  })

  it('gives null rather than a capped count when pages run out', async () => {
    mockFetch((url) =>
      url.includes('/answers?')
        ? jsonResponse({ has_more: true, items: [{}] })
        : stackExchange(url),
    )

    expect(await fetchStackOverflowStats()).toBeNull()
  })

  it('gives null when the user record is refused', async () => {
    mockFetch((url) =>
      url.includes('/answers?')
        ? stackExchange(url)
        : ({ ok: false } as Response),
    )

    expect(await fetchStackOverflowStats()).toBeNull()
  })

  it('gives null when the API throws', async () => {
    mockFetch(() => {
      throw new Error('offline')
    })

    expect(await fetchStackOverflowStats()).toBeNull()
  })
})
