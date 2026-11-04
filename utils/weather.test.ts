import { afterEach, describe, expect, it, jest, mock } from 'bun:test'

import { OPEN_METEO_AIR_QUALITY_URL } from './config.ts'

const fetchWeatherApi = jest.fn()

void mock.module('openmeteo', () => ({ fetchWeatherApi }))

const { fetchForecast } = await import('./weather.ts')

const SUNRISE = 1_793_829_660
const SUNSET = 1_793_870_100

/** A client response: daily values in request order, then the hourly AQI. */
function clientResponse({
  daily = [],
  hourlyAqi = [],
}: {
  daily?: number[]
  hourlyAqi?: number[]
}) {
  const variables = (values: number[]) => (index: number) => ({
    valuesArray: () => new Float32Array([values[index] ?? Number.NaN]),
    valuesInt64: () => BigInt(values[index] ?? 0),
  })

  return [
    {
      daily: () => ({ variables: variables(daily) }),
      hourly: () => ({
        variables: () => ({ valuesArray: () => new Float32Array(hourlyAqi) }),
      }),
    },
  ]
}

function respond({
  aqi = clientResponse({ hourlyAqi: [12, 48.6, 30] }),
  daily,
}: {
  aqi?: unknown
  daily: unknown
}) {
  fetchWeatherApi.mockImplementation((url: string) =>
    url === OPEN_METEO_AIR_QUALITY_URL
      ? aqi instanceof Error
        ? Promise.reject(aqi)
        : Promise.resolve(aqi)
      : daily instanceof Error
        ? Promise.reject(daily)
        : Promise.resolve(daily),
  )
}

afterEach(() => {
  fetchWeatherApi.mockReset()
})

describe('fetchForecast', () => {
  it("reads today's sky, temperatures, sun times and worst air", async () => {
    respond({
      daily: clientResponse({ daily: [61, 30.5, 20.25, 40, SUNRISE, SUNSET] }),
    })

    expect(await fetchForecast()).toEqual({
      code: 61,
      high: 30.5,
      low: 20.25,
      peakAqi: 49,
      rainChance: 40,
      sunrise: new Date(SUNRISE * 1000),
      sunset: new Date(SUNSET * 1000),
    })
  })

  it('keeps the forecast when the air-quality call fails', async () => {
    respond({
      aqi: new Error('Bad Gateway'),
      daily: clientResponse({ daily: [0, 30, 20, 0, SUNRISE, SUNSET] }),
    })

    expect((await fetchForecast())?.peakAqi).toBeNull()
  })

  it('treats a missing rain chance as none', async () => {
    respond({ daily: clientResponse({ daily: [0, 30, 20, Number.NaN] }) })

    expect((await fetchForecast())?.rainChance).toBe(0)
  })

  it('returns null when a temperature is missing', async () => {
    respond({ daily: clientResponse({ daily: [0, Number.NaN, 20, 0] }) })

    expect(await fetchForecast()).toBeNull()
  })

  it('returns null when the client throws', async () => {
    respond({ daily: new Error('Bad Gateway') })

    expect(await fetchForecast()).toBeNull()
  })
})
