import { GITHUB_API_URL, PROFILE_TIME_ZONE } from './config.ts'

/** shields.io reads `-` and `_` as separators, so literal ones must be doubled. */
function encodeBadgeText(text: string): string {
  return encodeURIComponent(text.replace(/-/g, '--').replace(/_/g, '__'))
}

export function formatNumber(value: number): string {
  return value.toLocaleString('en-US')
}

/** Non-breaking spaces keep a date on one line inside a narrow table column. */
export function formatDate(isoDate: string): string {
  return new Date(isoDate)
    .toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      timeZone: PROFILE_TIME_ZONE,
      year: 'numeric',
    })
    .replace(/ /g, '&nbsp;')
}

/** Date, time, and UTC offset of the profile's home time zone. */
export function formatTimestamp(date: Date): string {
  return date.toLocaleString('en-US', {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    timeZone: PROFILE_TIME_ZONE,
    timeZoneName: 'shortOffset',
    year: 'numeric',
  })
}

export function shieldsBadge({
  color,
  label,
  value,
}: {
  color: string
  label: string
  value: string
}): string {
  return `https://img.shields.io/badge/${encodeBadgeText(label)}-${encodeBadgeText(value)}-${color}?style=for-the-badge&labelColor=1f2328`
}

/** `owner/name` for the API repository URL a search result carries. */
export function repoFullName(repositoryUrl: string): string {
  return repositoryUrl.replace(`${GITHUB_API_URL}/repos/`, '')
}

/** Wraps HTML lines in a centered paragraph, the only way to center on GitHub. */
export function centered(lines: string[]): string {
  return ['<p align="center">', ...lines, '</p>'].join('\n')
}

/**
 * Trims prose to `limit` characters at a word boundary. A 140-character
 * description otherwise takes so much table width that the neighbouring
 * columns wrap their own single words.
 */
export function truncate(text: string, limit: number): string {
  if (text.length <= limit) {
    return text
  }

  const cut = text.slice(0, limit)
  const lastSpace = cut.lastIndexOf(' ')

  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).replace(/[,.;:]$/, '')}…`
}

/** Keeps `[`/`]` from closing a markdown link label early. */
export function escapeLinkText(text: string): string {
  return text.replace(/([[\]])/g, '\\$1')
}

/**
 * Makes API text safe inside a table cell, where an unescaped `|` starts a new
 * cell. Only for tables: in a list the escape is unnecessary, and inside a code
 * span markdown prints the backslash instead of consuming it.
 */
export function escapeTableCell(text: string): string {
  return escapeLinkText(text).replace(/\|/g, '\\|')
}

export function markdownTable(headers: string[], rows: string[]): string {
  return [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows,
  ].join('\n')
}
