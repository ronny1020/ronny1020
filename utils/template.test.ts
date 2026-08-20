import { describe, expect, it } from 'bun:test'

import { renderTemplate } from './template.ts'

describe('renderTemplate', () => {
  it('replaces a marker with its section', () => {
    expect(renderTemplate('a\n<!-- generated:foo -->\nb', { foo: 'X' })).toBe(
      'a\nX\nb',
    )
  })

  it('tolerates extra whitespace in the marker', () => {
    expect(renderTemplate('<!--generated:foo-->', { foo: 'X' })).toBe('X')
  })

  it('leaves unknown markers untouched so they are visible in review', () => {
    expect(renderTemplate('<!-- generated:missing -->', {})).toBe(
      '<!-- generated:missing -->',
    )
  })
})
