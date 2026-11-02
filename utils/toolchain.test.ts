import { describe, expect, it } from 'bun:test'

describe('toolchain', () => {
  /** `bun --check` uses the TypeScript compiled into Bun, so a Bun upgrade can move it silently. */
  it('type-checks with TypeScript 7.0.2', () => {
    expect(process.versions.typescript).toBe('7.0.2')
  })
})
