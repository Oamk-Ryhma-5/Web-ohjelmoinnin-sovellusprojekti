import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { ApiError } from './tmdbClient.js'

const derive = promisify(scrypt)
const OPTIONS = { N: 131072, r: 8, p: 1, maxmem: 192 * 1024 * 1024 }
const DUMMY = `scrypt$${'00'.repeat(16)}$${'00'.repeat(64)}`
let active = 0

async function hashBytes(password, salt) {
  // Rajaa raskaan laskennan muisti myös samanaikaisissa pyynnöissä.
  if (active >= 2) throw new ApiError(503, 'Palvelu on varattu. Yritä hetken kuluttua.', 'AUTH_BUSY')
  active += 1
  try { return await derive(password, salt, 64, OPTIONS) }
  finally { active -= 1 }
}

export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const hash = await hashBytes(password, salt)
  return `scrypt$${salt}$${hash.toString('hex')}`
}

export async function verifyPassword(password, stored = DUMMY) {
  const match = /^scrypt\$([a-f0-9]{32})\$([a-f0-9]{128})$/.exec(stored || DUMMY)
  const [, salt, expected] = match || /^scrypt\$([a-f0-9]{32})\$([a-f0-9]{128})$/.exec(DUMMY)
  const actual = await hashBytes(password, salt)
  return timingSafeEqual(actual, Buffer.from(expected, 'hex')) && Boolean(match)
}
