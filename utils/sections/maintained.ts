import { formatDate, formatNumber } from '../format.ts'
import type { MaintainedProject } from '../types.ts'

/**
 * States the numbers and the date of the last merge, and nothing about being
 * active: a quiet six months should read as a finished project, not as a lie.
 */
export function renderMaintained(project: MaintainedProject): string {
  if (project.commits === 0) {
    return 'No maintained project available.'
  }

  const others = project.teamSize - 1
  const company =
    others > 0
      ? `, alongside ${formatNumber(others)} other contributor${others === 1 ? '' : 's'}`
      : ''
  const share = `${formatNumber(project.commits)} of the ${formatNumber(project.totalCommits)} human commits`
  const lastMerge = project.lastMergedAt
    ? `, most recently on ${formatDate(project.lastMergedAt)}`
    : ''

  return [
    `[**${project.fullName}**](https://github.com/${project.fullName}) — a community-written Chinese travel guide built with VitePress.`,
    '',
    `I have written ${share} in it, across ${formatNumber(project.mergedPullRequests)} merged pull requests${lastMerge}${company}.`,
  ].join('\n')
}
