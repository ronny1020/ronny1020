import { MIN_EVIDENCE_COUNT, MIN_STACK_TOOLS } from '../config.ts'
import { centered } from '../format.ts'

/** npm package name to the badge that represents the tool it belongs to. */
const TOOL_BADGES: Record<
  string,
  { color: string; label: string; logo: string; logoColor?: string }
> = {
  '@storybook/react': {
    color: 'FF4785',
    label: 'Storybook',
    logo: 'storybook',
  },
  '@testing-library/react': {
    color: 'E33332',
    label: 'Testing Library',
    logo: 'testinglibrary',
  },
  eslint: { color: '4B32C3', label: 'ESLint', logo: 'eslint' },
  next: { color: '000000', label: 'Next.js', logo: 'nextdotjs' },
  nuxt: {
    color: '00DC82',
    label: 'Nuxt',
    logo: 'nuxtdotjs',
    logoColor: 'black',
  },
  pnpm: { color: 'F69220', label: 'pnpm', logo: 'pnpm' },
  prettier: {
    color: 'F7B93E',
    label: 'Prettier',
    logo: 'prettier',
    logoColor: 'black',
  },
  react: { color: '61DAFB', label: 'React', logo: 'react', logoColor: 'black' },
  sass: { color: 'CC6699', label: 'Sass', logo: 'sass' },
  storybook: { color: 'FF4785', label: 'Storybook', logo: 'storybook' },
  svelte: { color: 'FF3E00', label: 'Svelte', logo: 'svelte' },
  tailwindcss: { color: '06B6D4', label: 'Tailwind CSS', logo: 'tailwindcss' },
  tsup: { color: 'FF7A00', label: 'tsup', logo: 'esbuild', logoColor: 'black' },
  typescript: { color: '3178C6', label: 'TypeScript', logo: 'typescript' },
  unbuild: {
    color: 'FFD200',
    label: 'unbuild',
    logo: 'rollupdotjs',
    logoColor: 'black',
  },
  vite: { color: '646CFF', label: 'Vite', logo: 'vite' },
  vitepress: { color: '5C73E7', label: 'VitePress', logo: 'vitepress' },
  vitest: { color: '6E9F18', label: 'Vitest', logo: 'vitest' },
  vue: { color: '4FC08D', label: 'Vue', logo: 'vuedotjs' },
}

/**
 * The stack as declared by my own `package.json` files, ranked by how many
 * repositories depend on each tool. A hand-written list drifts into what I
 * remember using; this cannot.
 */
export function renderTechStack(
  repoCountByDependency: Map<string, number>,
): string {
  const tools = [...repoCountByDependency.entries()]
    .filter(([, count]) => count >= MIN_EVIDENCE_COUNT)
    .flatMap(([dependency, count]) => {
      const badge = TOOL_BADGES[dependency]

      return badge ? [{ badge, count }] : []
    })
    .sort(
      (a, b) => b.count - a.count || a.badge.label.localeCompare(b.badge.label),
    )

  // Deduplicate: several package names can map to the same tool.
  const seen = new Set<string>()
  const badges = tools.flatMap(({ badge, count }) => {
    if (seen.has(badge.label)) {
      return []
    }

    seen.add(badge.label)
    const label = badge.label.replace(/ /g, '%20').replace(/-/g, '--')
    const logoColor = badge.logoColor ?? 'white'

    return [
      `  <img alt="${badge.label}: used in ${count} of my repositories" src="https://img.shields.io/badge/${label}-${badge.color}?style=for-the-badge&logo=${badge.logo}&logoColor=${logoColor}">`,
    ]
  })

  if (badges.length < MIN_STACK_TOOLS) {
    return 'No dependency data available.'
  }

  return centered(badges)
}
