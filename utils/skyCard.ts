import { PROFILE_TIME_ZONE } from './config.ts'
import { findSky, type SkyKind } from './sky.ts'
import type { Forecast } from './types.ts'

type Theme = {
  arc: string
  border: string
  cloud: string
  drop: string
  skies: Record<SkyKind, [top: string, bottom: string]>
  skyline: string
  sun: string
}

/** Sky gradients per weather, framed in GitHub Primer border colours. */
const THEMES: Record<'dark' | 'light', Theme> = {
  dark: {
    arc: 'rgba(230,237,243,0.25)',
    border: '#30363d',
    cloud: '#8b949e',
    drop: '#79c0ff',
    skies: {
      clear: ['#0b3b66', '#13233a'],
      fog: ['#343b44', '#20262d'],
      overcast: ['#2b323b', '#1b2027'],
      partly: ['#123456', '#172436'],
      rain: ['#1f2a36', '#161d26'],
      snow: ['#2a3a4b', '#1c2530'],
      storm: ['#10151c', '#0d1117'],
    },
    skyline: '#010409',
    sun: '#e3b341',
  },
  light: {
    arc: 'rgba(31,35,40,0.25)',
    border: '#d0d7de',
    cloud: '#ffffff',
    drop: '#4a6fa5',
    skies: {
      clear: ['#8ec5ff', '#e8f3ff'],
      fog: ['#d6dbe0', '#f3f5f7'],
      overcast: ['#c3ccd6', '#eef1f4'],
      partly: ['#a8cff5', '#eef5fc'],
      rain: ['#9eabb9', '#dfe5eb'],
      snow: ['#c9d6e3', '#f4f8fb'],
      storm: ['#6e7b8a', '#b9c2cc'],
    },
    skyline: '#8c959f',
    sun: '#f5b301',
  },
}

const WIDTH = 340
const HEIGHT = 110
const HORIZON = 92
/** Height of the sun at the top of its arc. */
const PEAK_Y = 30
const MINUTES_PER_DAY = 24 * 60
/** Used when the forecast has no sun times. */
const DEFAULT_SUNRISE_MINUTES = 6 * 60
const DEFAULT_SUNSET_MINUTES = 18 * 60
const PRECIPITATION_X = [128, 142, 156, 170, 184, 198, 212, 226]

type Arc = {
  centerX: number
  centerY: number
  endX: number
  radius: number
  startX: number
  /** Degrees from sunrise to the peak. */
  halfAngle: number
}

/** Kinds whose clouds hide most of the sun. */
const OVERCAST: SkyKind[] = ['fog', 'overcast', 'rain', 'snow', 'storm']

/**
 * Today's Taipei sky as an animated card: the sun climbs from sunrise to the
 * top of its arc over the skyline, under whatever the forecast brings. Reduced-motion
 * viewers get the finished frame.
 */
