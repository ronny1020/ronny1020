import { describe, expect, it } from 'bun:test'

import { renderSocialLinks } from './socialLinks.ts'

describe('renderSocialLinks', () => {
  it('badges a known provider with its own logo', () => {
    expect(
      renderSocialLinks([
        { provider: 'linkedin', url: 'https://www.linkedin.com/in/someone/' },
      ]),
    ).toContain('Linkedin-0A66C2?style=for-the-badge&logo=linkedin')
  })

  it('derives a label from the host for a generic account', () => {
    const section = renderSocialLinks([
      { provider: 'generic', url: 'https://stackoverflow.com/users/1/someone' },
    ])

    expect(section).toContain('Stackoverflow-F58025')
    expect(section).toContain('logo=stackoverflow')
  })

  it('falls back for a provider it does not know', () => {
    expect(
      renderSocialLinks([{ provider: 'generic', url: 'https://example.dev' }]),
    ).toContain('Example-30363d?style=for-the-badge&logo=github')
  })

  it('reports when no accounts are linked', () => {
    expect(renderSocialLinks([])).toBe('No linked accounts available.')
  })
})
