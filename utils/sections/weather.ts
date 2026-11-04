import { formatClock } from '../format.ts'
import type { Forecast } from '../types.ts'

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

/** Sunrise, sunset and the day's worst air, on the small line under the greeting. */
export function renderWeatherFacts(forecast: Forecast | null): string {
  const peakAqi = forecast?.peakAqi
  const band =
    peakAqi == null ? undefined : AQI_BANDS.find(({ upTo }) => peakAqi <= upTo)
  const facts = [
    ...(forecast?.sunrise ? [`🌅 ${formatClock(forecast.sunrise)}`] : []),
    ...(forecast?.sunset ? [`🌇 ${formatClock(forecast.sunset)}`] : []),
    ...(band ? [`${band.icon} peak US AQI ${peakAqi}, ${band.label}`] : []),
  ]

  return facts.length > 0 ? `<sub>${facts.join(' · ')}</sub><br>` : ''
}
