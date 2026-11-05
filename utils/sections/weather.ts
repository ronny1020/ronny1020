import { formatClock } from '../format.ts'
import { moonPhase } from '../moon.ts'
import type { Forecast, SeaState } from '../types.ts'

const TAIPEI_OFFSET_MS = 8 * 60 * 60 * 1000

/** WMO weather codes, grouped into what a visitor would say about the sky. */
const SKIES: { codes: number[]; icon: string; phrase: string }[] = [
  { codes: [0], icon: '☀️', phrase: 'a lovely clear day' },
  { codes: [1], icon: '🌤️', phrase: 'mostly sunny' },
  { codes: [2], icon: '⛅', phrase: 'partly cloudy' },
  { codes: [3], icon: '☁️', phrase: 'grey and overcast' },
  { codes: [45, 48], icon: '🌫️', phrase: 'foggy' },
  { codes: [51, 53, 55, 56, 57], icon: '🌦️', phrase: 'drizzly' },
  { codes: [61, 63, 65, 66, 67, 80, 81, 82], icon: '🌧️', phrase: 'rainy' },
  { codes: [71, 73, 75, 77, 85, 86], icon: '🌨️', phrase: 'snowing, somehow' },
  { codes: [95, 96, 97, 99], icon: '⛈️', phrase: 'stormy' },
]

/** Below this, mentioning rain is noise. */
const RAIN_WORTH_MENTIONING = 30

/** A daily greeting whose icon changes with the Taipei sky. */
export function renderWeather(forecast: Forecast | null): string {
  const sky = SKIES.find(({ codes }) => codes.includes(forecast?.code ?? -1))

  if (!forecast || !sky) {
    return '👋 Hello from Taipei!'
  }

  const temperatures = `${Math.round(forecast.low)}–${Math.round(forecast.high)}&nbsp;°C`
  const rain =
    forecast.rainChance >= RAIN_WORTH_MENTIONING
      ? `, ${forecast.rainChance}% chance of rain ☂️`
      : ''

  return `${sky.icon} Hello from Taipei — ${sky.phrase} today, ${temperatures}${rain}.`
}

/** US AQI bands, upper bounds inclusive, as Open-Meteo documents them. */
const AQI_BANDS: { icon: string; label: string; upTo: number }[] = [
  { icon: '🟢', label: 'good', upTo: 50 },
  { icon: '🟡', label: 'moderate', upTo: 100 },
  { icon: '🟠', label: 'unhealthy for sensitive groups', upTo: 150 },
  { icon: '🔴', label: 'unhealthy', upTo: 200 },
  { icon: '🟣', label: 'very unhealthy', upTo: 300 },
  { icon: '🟤', label: 'hazardous', upTo: Infinity },
]

/**
 * The lines under the greeting: the sun and the day's length, tonight's moon
 * and the sea, then the day's worst air. A line with nothing to say is dropped.
 */
export function renderWeatherFacts({
  forecast,
  now,
}: {
  forecast: Forecast | null
  now: Date
}): string {
  const peakAqi = forecast?.peakAqi
  const band =
    peakAqi == null ? undefined : AQI_BANDS.find(({ upTo }) => peakAqi <= upTo)
  const moon = moonPhase(tonight(now))
  const lines = [
    [
      ...(forecast?.sunrise ? [`🌅 ${formatClock(forecast.sunrise)}`] : []),
      ...(forecast?.sunset ? [`🌇 ${formatClock(forecast.sunset)}`] : []),
      ...(forecast?.daylight
        ? [describeDaylight(forecast.daylight, forecast.daylightChange)]
        : []),
    ],
    [
      `${moon.emoji} ${moon.name} tonight`,
      ...(forecast?.sea ? [describeSea(forecast.sea)] : []),
    ],
    band ? [`${band.icon} peak US AQI ${peakAqi}, ${band.label}`] : [],
  ]

  return lines
    .filter((facts) => facts.length > 0)
    .map((facts) => facts.join(' · '))
    .join('<br>\n')
}

/** 8 pm in Taipei on the day `now` falls on; Taipei keeps UTC+8 all year. */
function tonight(now: Date): Date {
  const taipei = new Date(now.getTime() + TAIPEI_OFFSET_MS)

  return new Date(
    Date.UTC(
      taipei.getUTCFullYear(),
      taipei.getUTCMonth(),
      taipei.getUTCDate(),
      20,
    ) - TAIPEI_OFFSET_MS,
  )
}

function describeDaylight(
  daylight: number,
  daylightChange: number | null,
): string {
  const minutes = Math.round(daylight / 60)
  const length = `${Math.floor(minutes / 60)}&nbsp;h ${minutes % 60}&nbsp;m of daylight`

  if (daylightChange == null) {
    return `☀️ ${length}`
  }

  const change = Math.round(Math.abs(daylightChange) / 60)
  const trend =
    change === 0
      ? 'about as long as yesterday'
      : `${change} ${change === 1 ? 'minute' : 'minutes'} ${daylightChange > 0 ? 'longer' : 'shorter'} than yesterday`

  return `☀️ ${length}, ${trend}`
}

/** Below this, a wave height rounds to 0.0 m. */
const MIN_REPORTED_WAVE_M = 0.05

function describeSea({ temperature, waveHeight }: SeaState): string {
  const waves =
    waveHeight == null || waveHeight < MIN_REPORTED_WAVE_M
      ? ''
      : `, waves up to ${waveHeight.toFixed(1)}&nbsp;m`

  return `🌊 the sea off Keelung is ${Math.round(temperature)}&nbsp;°C${waves}`
}
