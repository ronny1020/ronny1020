import { describe, expect, it } from 'bun:test'

import { buildRepo } from '../fixtures.ts'
import { renderLanguages } from './languages.ts'

describe('renderLanguages', () => {
  it('ranks languages by repository share', () => {
    const badges = renderLanguages([
      buildRepo({ language: 'TypeScript', name: 'a' }),
      buildRepo({ language: 'TypeScript', name: 'b' }),
      buildRepo({ language: 'Vue', name: 'c' }),
      buildRepo({ language: null, name: 'd' }),
    ]).split('\n')

    expect(badges[1]).toContain('TypeScript-66.7%25-3178c6')
    expect(badges[2]).toContain('Vue-33.3%25-41b883')
  })

  it('caps the row at six languages', () => {
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

  it('falls back to a neutral color for an unmapped language', () => {
    expect(renderLanguages([buildRepo({ language: 'Zig' })])).toContain(
      'Zig-100.0%25-8b949e',
    )
  })

  it('reports when no repository has a language', () => {
    expect(renderLanguages([buildRepo({ language: null })])).toBe(
      'No language data available.',
    )
  })
})
