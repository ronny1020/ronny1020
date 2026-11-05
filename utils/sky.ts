export type SkyKind =
  'clear' | 'fog' | 'overcast' | 'partly' | 'rain' | 'snow' | 'storm'

type Sky = { codes: number[]; icon: string; kind: SkyKind; phrase: string }

/** WMO weather codes, grouped into what a visitor would say about the sky. */
const SKIES: Sky[] = [
  { codes: [0], icon: '☀️', kind: 'clear', phrase: 'a lovely clear day' },
  { codes: [1], icon: '🌤️', kind: 'partly', phrase: 'mostly sunny' },
  { codes: [2], icon: '⛅', kind: 'partly', phrase: 'partly cloudy' },
  { codes: [3], icon: '☁️', kind: 'overcast', phrase: 'grey and overcast' },
  { codes: [45, 48], icon: '🌫️', kind: 'fog', phrase: 'foggy' },
  {
    codes: [51, 53, 55, 56, 57],
    icon: '🌦️',
    kind: 'rain',
    phrase: 'drizzly',
  },
  {
    codes: [61, 63, 65, 66, 67, 80, 81, 82],
    icon: '🌧️',
    kind: 'rain',
    phrase: 'rainy',
  },
  {
    codes: [71, 73, 75, 77, 85, 86],
    icon: '🌨️',
    kind: 'snow',
    phrase: 'snowing, somehow',
  },
  { codes: [95, 96, 97, 99], icon: '⛈️', kind: 'storm', phrase: 'stormy' },
]

export function findSky(code: number | undefined): Sky | undefined {
  return SKIES.find(({ codes }) => codes.includes(code ?? -1))
}
