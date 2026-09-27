import test from 'node:test'
import assert from 'node:assert/strict'
<<<<<<< HEAD
import { messages } from '../src/i18n/messages.js'

test('käyttöliittymän suomen ja englannin käännökset kattavat samat tekstit ja muuttujat', () => {
  assert.deepEqual(Object.keys(messages.fi).sort(), Object.keys(messages.en).sort())
  for (const key of Object.keys(messages.fi)) {
    assert.ok(messages.fi[key].trim() && messages.en[key].trim())
    assert.deepEqual(messages.fi[key].match(/\{\w+\}/g), messages.en[key].match(/\{\w+\}/g))
=======
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
>>>>>>> origin/yhdistetty-versio
  }
})
