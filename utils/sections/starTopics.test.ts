import { describe, expect, it } from 'bun:test'

import { buildStarredRepo } from '../fixtures.ts'
import { renderStarTopics } from './starTopics.ts'

function starsWithTopics(topicLists: string[][]) {
  return topicLists.map((topics) => buildStarredRepo({ topics }))
}

describe('renderStarTopics', () => {
  it('ranks the themes that recur across what I starred', () => {
    const chips = renderStarTopics(
      starsWithTopics([
        ['react', 'vite'],
        ['react', 'vite'],
        ['react'],
        ['rust', 'wasm'],
        ['rust'],
      ]),
    ).split('\n')

    expect(chips[1]).toContain('react-3')
    // Equal counts break alphabetically, so rust precedes vite.
    expect(chips[2]).toContain('rust-2')
    expect(chips[3]).toContain('vite-2')
  })

  it('ignores a topic that appears once, which is noise from one repository', () => {
    expect(
      renderStarTopics(
        starsWithTopics([
          ['rust'],
          ['rust'],
          ['hermes-agent', 'chatgpt', 'codex'],
        ]),
      ),
    ).not.toContain('hermes-agent')
  })

  it('caps the row at ten themes', () => {
    const topics = Array.from({ length: 14 }, (_, index) => `topic-${index}`)

    expect(
      renderStarTopics(starsWithTopics([topics, topics])).split('\n'),
    ).toHaveLength(12)
  })

  it('reports when nothing recurs', () => {
    expect(renderStarTopics(starsWithTopics([['solo']]))).toBe(
      'No starred topics available.',
    )
  })

  it('counts spellings of one theme together, once per repository', () => {
    const section = renderStarTopics(
      starsWithTopics([['ai-agents', 'agents'], ['ai-agent'], ['agent']]),
    )

    expect(section).toContain('agents-3')
    expect(section).not.toContain('ai--agents')
  })

  it('leaves out my everyday languages', () => {
    expect(
      renderStarTopics(starsWithTopics([['typescript'], ['typescript']])),
    ).toBe('No starred topics available.')
  })
})
