import { fetchWeatherApi } from 'openmeteo'

import {
  KEELUNG_COAST,
  OPEN_METEO_AIR_QUALITY_URL,
  OPEN_METEO_MARINE_URL,
  OPEN_METEO_URL,
  PROFILE_TIME_ZONE,
  REQUEST_TIMEOUT_MS,
  TAIPEI,
} from './config.ts'
import type { Forecast, SeaState } from './types.ts'

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
  'daylight_duration',
] as const

type DailyVariable = (typeof DAILY_VARIABLES)[number]

/** Daily series start a day early, so yesterday's daylight is there to compare. */
const YESTERDAY = 0
const TODAY = 1

/**
 * Today's Taipei forecast, or null when Open-Meteo is unreachable or
 * incomplete. Air quality and the sea are optional: without them the rest
 * stands.
 */
export async function fetchForecast(): Promise<Forecast | null> {
  const [daily, peakAqi, sea] = await Promise.all([
    fetchDaily(),
    fetchPeakAqi(),
    fetchSea(),
  ])

  return daily && { ...daily, peakAqi, sea }
}

async function fetchDaily(): Promise<Omit<Forecast, 'peakAqi' | 'sea'> | null> {
  try {
    const [response] = await fetchDays({
      url: OPEN_METEO_URL,
      variables: { daily: DAILY_VARIABLES.join(','), past_days: 1 },
    })
    const daily = response?.daily()
    const code = reading(daily, 'weather_code')
    const high = reading(daily, 'temperature_2m_max')
    const low = reading(daily, 'temperature_2m_min')
    const rainChance = reading(daily, 'precipitation_probability_max')
    const daylight = reading(daily, 'daylight_duration')
    const daylightYesterday = reading(daily, 'daylight_duration', YESTERDAY)

    if (code == null || high == null || low == null) {
      return null
    }

    return {
      code,
      daylight,
      daylightChange:
        daylight == null || daylightYesterday == null
          ? null
          : daylight - daylightYesterday,
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
    const [response] = await fetchDays({
      url: OPEN_METEO_AIR_QUALITY_URL,
      variables: { hourly: 'us_aqi' },
    })
    const hours = [...(response?.hourly()?.variables(0)?.valuesArray() ?? [])]
    const known = hours.filter(Number.isFinite)

    return known.length > 0 ? Math.round(Math.max(...known)) : null
  } catch {
    return null
  }
}

/**
 * The sea off Taipei's north coast: today's average water and highest waves.
 * Both models are pinned to MeteoFrance's, the ones the Copernicus Marine
 * credit covers; the API answers with one response per model, in that order.
 */
async function fetchSea(): Promise<SeaState | null> {
  try {
    const [waves, currents] = await fetchDays({
      place: KEELUNG_COAST,
      url: OPEN_METEO_MARINE_URL,
      variables: {
        daily: 'wave_height_max',
        hourly: 'sea_surface_temperature',
        models: 'meteofrance_wave,meteofrance_currents',
      },
    })
    const hours = [
      ...(currents?.hourly()?.variables(0)?.valuesArray() ?? []),
    ].filter(Number.isFinite)
    const waveHeight = waves?.daily()?.variables(0)?.valuesArray()?.[0]

    if (hours.length === 0) {
      return null
    }

    return {
      temperature: hours.reduce((sum, value) => sum + value, 0) / hours.length,
      waveHeight:
        waveHeight !== undefined && Number.isFinite(waveHeight)
          ? waveHeight
          : null,
    }
  } catch {
    return null
  }
}

/** Today's data from an Open-Meteo endpoint, plus any `past_days`, in Taipei's time zone. */
function fetchDays({
  place = TAIPEI,
  url,
  variables,
}: {
  place?: { latitude: number; longitude: number }
  url: string
  variables: Record<string, string | number>
}) {
  return fetchWeatherApi(
    url,
    {
      ...variables,
      forecast_days: 1,
      latitude: place.latitude,
      longitude: place.longitude,
      timezone: PROFILE_TIME_ZONE,
    },
    undefined,
    undefined,
    undefined,
    { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) },
  )
}

/** One day's value of a daily variable; the client marks a missing one as NaN. */
function reading(
  daily: Daily | undefined,
  name: DailyVariable,
  day = TODAY,
): number | null {
  const value = daily
    ?.variables(DAILY_VARIABLES.indexOf(name))
    ?.valuesArray()?.[day]

  return value !== undefined && Number.isFinite(value) ? value : null
}

/** Sunrise and sunset arrive as Unix seconds in the client's int64 column. */
function timeReading(
  daily: Daily | undefined,
  name: DailyVariable,
): Date | null {
  const seconds = daily
    ?.variables(DAILY_VARIABLES.indexOf(name))
    ?.valuesInt64(TODAY)

  return seconds ? new Date(Number(seconds) * 1000) : null
}
