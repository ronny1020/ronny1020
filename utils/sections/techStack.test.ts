import { describe, expect, it } from 'bun:test'

import { renderTechStack } from './techStack.ts'

const realStack = new Map([
  ['typescript', 12],
  ['vite', 8],
  ['eslint', 10],
  ['prettier', 9],
  ['vitest', 5],
  ['react', 4],
  ['vue', 3],
  ['left-pad', 7],
])

describe('renderTechStack', () => {
  it('ranks tools by how many repositories declare them', () => {
    const badges = renderTechStack(realStack).split('\n')

    expect(badges[1]).toContain('TypeScript')
    expect(badges[2]).toContain('ESLint')
  })

  it('badges only tools it has a mapping for', () => {
    expect(renderTechStack(realStack)).not.toContain('left-pad')
  })

  it('states the evidence in the alt text', () => {
    expect(renderTechStack(realStack)).toContain(
      'alt="TypeScript: used in 12 of my repositories"',
    )
  })

  it('deduplicates packages that describe the same tool', () => {
    const section = renderTechStack(
      new Map([...realStack, ['storybook', 2], ['@storybook/react', 2]]),
    )

    expect(section.split('Storybook-')).toHaveLength(2)
  })

  it('keeps quiet rather than publishing a nearly empty stack', () => {
    expect(renderTechStack(new Map([['typescript', 1]]))).toBe(
      'No dependency data available.',
    )
  })
})
