import { describe, expect, it } from 'bun:test'

import { renderWeather } from './weather.ts'

describe('renderWeather', () => {
  it('greets without a forecast', () => {
    expect(renderWeather(null)).toBe('👋 Hello from Taipei!')
  })

  it('describes a clear day with rounded temperatures', () => {
    expect(
      renderWeather({ code: 0, high: 29.6, low: 20.4, rainChance: 0 }),
    ).toBe('☀️ Hello from Taipei — a lovely clear day today, 20–30&nbsp;°C.')
  })

  it('mentions rain once it is likely', () => {
    expect(
      renderWeather({ code: 61, high: 25, low: 21, rainChance: 70 }),
    ).toContain(
      '🌧️ Hello from Taipei — rainy today, 21–25&nbsp;°C, 70% chance of rain ☂️.',
    )
  })

  it('falls back to a greeting for an unknown code', () => {
    expect(renderWeather({ code: 42, high: 25, low: 21, rainChance: 0 })).toBe(
      '👋 Hello from Taipei!',
    )
  })
})
