import test from 'node:test'
import assert from 'node:assert/strict'
import { translations } from '../src/translations.js'

function keys(value, prefix = '') {
  return Object.entries(value)
    .flatMap(([key, item]) => {
      const name = `${prefix}${key}`
      return typeof item === 'object' ? keys(item, `${name}.`) : [name]
    })
    .sort()
}

test('kaikki käyttöliittymän tekstit ja virheet löytyvät suomeksi ja englanniksi', () => {
  assert.deepEqual(keys(translations.fi), keys(translations.en))
  for (const texts of Object.values(translations)) {
    for (const value of Object.values(texts)) {
      if (typeof value === 'string') assert.ok(value.trim().length > 0)
    }
  }
})
