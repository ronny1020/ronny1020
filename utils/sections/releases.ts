import { RELEASE_WINDOW_DAYS } from '../config.ts'
import { escapeLinkText, formatDate } from '../format.ts'
import type { GithubRelease } from '../types.ts'

/**
 * One linked line per release, in the order `pickLatestReleases` gives. The
 * target sits in `<>` so a `)` in a tag name cannot close the link.
 */
export function renderReleases(releases: GithubRelease[]): string {
  if (releases.length === 0) {
    return `No releases in the last ${RELEASE_WINDOW_DAYS}&nbsp;days.`
  }

  return releases
    .map(
      (release) =>
        `- [**${escapeLinkText(release.repo)}** ${escapeLinkText(release.tag_name)}](<${release.html_url}>) <sub>${formatDate(release.published_at ?? '')}</sub>`,
    )
    .join('\n')
}
