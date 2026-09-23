import { createHash, randomBytes } from 'node:crypto'

export const cookieName = 'leffahaku_session'
const sessionLength = 7 * 24 * 60 * 60 * 1000

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex')
}

export function readSessionHash(req) {
  const cookies = (req.headers.cookie || '').split(';')
  const cookie = cookies.find((value) => value.trim().startsWith(`${cookieName}=`))
  if (!cookie) return null
  const token = cookie.trim().slice(cookieName.length + 1)
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null
  return hashToken(token)
}

export function createSession() {
  const token = randomBytes(32).toString('base64url')
  return {
    token,
    hash: hashToken(token),
    expiresAt: new Date(Date.now() + sessionLength),
  }
}

export function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production' || process.env.SESSION_COOKIE_SECURE === 'true',
    path: '/api',
  }
}

export function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    createdAt: user.created_at,
  }
}

export function sendSession(res, user, session, status = 200) {
  res.cookie(cookieName, session.token, { ...cookieOptions(), maxAge: sessionLength })
  res.status(status).json({ user: publicUser(user) })
}
