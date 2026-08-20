import { describe, expect, it } from 'bun:test'

import {
  centered,
  escapeTableCell,
  formatDate,
  formatNumber,
  formatTimestamp,
  markdownTable,
  repoFullName,
  shieldsBadge,
} from './format.ts'

describe('formatNumber', () => {
  it('groups thousands', () => {
    expect(formatNumber(233120)).toBe('233,120')
  })
})

describe('formatDate', () => {
  it('formats in the profile time zone', () => {
    expect(formatDate('2026-08-17T07:04:55Z')).toBe('Aug&nbsp;17,&nbsp;2026')
  })

  it('rolls over to the next day for late UTC timestamps', () => {
    expect(formatDate('2026-08-17T20:00:00Z')).toBe('Aug&nbsp;18,&nbsp;2026')
  })
})

describe('shieldsBadge', () => {
  it('escapes spaces and dashes so shields keeps them literal', () => {
    expect(
      shieldsBadge({
        color: 'f78166',
        label: 'On GitHub since',
        value: '2019',
      }),
    ).toBe(
      'https://img.shields.io/badge/On%20GitHub%20since-2019-f78166?style=for-the-badge&labelColor=1f2328',
    )
  })

  it('doubles dashes inside a value', () => {
    expect(
      shieldsBadge({ color: 'fff', label: 'Range', value: 'a-b' }),
    ).toContain('Range-a--b-fff')
  })
})

describe('centered', () => {
  it('wraps lines in a centered paragraph', () => {
    expect(centered(['  <img>'])).toBe('<p align="center">\n  <img>\n</p>')
  })
})

describe('markdownTable', () => {
  it('emits a separator row matching the header width', () => {
    expect(markdownTable(['A', 'B'], ['| 1 | 2 |'])).toBe(
      '| A | B |\n| --- | --- |\n| 1 | 2 |',
    )
  })
})

describe('escapeTableCell', () => {
  it('escapes pipes so a cell cannot split its row', () => {
    expect(escapeTableCell('allow `a | b` unions')).toBe(
      'allow `a \\| b` unions',
    )
  })

  it('escapes brackets so a link label cannot close early', () => {
    expect(escapeTableCell('[RFC] parse a|b')).toBe('\\[RFC\\] parse a\\|b')
  })
})

describe('formatTimestamp', () => {
  // The date/time separator is ICU-version dependent, so assert the parts.
  it('states the profile time zone offset instead of hardcoding it', () => {
    const timestamp = formatTimestamp(new Date('2026-08-20T03:42:00Z'))

    expect(timestamp).toContain('Aug 20, 2026')
    expect(timestamp).toContain('11:42 AM')
    expect(timestamp).toEndWith('GMT+8')
  })
})

describe('repoFullName', () => {
  it('strips the API prefix', () => {
    expect(repoFullName('https://api.github.com/repos/TanStack/query')).toBe(
      'TanStack/query',
    )
  })
})
