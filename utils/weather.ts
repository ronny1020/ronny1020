import { fetchWeatherApi } from 'openmeteo'

import {
  OPEN_METEO_AIR_QUALITY_URL,
  OPEN_METEO_URL,
  PROFILE_TIME_ZONE,
  REQUEST_TIMEOUT_MS,
  TAIPEI,
} from './config.ts'
import type { Forecast } from './types.ts'

type Daily = ReturnType<
  Awaited<ReturnType<typeof fetchWeatherApi>>[number]['daily']
>

/** The client returns variables by position, so this order is the contract. */
const DAILY_VARIABLES = [
  'weather_code',
  'temperature_2m_max',
  'temperature_2m_min',
  'precipitation_probability_max',
  'sunrise',
  'sunset',
] as const

type DailyVariable = (typeof DAILY_VARIABLES)[number]

/**
 * Today's Taipei forecast, or null when Open-Meteo is unreachable or
 * incomplete. The air-quality reading is optional: without it the rest stands.
 */
export async function fetchForecast(): Promise<Forecast | null> {
  const [daily, peakAqi] = await Promise.all([fetchDaily(), fetchPeakAqi()])

  return daily && { ...daily, peakAqi }
}

async function fetchDaily(): Promise<Omit<Forecast, 'peakAqi'> | null> {
  try {
    const [response] = await fetchToday(OPEN_METEO_URL, {
      daily: DAILY_VARIABLES.join(','),
    })
    const daily = response?.daily()
    const code = reading(daily, 'weather_code')
    const high = reading(daily, 'temperature_2m_max')
    const low = reading(daily, 'temperature_2m_min')
    const rainChance = reading(daily, 'precipitation_probability_max')

    if (code == null || high == null || low == null) {
      return null
    }

    return {
      code,
      high,
      low,
      rainChance: Math.round(rainChance ?? 0),
      sunrise: timeReading(daily, 'sunrise'),
      sunset: timeReading(daily, 'sunset'),
    }
  } catch {
    return null
  }
}

/** The air-quality API is hourly only; the day's worst hour is what to plan for. */
async function fetchPeakAqi(): Promise<number | null> {
  try {
    const [response] = await fetchToday(OPEN_METEO_AIR_QUALITY_URL, {
      hourly: 'us_aqi',
    })
    const hours = [...(response?.hourly()?.variables(0)?.valuesArray() ?? [])]
    const known = hours.filter(Number.isFinite)

    return known.length > 0 ? Math.round(Math.max(...known)) : null
  } catch {
    return null
  }
}

/** One day of Taipei data from an Open-Meteo endpoint, in Taipei's time zone. */
function fetchToday(url: string, variables: Record<string, string>) {
  return fetchWeatherApi(
    url,
    {
      ...variables,
      forecast_days: 1,
      latitude: TAIPEI.latitude,
      longitude: TAIPEI.longitude,
      timezone: PROFILE_TIME_ZONE,
    },
    undefined,
    undefined,
    undefined,
    { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) },
  )
}

/** The first value of a daily variable; the client marks a missing one as NaN. */
function reading(daily: Daily | undefined, name: DailyVariable): number | null {
  const value = daily
    ?.variables(DAILY_VARIABLES.indexOf(name))
    ?.valuesArray()?.[0]

  return value !== undefined && Number.isFinite(value) ? value : null
}

/** Sunrise and sunset arrive as Unix seconds in the client's int64 column. */
function timeReading(
  daily: Daily | undefined,
  name: DailyVariable,
): Date | null {
  const seconds = daily
    ?.variables(DAILY_VARIABLES.indexOf(name))
    ?.valuesInt64(0)

  return seconds ? new Date(Number(seconds) * 1000) : null
}
