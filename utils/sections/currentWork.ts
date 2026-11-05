import { CURRENT_WORK_DAYS } from '../config.ts'
import { escapeLinkText, truncate } from '../format.ts'
import type { CurrentWork } from '../types.ts'

const MAX_SUMMARY_LENGTH = 80

/** A line under About me; empty after a quiet stretch, which drops it. */
export function renderCurrentWork(work: CurrentWork | null): string {
  if (!work) {
    return ''
  }

  const { pushes, repo } = work
  const summary = repo.description
    ? ` — ${escapeLinkText(truncate(repo.description, MAX_SUMMARY_LENGTH))}`
    : ''
  const pushCount = `${pushes}&nbsp;${pushes === 1 ? 'push' : 'pushes'}`

  return `🔨 Lately I'm mostly pushing to [**${repo.name}**](${repo.html_url})${summary} <sub>${pushCount} in ${CURRENT_WORK_DAYS}&nbsp;days</sub>`
}
