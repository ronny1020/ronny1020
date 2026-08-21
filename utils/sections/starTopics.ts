import { MAX_STAR_TOPICS, MIN_EVIDENCE_COUNT } from '../config.ts'
import { centered, shieldsBadge } from '../format.ts'
import type { StarredRepo } from '../types.ts'

/**
 * Themes across everything I have starred. The list of repositories says more
 * about their authors than about me; the recurring topics say what I read.
 */
export function renderStarTopics(repos: StarredRepo[]): string {
  const counts = new Map<string, number>()

  for (const topic of repos.flatMap((repo) => repo.topics)) {
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
