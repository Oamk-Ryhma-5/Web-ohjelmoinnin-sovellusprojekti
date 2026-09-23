import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { ApiError } from './ApiError.js'

const calculateHash = promisify(scrypt)
const options = { N: 131072, r: 8, p: 1, maxmem: 192 * 1024 * 1024 }
const dummyHash = `scrypt$${'00'.repeat(16)}$${'00'.repeat(64)}`
let activeCalculations = 0

async function derivePassword(password, salt) {
  // scrypt käyttää muistia. Rajataan samanaikaiset laskennat kahteen.
  if (activeCalculations >= 2) {
    throw new ApiError('Palvelu on varattu. Yritä hetken kuluttua.', 503, 'AUTH_BUSY')
  }
  activeCalculations += 1
  try {
    return await calculateHash(password, salt, 64, options)
  } finally {
    activeCalculations -= 1
  }
}

export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const hash = await derivePassword(password, salt)
  return `scrypt$${salt}$${hash.toString('hex')}`
}

export async function verifyPassword(password, storedHash) {
  const pattern = /^scrypt\$([a-f0-9]{32})\$([a-f0-9]{128})$/
  const match = pattern.exec(storedHash || '')
  const [, salt, expected] = match || pattern.exec(dummyHash)
  const actual = await derivePassword(password, salt)
  const matches = timingSafeEqual(actual, Buffer.from(expected, 'hex'))
  return Boolean(match) && matches
}