function renderSkyCard({
  forecast,
  theme,
}: {
  forecast: Forecast | null
  theme: Theme
}): string {
  const sky = findSky(forecast?.code)
  const kind = sky?.kind ?? 'partly'
  const [top, bottom] = theme.skies[kind]
  const label = sky
    ? `Today's sky over Taipei: ${sky.phrase}`
    : 'The sky over Taipei'
  const arc = sunArc(forecast)

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-label="${label}">
  <title>${label}</title>
  <style>
    .sun { transform-box: view-box; transform-origin: ${arc.centerX}px ${arc.centerY}px; animation: rise 2.4s ease-out both; }
    .cloud { animation: drift 9s ease-in-out infinite alternate; }
    .fall { animation: fall 0.9s linear infinite; }
    .snow { animation-duration: 2.6s; }
    .flash { animation: flash 5s steps(1) infinite; }
    @keyframes rise { from { transform: rotate(-${arc.halfAngle}deg); } }
    @keyframes drift { to { transform: translateX(10px); } }
    @keyframes fall { from { transform: translateY(-6px); opacity: 0; } 30% { opacity: 1; } to { transform: translateY(12px); opacity: 0; } }
    @keyframes flash { 0%, 100% { opacity: 0; } 90% { opacity: 1; } 93% { opacity: 0; } 95% { opacity: 1; } }
    @media (prefers-reduced-motion: reduce) { .sun, .cloud, .fall, .flash { animation: none; } }
  </style>
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${top}"/>
      <stop offset="1" stop-color="${bottom}"/>
    </linearGradient>
    <clipPath id="frame"><rect width="${WIDTH}" height="${HEIGHT}" rx="12"/></clipPath>
  </defs>
  <g clip-path="url(#frame)">
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#sky)"/>
    <path d="M${arc.startX} ${HORIZON} A${arc.radius} ${arc.radius} 0 ${arc.halfAngle > 90 ? 1 : 0} 1 ${arc.endX} ${HORIZON}" fill="none" stroke="${theme.arc}" stroke-dasharray="3 4"/>
${sky ? renderSun({ centerX: arc.centerX, dimmed: OVERCAST.includes(kind), theme }) : ''}
${renderSkyWeather({ kind: sky?.kind, theme })}
${renderSkyline(theme.skyline)}
  </g>
  <rect x="0.5" y="0.5" width="${WIDTH - 1}" height="${HEIGHT - 1}" rx="11.5" fill="none" stroke="${theme.border}"/>
</svg>
`
}

/** One SVG per colour scheme, keyed by the file name the README's `<picture>` links. */
export function renderSkyCards(
  forecast: Forecast | null,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(THEMES).map(([name, theme]) => [
      `sky-${name}.svg`,
      renderSkyCard({ forecast, theme }),
    ]),
  )
}

/**
 * The circle through sunrise and sunset on the horizon and the peak above
 * their midpoint. Both times sit on a 24-hour axis across the card, so a long
 * summer day draws a wider arc than a winter one.
 */
export function sunArc(forecast: Forecast | null): Arc {
  const startX = dayPosition(forecast?.sunrise, DEFAULT_SUNRISE_MINUTES)
  const endX = dayPosition(forecast?.sunset, DEFAULT_SUNSET_MINUTES)
  const halfChord = (endX - startX) / 2
  const rise = HORIZON - PEAK_Y
  const radius = (halfChord ** 2 + rise ** 2) / (2 * rise)
  const centerY = PEAK_Y + radius

  return {
    centerX: round(startX + halfChord),
    centerY: round(centerY),
    endX,
    radius: round(radius),
    startX,
    halfAngle: round(
      (Math.atan2(halfChord, centerY - HORIZON) * 180) / Math.PI,
    ),
  }
}

/** Horizontal position of a time of day in Taipei, midnight to midnight. */
function dayPosition(time: Date | null | undefined, fallback: number): number {
  return round(
    ((time ? minutesIntoDay(time) : fallback) / MINUTES_PER_DAY) * WIDTH,
  )
}

/** Minutes past midnight in Taipei; `en-GB` gives a 24-hour `HH:MM`. */
function minutesIntoDay(date: Date): number {
  const [hour = 0, minute = 0] = date
    .toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: PROFILE_TIME_ZONE,
    })
    .split(':')
    .map(Number)

  return hour * 60 + minute
}

function round(value: number): number {
  return Math.round(value * 100) / 100
}

function renderSun({
  centerX,
  dimmed,
  theme,
}: {
  centerX: number
  dimmed: boolean
  theme: Theme
}): string {
  return `    <g class="sun" opacity="${dimmed ? 0.45 : 1}">
      <circle cx="${centerX}" cy="${PEAK_Y}" r="16" fill="${theme.sun}" opacity="0.25"/>
      <circle cx="${centerX}" cy="${PEAK_Y}" r="10" fill="${theme.sun}"/>
    </g>`
}

function renderSkyWeather({
  kind,
  theme,
}: {
  kind: SkyKind | undefined
  theme: Theme
}): string {
  switch (kind) {
    case 'partly':
      return cloud({ color: theme.cloud, scale: 0.8, x: 196, y: 34 })
    case 'overcast':
      return [
        cloud({ color: theme.cloud, scale: 1, x: 140, y: 26 }),
        cloud({ color: theme.cloud, scale: 0.85, x: 200, y: 40 }),
      ].join('\n')
    case 'fog':
      return [30, 48, 66]
        .map(
          (y, index) =>
            `    <rect class="cloud" x="${20 + index * 24}" y="${y}" width="250" height="7" rx="3.5" fill="${theme.cloud}" opacity="0.55"/>`,
        )
        .join('\n')
    case 'rain':
    case 'storm':
    case 'snow':
      return [
        cloud({ color: theme.cloud, scale: 1, x: 140, y: 22 }),
        cloud({ color: theme.cloud, scale: 0.85, x: 200, y: 32 }),
        renderPrecipitation({ kind, theme }),
        kind === 'storm'
          ? `    <path class="flash" d="M196 46 l-9 16 h7 l-5 14 l14 -19 h-7 l6 -11 z" fill="${theme.sun}"/>`
          : '',
      ].join('\n')
    default:
      return ''
  }
}

/** Drops (or flakes) staggered under the clouds so they never fall in step. */
function renderPrecipitation({
  kind,
  theme,
}: {
  kind: SkyKind
  theme: Theme
}): string {
  return PRECIPITATION_X.map((x, index) => {
    const y = 50 + (index % 3) * 8
    const delay = `style="animation-delay: -${(index * 0.37).toFixed(2)}s"`

    return kind === 'snow'
      ? `    <circle class="fall snow" ${delay} cx="${x}" cy="${y}" r="1.8" fill="${theme.drop}"/>`
      : `    <line class="fall" ${delay} x1="${x}" y1="${y}" x2="${x - 2}" y2="${y + 7}" stroke="${theme.drop}" stroke-width="1.5" stroke-linecap="round"/>`
  }).join('\n')
}

/** A cloud of three puffs on a flat base, drawn at the given offset. */
function cloud({
  color,
  scale,
  x,
  y,
}: {
  color: string
  scale: number
  x: number
  y: number
}): string {
  return `    <g class="cloud" fill="${color}" opacity="0.92"><g transform="translate(${x} ${y}) scale(${scale})">
      <circle cx="14" cy="16" r="10"/><circle cx="30" cy="10" r="13"/><circle cx="46" cy="16" r="10"/>
      <rect x="4" y="16" width="52" height="10" rx="5"/>
    </g></g>`
}

/** Laid edge to edge across the card. */
const BLOCKS: [width: number, height: number][] = [
  [26, 8],
  [20, 14],
  [32, 6],
  [18, 11],
  [28, 5],
  [22, 12],
  [36, 7],
  [16, 15],
  [24, 9],
  [30, 6],
  [20, 13],
  [26, 8],
  [22, 16],
  [20, 10],
]

/** Low blocks and one stepped tower, sitting on the horizon. */
function renderSkyline(color: string): string {
  let x = 0
  const buildings = BLOCKS.map(([width, height]) => {
    const rect = `<rect x="${x}" y="${HORIZON - height}" width="${width}" height="${height + HEIGHT - HORIZON}"/>`

    x += width

    return rect
  }).join('')
  const tower = [0, 1, 2, 3, 4, 5]
    .map(
      (step) => `<path d="M239 ${HORIZON - 12 - step * 8} h10 l1 8 h-12 z"/>`,
    )
    .join('')

  return `    <g fill="${color}">${buildings}<rect x="237" y="${HORIZON - 12}" width="16" height="${12 + HEIGHT - HORIZON}"/>${tower}<rect x="243.5" y="${HORIZON - 62}" width="3" height="10"/><rect x="244.5" y="${HORIZON - 70}" width="1" height="8"/></g>`
}
