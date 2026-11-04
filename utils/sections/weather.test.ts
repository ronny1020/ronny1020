import { describe, expect, it } from 'bun:test'

import type { Forecast } from '../types.ts'
import { renderWeather, renderWeatherFacts } from './weather.ts'

function forecast(overrides: Partial<Forecast>): Forecast {
  return {
    code: 0,
    high: 25,
    low: 21,
    peakAqi: null,
    rainChance: 0,
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
  it("lists sunrise, sunset and the day's worst air in Taipei time", () => {
    expect(
      renderWeatherFacts(
        forecast({
          peakAqi: 42,
          sunrise: new Date('2026-11-03T22:01:00Z'),
          sunset: new Date('2026-11-04T09:15:00Z'),
        }),
      ),
    ).toMatch(
      /^<sub>🌅 6:01\sAM · 🌇 5:15\sPM · 🟢 peak US AQI 42, good<\/sub><br>$/,
    )
  })

  it('names the band an AQI falls in', () => {
    expect(renderWeatherFacts(forecast({ peakAqi: 151 }))).toContain(
      '🔴 peak US AQI 151, unhealthy',
    )
  })

  it('renders nothing without facts', () => {
    expect(renderWeatherFacts(null)).toBe('')
    expect(renderWeatherFacts(forecast({}))).toBe('')
  })
})
