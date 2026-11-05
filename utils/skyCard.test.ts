import { describe, expect, it } from 'bun:test'

import { renderSkyCards, sunArc } from './skyCard.ts'
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

  it('draws a clear sky with a sun and no weather', () => {
    const svg = lightCard(forecast(0))

    expect(svg).toContain('class="sun"')
    expect(svg).not.toContain('class="cloud"')
    expect(svg).toContain('a lovely clear day')
  })

  it('draws rain under clouds and a flash in a storm', () => {
    expect(lightCard(forecast(63))).toContain('<line class="fall"')
    expect(lightCard(forecast(95))).toContain('class="flash"')
    expect(lightCard(forecast(73))).toContain('class="fall snow"')
  })

  it('leaves the sun out when there is no forecast', () => {
    const svg = lightCard(null)

    expect(svg).not.toContain('class="sun"')
    expect(svg).toContain('The sky over Taipei')
  })

  it('stops animating for viewers who prefer reduced motion', () => {
    expect(lightCard(forecast(63))).toContain(
      '@media (prefers-reduced-motion: reduce)',
    )
  })
})

describe('sunArc', () => {
  const day = (sunrise: string, sunset: string): Forecast => ({
    ...forecast(0),
    sunrise: new Date(sunrise),
    sunset: new Date(sunset),
  })

  it('places sunrise and sunset on a 24-hour axis across the card', () => {
    // Taipei is UTC+8: 22:00 UTC is 6:00 there.
    const arc = sunArc(day('2026-11-04T22:00:00Z', '2026-11-05T10:00:00Z'))

    expect([arc.startX, arc.endX]).toEqual([85, 255])
    expect(arc.centerX).toBe(170)
  })

  it('draws a wider arc for a longer day', () => {
    const winter = sunArc(day('2026-12-21T22:40:00Z', '2026-12-22T09:10:00Z'))
    const summer = sunArc(day('2026-06-20T21:05:00Z', '2026-06-21T10:50:00Z'))

    expect(summer.endX - summer.startX).toBeGreaterThan(
      winter.endX - winter.startX,
    )
  })

  it('rotates the sun from sunrise on the horizon to the peak', () => {
    const arc = sunArc(day('2026-11-04T22:03:00Z', '2026-11-05T09:11:00Z'))
    const angle = (arc.halfAngle * Math.PI) / 180

    expect(arc.centerX - arc.radius * Math.sin(angle)).toBeCloseTo(
      arc.startX,
      1,
    )
    expect(arc.centerY - arc.radius * Math.cos(angle)).toBeCloseTo(92, 1)
  })

  it('falls back to a 6:00 to 18:00 day without sun times', () => {
    const arc = sunArc(null)

    expect([arc.startX, arc.endX]).toEqual([85, 255])
  })
})
