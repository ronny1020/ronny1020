import { afterEach, describe, expect, it, jest, mock } from 'bun:test'

import { OPEN_METEO_AIR_QUALITY_URL, OPEN_METEO_MARINE_URL } from './config.ts'

const fetchWeatherApi = jest.fn()

void mock.module('openmeteo', () => ({ fetchWeatherApi }))

const { fetchForecast } = await import('./weather.ts')

const SUNRISE = 1_793_829_660
const SUNSET = 1_793_870_100

/** A client response: each daily variable's values by day, in request order. */
function clientResponse({
  daily = [],
  hourly = [],
}: {
  daily?: number[][]
  hourly?: number[]
}) {
  const variables = (index: number) => ({
    valuesArray: () => new Float32Array(daily[index] ?? []),
    valuesInt64: (day: number) => BigInt(daily[index]?.[day] ?? 0),
  })

  return [
    {
      daily: () => ({ variables }),
      hourly: () => ({
        variables: () => ({ valuesArray: () => new Float32Array(hourly) }),
      }),
    },
  ]
}

/** The forecast asks for yesterday too, so each variable is [yesterday, today]. */
function forecastDays(today: number[], yesterday: number[] = []): number[][] {
  return today.map((value, index) => [yesterday[index] ?? Number.NaN, value])
}

/** Today's values for every daily variable the forecast asks for. */
const TODAY = [61, 30.5, 20.25, 40, SUNRISE, SUNSET, 40_048]

function respond({
  aqi = clientResponse({ hourly: [12, 48.6, 30] }),
  daily,
  sea = [
    ...clientResponse({}),
    ...clientResponse({ hourly: [25, 27, Number.NaN] }),
  ],
}: {
  aqi?: unknown
  daily: unknown
  sea?: unknown
}) {
  const settle = (value: unknown) =>
    value instanceof Error ? Promise.reject(value) : Promise.resolve(value)

  fetchWeatherApi.mockImplementation((url: string) =>
    settle(
      url === OPEN_METEO_AIR_QUALITY_URL
        ? aqi
        : url === OPEN_METEO_MARINE_URL
          ? sea
          : daily,
    ),
  )
}

afterEach(() => {
  fetchWeatherApi.mockReset()
})

describe('fetchForecast', () => {
  it("reads today's sky, sun, daylight, worst air and the sea", async () => {
    respond({
      daily: clientResponse({
        daily: forecastDays(TODAY, [0, 0, 0, 0, 0, 0, 40_122]),
      }),
    })

    expect(await fetchForecast()).toEqual({
      code: 61,
      daylight: 40_048,
      daylightChange: -74,
      high: 30.5,
      low: 20.25,
      peakAqi: 49,
      rainChance: 40,
      sea: { temperature: 26, waveHeight: null },
      sunrise: new Date(SUNRISE * 1000),
      sunset: new Date(SUNSET * 1000),
    })
  })

  it('reads the highest waves when the sea reports them', async () => {
    respond({
      daily: clientResponse({ daily: forecastDays(TODAY) }),
      sea: [
        ...clientResponse({ daily: [[1.5]] }),
        ...clientResponse({ hourly: [26] }),
      ],
    })

    expect((await fetchForecast())?.sea?.waveHeight).toBe(1.5)
  })

  it("asks for MeteoFrance's wave and currents models, in that order", async () => {
    respond({ daily: clientResponse({ daily: forecastDays(TODAY) }) })

    await fetchForecast()

    expect(fetchWeatherApi).toHaveBeenCalledWith(
      OPEN_METEO_MARINE_URL,
      expect.objectContaining({
        models: 'meteofrance_wave,meteofrance_currents',
      }),
      undefined,
      undefined,
      undefined,
      expect.anything(),
    )
  })

  it('keeps the forecast when air quality and the sea fail', async () => {
    respond({
      aqi: new Error('Bad Gateway'),
      daily: clientResponse({ daily: forecastDays(TODAY) }),
      sea: new Error('Bad Gateway'),
    })

    const forecast = await fetchForecast()

    expect(forecast?.peakAqi).toBeNull()
    expect(forecast?.sea).toBeNull()
  })

  it("leaves the daylight change out without yesterday's length", async () => {
    respond({ daily: clientResponse({ daily: forecastDays(TODAY) }) })

    expect((await fetchForecast())?.daylightChange).toBeNull()
  })

  it('treats a missing rain chance as none', async () => {
    respond({
      daily: clientResponse({ daily: forecastDays([0, 30, 20, Number.NaN]) }),
    })

    expect((await fetchForecast())?.rainChance).toBe(0)
  })

  it('returns null when a temperature is missing', async () => {
    respond({
      daily: clientResponse({ daily: forecastDays([0, Number.NaN, 20, 0]) }),
    })

    expect(await fetchForecast()).toBeNull()
  })

  it('returns null when the client throws', async () => {
    respond({ daily: new Error('Bad Gateway') })

    expect(await fetchForecast()).toBeNull()
  })
})
