import { centered } from '../format.ts'
import type { SocialAccount } from '../types.ts'

/** Provider name to the shields logo slug and brand color that represents it. */
const PROVIDER_BADGES: Record<string, { color: string; logo: string }> = {
  linkedin: { color: '0A66C2', logo: 'linkedin' },
  mastodon: { color: '6364FF', logo: 'mastodon' },
  reddit: { color: 'FF4500', logo: 'reddit' },
  stackoverflow: { color: 'F58025', logo: 'stackoverflow' },
  twitch: { color: '9146FF', logo: 'twitch' },
  twitter: { color: '000000', logo: 'x' },
  youtube: { color: 'FF0000', logo: 'youtube' },
}

function providerOf(account: SocialAccount): string {
  if (account.provider !== 'generic') {
    return account.provider
  }

  const host = account.url.replace(/^https?:\/\/(www\.)?/, '').split(/[./]/)[0]

  return host ?? 'link'
}

/** Mirrors the accounts listed on my GitHub profile, so the two cannot disagree. */
export function renderSocialLinks(accounts: SocialAccount[]): string {
  if (accounts.length === 0) {
    return 'No linked accounts available.'
  }

  return centered(
    accounts.map((account) => {
      const provider = providerOf(account)
      const badge = PROVIDER_BADGES[provider] ?? {
        color: '30363d',
        logo: 'github',
      }
      const label = provider.replace(/^./, (first) => first.toUpperCase())

      return `  <a href="${account.url}"><img alt="${label}" src="https://img.shields.io/badge/${label}-${badge.color}?style=for-the-badge&logo=${badge.logo}&logoColor=white"></a>`
    }),
  )
}
