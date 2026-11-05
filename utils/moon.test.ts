import { describe, expect, it } from 'bun:test'

import { moonPhase } from './moon.ts'

describe('moonPhase', () => {
  /** USNO's published times for these phases, in UT. */
  const published: [instant: string, name: string][] = [
    ['2026-01-18T19:52:00Z', 'new moon'],
    ['2026-01-26T04:47:00Z', 'first quarter'],
    ['2026-02-01T22:09:00Z', 'full moon'],
    ['2026-02-09T12:43:00Z', 'last quarter'],
  ]

  it.each(published)('names the published phase at %s', (instant, name) => {
    expect(moonPhase(new Date(instant)).name).toBe(name)
  })

  it('names the crescent between last quarter and new moon', () => {
    expect(moonPhase(new Date('2026-11-05T12:00:00Z'))).toEqual({
      emoji: '🌘',
      name: 'waning crescent',
    })
  })
})
