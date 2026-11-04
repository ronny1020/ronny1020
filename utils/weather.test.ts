import { afterEach, describe, expect, it, jest, mock } from 'bun:test'

const fetchWeatherApi = jest.fn()

void mock.module('openmeteo', () => ({ fetchWeatherApi }))

const { fetchForecast } = await import('./weather.ts')

/** A client response whose daily variables hold one value each, in request order. */
function dailyResponse(values: number[]) {
  return [
    {
      daily: () => ({
        variables: (index: number) => ({
          valuesArray: () => new Float32Array([values[index] ?? Number.NaN]),
        }),
      }),
    },
  ]
}

afterEach(() => {
  fetchWeatherApi.mockReset()
})

describe('fetchForecast', () => {
  it("reads today's code, temperatures and rain chance", async () => {
    fetchWeatherApi.mockResolvedValue(dailyResponse([61, 30.5, 20.25, 40]))

    expect(await fetchForecast()).toEqual({
      code: 61,
      high: 30.5,
      low: 20.25,
      rainChance: 40,
    })
  })

  it('treats a missing rain chance as none', async () => {
    fetchWeatherApi.mockResolvedValue(dailyResponse([0, 30, 20, Number.NaN]))

    expect((await fetchForecast())?.rainChance).toBe(0)
  })

  it('returns null when a temperature is missing', async () => {
    fetchWeatherApi.mockResolvedValue(dailyResponse([0, Number.NaN, 20, 0]))

    expect(await fetchForecast()).toBeNull()
  })

  it('returns null when the client throws', async () => {
    fetchWeatherApi.mockRejectedValue(new Error('Bad Gateway'))

    expect(await fetchForecast()).toBeNull()
  })
})
