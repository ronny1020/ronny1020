import { fetchWeatherApi } from 'openmeteo'

import {
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
] as const

/** Today's Taipei forecast, or null when Open-Meteo is unreachable or incomplete. */
export async function fetchForecast(): Promise<Forecast | null> {
  try {
    const [response] = await fetchWeatherApi(
      OPEN_METEO_URL,
      {
        daily: DAILY_VARIABLES.join(','),
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
    const daily = response?.daily()
    const [code, high, low, rainChance] = DAILY_VARIABLES.map((_, index) =>
      reading(daily, index),
    )

    if (code == null || high == null || low == null) {
      return null
    }

    return { code, high, low, rainChance: Math.round(rainChance ?? 0) }
  } catch {
    return null
  }
}

/** The first value of a daily variable; the client marks a missing one as NaN. */
function reading(daily: Daily | undefined, index: number): number | null {
  const value = daily?.variables(index)?.valuesArray()?.[0]

  return value !== undefined && Number.isFinite(value) ? value : null
}
