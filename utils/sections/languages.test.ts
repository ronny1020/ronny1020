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

    expect(badges[0]).toBe('```mermaid')
    expect(badges[2]).toBe('  "TypeScript" : 66.7')
    expect(badges[3]).toBe('  "Vue" : 33.3')
  })

  it('caps the row at six languages', () => {
    const repos = Array.from({ length: 9 }, (_, index) =>
      buildRepo({ language: `Lang-${index}`, name: `repo-${index}` }),
    )

    expect(renderLanguages(repos).split('\n')).toHaveLength(9)
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

  it('renders a mermaid pie, which scales to the column in either theme', () => {
    const section = renderLanguages([buildRepo({ language: 'Zig' })])

    expect(section).toContain('pie showData title Repositories by language')
    expect(section).toContain('"Zig" : 100.0')
    expect(section.endsWith('```')).toBe(true)
  })

  it('reports when no repository has a language', () => {
    expect(renderLanguages([buildRepo({ language: null })])).toBe(
      'No language data available.',
    )
  })
})
