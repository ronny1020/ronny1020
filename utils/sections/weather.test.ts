import { describe, expect, it } from 'bun:test'

import type { Forecast } from '../types.ts'
import { renderWeather, renderWeatherFacts } from './weather.ts'

function forecast(overrides: Partial<Forecast>): Forecast {
  return {
    code: 0,
    daylight: null,
    daylightChange: null,
    high: 25,
    low: 21,
    peakAqi: null,
    rainChance: 0,
    sea: null,
    sunrise: null,
    sunset: null,
    ...overrides,
  }
}

describe('renderWeather', () => {
  it('greets without a forecast', () => {
    expect(renderWeather(null)).toBe('👋 Hello from Taipei!')
  })

  it('describes a clear day with rounded temperatures', () => {
    expect(
      renderWeather(
        forecast({ code: 0, high: 29.6, low: 20.4, rainChance: 0 }),
      ),
    ).toBe('☀️ Hello from Taipei — a lovely clear day today, 20–30&nbsp;°C.')
  })

  it('mentions rain once it is likely', () => {
    expect(
      renderWeather(forecast({ code: 61, high: 25, low: 21, rainChance: 70 })),
    ).toContain(
      '🌧️ Hello from Taipei — rainy today, 21–25&nbsp;°C, 70% chance of rain ☂️.',
    )
  })

  it('falls back to a greeting for an unknown code', () => {
    expect(
      renderWeather(forecast({ code: 42, high: 25, low: 21, rainChance: 0 })),
    ).toBe('👋 Hello from Taipei!')
  })
})

describe('renderWeatherFacts', () => {
  /** 2026-11-05 in Taipei; the moon is a waning crescent that evening. */
  const now = new Date('2026-11-04T16:00:00Z')
  const facts = (overrides: Partial<Forecast>) =>
    renderWeatherFacts({ forecast: forecast(overrides), now }).split('<br>\n')

  it('puts the sun and the day length on the first line, in Taipei time', () => {
    expect(
      facts({
        daylight: 40_048,
        daylightChange: -74,
        sunrise: new Date('2026-11-04T22:03:00Z'),
        sunset: new Date('2026-11-05T09:11:00Z'),
      })[0],
    ).toMatch(
      /^🌅 6:03\sAM · 🌇 5:11\sPM · ☀️ 11&nbsp;h 7&nbsp;m of daylight, 1 minute shorter than yesterday$/,
    )
  })

  it('says when the day barely changed, and when it grew', () => {
    expect(facts({ daylight: 40_000, daylightChange: 20 })[0]).toContain(
      'about as long as yesterday',
    )
    expect(facts({ daylight: 40_000, daylightChange: 150 })[0]).toContain(
      '3 minutes longer than yesterday',
    )
  })

  it("names tonight's moon and the sea off Keelung", () => {
    expect(facts({ sea: { temperature: 25.9, waveHeight: 1.62 } })[0]).toBe(
      '🌘 waning crescent tonight · 🌊 the sea off Keelung is 26&nbsp;°C, waves up to 1.6&nbsp;m',
    )
  })

  it('leaves the waves out when there is no reading', () => {
    expect(facts({ sea: { temperature: 25.9, waveHeight: null } })[0]).toBe(
      '🌘 waning crescent tonight · 🌊 the sea off Keelung is 26&nbsp;°C',
    )
  })

  it("puts the day's worst air last, named by its band", () => {
    expect(facts({ peakAqi: 151 }).at(-1)).toBe('🔴 peak US AQI 151, unhealthy')
  })

  it("reads tonight's moon from the Taipei date, not the UTC one", () => {
    // 00:00 on Jan 17 in Taipei; it is still Jan 16 in UTC.
    expect(
      renderWeatherFacts({
        forecast: null,
        now: new Date('2026-01-16T16:00:00Z'),
      }),
    ).toBe('🌑 new moon tonight')
  })

  it('leaves out waves too small to round to a tenth', () => {
    expect(facts({ sea: { temperature: 25, waveHeight: 0.02 } })[0]).toBe(
      '🌘 waning crescent tonight · 🌊 the sea off Keelung is 25&nbsp;°C',
    )
  })

  it('keeps the moon even without a forecast', () => {
    expect(renderWeatherFacts({ forecast: null, now })).toBe(
      '🌘 waning crescent tonight',
    )
  })
})
