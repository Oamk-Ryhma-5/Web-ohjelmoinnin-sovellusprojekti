import test from 'node:test'
import assert from 'node:assert/strict'
import { messages } from '../src/i18n/messages.js'

test('käyttöliittymän suomen ja englannin käännökset kattavat samat tekstit ja muuttujat', () => {
  assert.deepEqual(Object.keys(messages.fi).sort(), Object.keys(messages.en).sort())
  for (const key of Object.keys(messages.fi)) {
    assert.ok(messages.fi[key].trim() && messages.en[key].trim())
    assert.deepEqual(messages.fi[key].match(/\{\w+\}/g), messages.en[key].match(/\{\w+\}/g))
  }
})
