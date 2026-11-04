import { MAX_STAR_TOPICS, MIN_EVIDENCE_COUNT } from '../config.ts'
import { centered, shieldsBadge } from '../format.ts'
import type { StarredRepo } from '../types.ts'

/** Topic spellings counted as one canonical theme. */
const TOPIC_ALIASES: Record<string, string> = {
  agent: 'agents',
  'ai-agent': 'agents',
  'ai-agents': 'agents',
  'artificial-intelligence': 'ai',
  llm: 'llms',
  nodejs: 'node',
  reactjs: 'react',
  vuejs: 'vue',
}

/** My everyday languages: starring them says nothing about what I read. */
const EVERYDAY_TOPICS = new Set(['javascript', 'typescript'])

function themesOf(repo: StarredRepo): Set<string> {
  return new Set(
    repo.topics
      .map((topic) => TOPIC_ALIASES[topic] ?? topic)
      .filter((topic) => !EVERYDAY_TOPICS.has(topic)),
  )
}

/**
 * Themes across everything I have starred. The list of repositories says more
 * about their authors than about me; the recurring topics say what I read.
 */
export function renderStarTopics(repos: StarredRepo[]): string {
  const counts = new Map<string, number>()

  for (const topic of repos.flatMap((repo) => [...themesOf(repo)])) {
    counts.set(topic, (counts.get(topic) ?? 0) + 1)
  }

  const ranked = [...counts.entries()]
    .filter(([, count]) => count >= MIN_EVIDENCE_COUNT)
    .sort(
      ([leftTopic, left], [rightTopic, right]) =>
        right - left || leftTopic.localeCompare(rightTopic),
    )
    .slice(0, MAX_STAR_TOPICS)

  if (ranked.length === 0) {
    return 'No starred topics available.'
  }

  return centered(
    ranked.map(
      ([topic, count]) =>
        `  <img alt="${topic}: ${count} starred repositories" src="${shieldsBadge({ color: '30363d', label: topic, value: String(count) })}">`,
    ),
  )
}
