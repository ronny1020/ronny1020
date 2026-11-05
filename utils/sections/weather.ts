import { formatClock } from '../format.ts'
import { findSky } from '../sky.ts'
import type { Forecast } from '../types.ts'

/** Below this, mentioning rain is noise. */
const RAIN_WORTH_MENTIONING = 30

/** A daily greeting whose icon changes with the Taipei sky. */
export function renderWeather(forecast: Forecast | null): string {
  const sky = findSky(forecast?.code)

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

/** Sunrise, sunset and the day's worst air, on the line under the greeting. */
export function renderWeatherFacts(forecast: Forecast | null): string {
  const peakAqi = forecast?.peakAqi
  const band =
    peakAqi == null ? undefined : AQI_BANDS.find(({ upTo }) => peakAqi <= upTo)
  const facts = [
    ...(forecast?.sunrise ? [`🌅 ${formatClock(forecast.sunrise)}`] : []),
    ...(forecast?.sunset ? [`🌇 ${formatClock(forecast.sunset)}`] : []),
    ...(band ? [`${band.icon} peak US AQI ${peakAqi}, ${band.label}`] : []),
  ]

  return facts.join(' · ')
}
