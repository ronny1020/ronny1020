import { DAY_MS } from './config.ts'

const SYNODIC_MONTH_DAYS = 29.530588853
const REFERENCE_NEW_MOON_MS = Date.UTC(2000, 0, 6, 18, 14)

type MoonPhase = { emoji: string; name: string }

const PHASES: MoonPhase[] = [
  { emoji: '🌑', name: 'new moon' },
  { emoji: '🌒', name: 'waxing crescent' },
  { emoji: '🌓', name: 'first quarter' },
  { emoji: '🌔', name: 'waxing gibbous' },
  { emoji: '🌕', name: 'full moon' },
  { emoji: '🌖', name: 'waning gibbous' },
  { emoji: '🌗', name: 'last quarter' },
  { emoji: '🌘', name: 'waning crescent' },
]

/**
 * The moon's phase at an instant, from the mean synodic month. That runs up to
 * about a day from the true phase, which moves where one phase hands over to
 * the next, but on the day of a quarter, full or new moon it still names it.
 */
export function moonPhase(date: Date): MoonPhase {
  const age =
    (date.getTime() - REFERENCE_NEW_MOON_MS) / DAY_MS / SYNODIC_MONTH_DAYS
  const fraction = age - Math.floor(age)

  return (
    PHASES[Math.round(fraction * PHASES.length) % PHASES.length] ?? PHASES[0]
  )
}
