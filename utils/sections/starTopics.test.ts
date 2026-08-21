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
        ['javascript', 'typescript'],
        ['javascript', 'typescript'],
        ['javascript'],
        ['rust', 'wasm'],
        ['rust'],
      ]),
    ).split('\n')

    expect(chips[1]).toContain('javascript-3')
    // Equal counts break alphabetically, so rust precedes typescript.
    expect(chips[2]).toContain('rust-2')
    expect(chips[3]).toContain('typescript-2')
  })

  it('ignores a topic that appears once, which is noise from one repository', () => {
    expect(
      renderStarTopics(
        starsWithTopics([
          ['javascript'],
          ['javascript'],
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
})
