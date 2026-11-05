import { describe, expect, it } from 'bun:test'

import { dayArc, renderSkyCards } from './skyCard.ts'
import type { Forecast } from './types.ts'

function forecast(code: number): Forecast {
  return {
    code,
    high: 30,
    low: 21,
    peakAqi: null,
    rainChance: 0,
    sunrise: null,
    sunset: null,
  }
}

const lightCard = (weather: Forecast | null) =>
  renderSkyCards(weather)['sky-light.svg'] ?? ''

describe('renderSkyCards', () => {
  it('names the files the README links', () => {
    expect(Object.keys(renderSkyCards(null)).sort()).toEqual([
      'sky-dark.svg',
      'sky-light.svg',
    ])
  })

  it('draws a clear sky with no weather and no sun', () => {
    const svg = lightCard(forecast(0))

    expect(svg).not.toContain('class="sun"')
    expect(svg).not.toContain('class="cloud"')
    expect(svg).toContain('a lovely clear day')
  })

  it('draws rain under clouds and a flash in a storm', () => {
    expect(lightCard(forecast(63))).toContain('<line class="fall"')
    expect(lightCard(forecast(95))).toContain('class="flash"')
    expect(lightCard(forecast(73))).toContain('class="fall snow"')
  })

  it('falls back to a plain label without a forecast', () => {
    expect(lightCard(null)).toContain('The sky over Taipei')
  })

  it('stops animating for viewers who prefer reduced motion', () => {
    expect(lightCard(forecast(63))).toContain(
      '@media (prefers-reduced-motion: reduce)',
    )
  })
})

describe('dayArc', () => {
  const day = (sunrise: string, sunset: string): Forecast => ({
    ...forecast(0),
    sunrise: new Date(sunrise),
    sunset: new Date(sunset),
  })

  it('places sunrise and sunset on a 24-hour axis across the card', () => {
    // Taipei is UTC+8: 22:00 UTC is 6:00 there.
    const arc = dayArc(day('2026-11-04T22:00:00Z', '2026-11-05T10:00:00Z'))

    expect([arc.startX, arc.endX]).toEqual([85, 255])
  })

  it('draws a wider arc for a longer day', () => {
    const winter = dayArc(day('2026-12-21T22:40:00Z', '2026-12-22T09:10:00Z'))
    const summer = dayArc(day('2026-06-20T21:05:00Z', '2026-06-21T10:50:00Z'))

    expect(summer.endX - summer.startX).toBeGreaterThan(
      winter.endX - winter.startX,
    )
  })

  it('peaks at the top of the card whatever the day length', () => {
    for (const arc of [
      dayArc(day('2026-11-04T22:03:00Z', '2026-11-05T09:11:00Z')),
      dayArc(day('2026-11-05T02:00:00Z', '2026-11-05T05:00:00Z')),
    ]) {
      const halfChord = (arc.endX - arc.startX) / 2
      const centerY = 30 + arc.radius

      expect(Math.hypot(halfChord, centerY - 92)).toBeCloseTo(arc.radius, 1)
    }
  })

  it('uses the large-arc flag only for a day shorter than its height', () => {
    expect(dayArc(null).largeArc).toBe(false)
    expect(
      dayArc(day('2026-11-05T02:00:00Z', '2026-11-05T05:00:00Z')).largeArc,
    ).toBe(true)
  })

  it('falls back to a 6:00 to 18:00 day without sun times', () => {
    expect([dayArc(null).startX, dayArc(null).endX]).toEqual([85, 255])
  })
})
