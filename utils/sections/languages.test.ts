import { describe, expect, it } from 'bun:test'

import { buildRepo } from '../fixtures.ts'
import { renderLanguages } from './languages.ts'

describe('renderLanguages', () => {
  it('ranks languages by repository share', () => {
    const section = renderLanguages([
      buildRepo({ name: 'a', language: 'TypeScript' }),
      buildRepo({ name: 'b', language: 'TypeScript' }),
      buildRepo({ name: 'c', language: 'Vue' }),
      buildRepo({ name: 'd', language: null }),
    ])
    const rows = section.split('\n').slice(2)

    expect(rows[0]).toContain('TypeScript')
    expect(rows[0]).toContain('66.7%')
    expect(rows[1]).toContain('Vue')
    expect(rows[1]).toContain('33.3%')
  })

  it('always draws at least one filled block', () => {
    const repos = Array.from({ length: 40 }, (_, index) =>
      buildRepo({ name: `repo-${index}`, language: index ? 'Go' : 'Elixir' }),
    )

    expect(renderLanguages(repos)).toContain('█░░░░░░░░░░░░░░░░░')
  })

  it('caps the table at six languages', () => {
    const repos = Array.from({ length: 9 }, (_, index) =>
      buildRepo({ language: `Lang-${index}`, name: `repo-${index}` }),
    )

    expect(renderLanguages(repos).split('\n')).toHaveLength(8)
  })

  it('ignores forks and excluded repositories', () => {
    const section = renderLanguages([
      buildRepo({ language: 'TypeScript', name: 'own' }),
      buildRepo({ fork: true, language: 'PHP', name: 'forked' }),
      buildRepo({ language: 'Java', name: 'vue-reactive-form' }),
    ])

    expect(section).not.toContain('PHP')
    expect(section).not.toContain('Java')
  })

  it('falls back to a neutral swatch for an unmapped language', () => {
    const section = renderLanguages([buildRepo({ language: 'Zig' })])

    expect(section).toContain('badge/-8b949e?')
  })

  it('reports when no repository has a language', () => {
    expect(renderLanguages([buildRepo({ language: null })])).toBe(
      'No language data available.',
    )
  })
})
