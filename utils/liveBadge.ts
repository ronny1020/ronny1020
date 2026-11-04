import { formatTimestamp } from './format.ts'

/** GitHub Primer colours, so the badge matches the page it sits on. */
export const LIVE_BADGE_THEMES = {
  dark: {
    border: '#30363d',
    fill: '#161b22',
    live: '#3fb950',
    text: '#e6edf3',
  },
  light: {
    border: '#d0d7de',
    fill: '#f6f8fa',
    live: '#1a7f37',
    text: '#1f2328',
  },
} as const

type LiveBadgeTheme = (typeof LIVE_BADGE_THEMES)[keyof typeof LIVE_BADGE_THEMES]

const HEIGHT = 24
const LABEL_X = 58
/**
 * Glyph advance of an 11px system sans-serif (5.05px measured in Chrome),
 * with slack for wider fonts. `textLength` pins the text to this width by
 * adjusting letter spacing, so the pill fits whichever font the viewer has.
 */
const CHAR_WIDTH = 5.4
const END_PADDING = 12
const FONT = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif`

/**
 * A status pill whose green dot pulses like an on-air light and whose label
 * fades in once. Animation lives in the SVG because GitHub strips CSS from a
 * README; viewers who ask for reduced motion get a still badge.
 */
export function renderLiveBadge({
  label,
  theme,
}: {
  label: string
  theme: LiveBadgeTheme
}): string {
  const text = label
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
  const labelWidth = Math.ceil(label.length * CHAR_WIDTH)
  const width = LABEL_X + labelWidth + END_PADDING

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${HEIGHT}" viewBox="0 0 ${width} ${HEIGHT}" role="img" aria-label="Live: ${text}">
  <title>Live: ${text}</title>
  <style>
    .ring { transform-box: fill-box; transform-origin: center; animation: pulse 2s ease-out infinite; }
    .label { animation: fade-in 0.8s ease-out both; }
    @keyframes pulse { from { transform: scale(1); opacity: 0.6; } to { transform: scale(2.6); opacity: 0; } }
    @keyframes fade-in { from { opacity: 0; } }
    @media (prefers-reduced-motion: reduce) { .ring, .label { animation: none; } .ring { opacity: 0; } }
  </style>
  <rect x="0.5" y="0.5" width="${width - 1}" height="${HEIGHT - 1}" rx="${(HEIGHT - 1) / 2}" fill="${theme.fill}" stroke="${theme.border}"/>
  <circle class="ring" cx="14" cy="12" r="4" fill="${theme.live}"/>
  <circle class="dot" cx="14" cy="12" r="4" fill="${theme.live}"/>
  <g font-family="${FONT}" font-size="11">
    <text x="24" y="16" font-weight="600" fill="${theme.live}">LIVE</text>
    <text class="label" x="${LABEL_X}" y="16" fill="${theme.text}" textLength="${labelWidth}" lengthAdjust="spacing">${text}</text>
  </g>
</svg>
`
}

/** One SVG per colour scheme, keyed by the file name the README's `<picture>` links. */
export function renderLiveBadges(generatedAt: Date): Record<string, string> {
  const label = `rebuilt daily · ${formatTimestamp(generatedAt)}`

  return Object.fromEntries(
    Object.entries(LIVE_BADGE_THEMES).map(([name, theme]) => [
      `${name}.svg`,
      renderLiveBadge({ label, theme }),
    ]),
  )
}
