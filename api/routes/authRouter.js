import { Router } from 'express'
import { createHash, randomBytes } from 'node:crypto'
import { ApiError } from '../services/tmdbClient.js'
import { hashPassword, verifyPassword } from '../services/passwords.js'
import { createAuthLimit } from '../middleware/authLimits.js'

const COOKIE = 'leffahaku_session'
const SESSION_MS = 7 * 24 * 60 * 60 * 1000
const publicUser = user => ({ id: user.id, username: user.username, email: user.email, createdAt: user.created_at })
const tokenHash = token => createHash('sha256').update(token).digest('hex')

function cookieHash(req) {
  const value = req.headers.cookie?.split(';').map(part => part.trim()).find(part => part.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1)
  return value && /^[A-Za-z0-9_-]{43}$/.test(value) ? tokenHash(value) : null
}

function usernameOf(value) {
  if (typeof value !== 'string' || !/^[\p{L}\p{N}_.-]{3,30}$/u.test(value.trim())) {
    throw new ApiError(400, 'Käyttäjänimessä tulee olla 3–30 kirjainta, numeroa tai merkkiä . _ -', 'INVALID_USERNAME')
  }
  return value.trim()
}

function emailOf(value) {
  if (typeof value !== 'string' || value.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
    throw new ApiError(400, 'Anna kelvollinen sähköpostiosoite.', 'INVALID_EMAIL')
  }
  return value.trim().toLowerCase()
}

function passwordOf(value, isNew = false) {
  if (typeof value !== 'string' || value.length > 128 || value.length < (isNew ? 12 : 1) || !value.trim()) {
    throw new ApiError(400, 'Salasanassa tulee olla 12–128 merkkiä.', 'INVALID_PASSWORD')
  }
  return value
}

export function createAuthRouter(repository, { origins, secureCookies = process.env.NODE_ENV === 'production' || process.env.SESSION_COOKIE_SECURE === 'true', rateLimit } = {}) {
  const router = Router()
  const cookieOptions = { httpOnly: true, sameSite: 'lax', secure: secureCookies, path: '/api' }
  const limit = createAuthLimit(rateLimit)
  router.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next() })
  router.use((req, _res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next()
    // JSON + oma otsake vaativat selaimessa CORS-esitarkistuksen. Vieraat originit hylätään myös tässä.
    if (req.get('X-Leffahaku-Request') !== '1' || !req.is('application/json') ||
        (req.get('Origin') && !origins?.includes(req.get('Origin')))) {
      return next(new ApiError(403, 'Pyyntöä ei sallittu. Päivitä sivu ja yritä uudelleen.', 'REQUEST_REJECTED'))
    }
    next()
  })

  async function requireUser(req, _res, next) {
    const hash = cookieHash(req)
    const user = hash ? await repository.findSessionUser(hash) : null
    if (!user) throw new ApiError(401, 'Kirjaudu sisään jatkaaksesi.', 'UNAUTHENTICATED')
    req.user = user
    next()
  }

  async function signIn(req, res, action, status = 200) {
    const token = randomBytes(32).toString('base64url')
    const session = { hash: tokenHash(token), expiresAt: new Date(Date.now() + SESSION_MS) }
    const user = await action(session, cookieHash(req))
    res.cookie(COOKIE, token, { ...cookieOptions, maxAge: SESSION_MS })
    res.status(status).json({ user: publicUser(user) })
  }

  router.get('/me', requireUser, (req, res) => res.json({ user: publicUser(req.user) }))
  router.post('/register', limit, async (req, res) => {
    const username = usernameOf(req.body?.username)
    const email = emailOf(req.body?.email)
    const passwordHash = await hashPassword(passwordOf(req.body?.password, true))
    await signIn(req, res, (session, old) => repository.register({ username, email, passwordHash }, session, old), 201)
  })
  router.post('/login', limit, async (req, res) => {
    const email = emailOf(req.body?.email)
    const password = passwordOf(req.body?.password)
    const user = await repository.findByEmail(email)
    const valid = await verifyPassword(password, user?.password_hash)
    if (!user || !valid) throw new ApiError(401, 'Sähköpostiosoite tai salasana on väärin.', 'INVALID_CREDENTIALS')
    await signIn(req, res, (session, old) => repository.login(user.id, user.password_hash, session, old))
  })
  router.post('/logout', async (req, res) => {
    const hash = cookieHash(req)
    if (hash) await repository.logout(hash)
    res.clearCookie(COOKIE, cookieOptions)
    res.status(204).end()
  })
  router.patch('/profile', requireUser, async (req, res) => {
    const user = await repository.updateProfile(req.user.id, usernameOf(req.body?.username))
    res.json({ user: publicUser(user) })
  })
  router.post('/password', requireUser, limit, async (req, res) => {
    const current = passwordOf(req.body?.currentPassword)
    const password = passwordOf(req.body?.password, true)
    if (!await verifyPassword(current, req.user.password_hash)) {
      throw new ApiError(400, 'Nykyinen salasana on väärin.', 'WRONG_PASSWORD')
    }
    if (current === password) throw new ApiError(400, 'Valitse uusi salasana.', 'SAME_PASSWORD')
    const passwordHash = await hashPassword(password)
    await signIn(req, res, session => repository.changePassword(req.user.id, req.user.password_hash, passwordHash, session))
  })
  return router
}
