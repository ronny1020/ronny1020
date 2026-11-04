import { describe, expect, it } from 'bun:test'

import {
  LIVE_BADGE_THEMES,
  renderLiveBadge,
  renderLiveBadges,
} from './liveBadge.ts'

describe('renderLiveBadge', () => {
  it('widens the pill with the label so a longer date still fits', () => {
    const width = (label: string) =>
      Number(
        /width="(\d+)"/.exec(
          renderLiveBadge({ label, theme: LIVE_BADGE_THEMES.light }),
        )?.[1],
      )

    expect(
      width('rebuilt daily · Dec 25, 2026, 12:52 PM GMT+8'),
    ).toBeGreaterThan(width('rebuilt daily · Nov 4, 2026, 2:52 PM GMT+8'))
  })

  it('escapes the label as XML text', () => {
    expect(
      renderLiveBadge({ label: 'a < b & c', theme: LIVE_BADGE_THEMES.dark }),
    ).toContain('>a &lt; b &amp; c</text>')
  })

  it('stops animating for viewers who prefer reduced motion', () => {
    expect(
      renderLiveBadge({ label: 'x', theme: LIVE_BADGE_THEMES.light }),
    ).toContain('@media (prefers-reduced-motion: reduce)')
  })

  it('names the files the README links', () => {
    expect(Object.keys(renderLiveBadges(new Date())).sort()).toEqual([
      'dark.svg',
      'light.svg',
    ])
  })
})
