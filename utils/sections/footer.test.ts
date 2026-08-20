import { describe, expect, it } from 'bun:test'

import { buildUser } from '../fixtures.ts'
import { renderFooter } from './footer.ts'

describe('renderFooter', () => {
  it('prefixes the location when the profile has one', () => {
    expect(renderFooter(buildUser())).toStartWith(
      '<sub>Taipei · README rebuilt',
    )
  })

  it('omits the separator when there is no location', () => {
    expect(renderFooter(buildUser({ location: null }))).toStartWith(
      '<sub>README rebuilt',
    )
  })
})
