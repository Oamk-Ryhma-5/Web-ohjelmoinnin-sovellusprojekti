import { createHash } from 'node:crypto'
<<<<<<< HEAD
import { ApiError } from '../services/tmdbClient.js'
=======
import { ApiError } from '../helper/ApiError.js'
>>>>>>> origin/yhdistetty-versio

export function createAuthLimit({ limit = 30, windowMs = 15 * 60 * 1000, now = Date.now } = {}) {
  const attempts = new Map()
  return (req, res, next) => {
    const time = now()
    for (const [key, entry] of attempts) if (entry.until <= time) attempts.delete(key)
<<<<<<< HEAD
    const key = createHash('sha256').update(req.ip || 'unknown').digest('hex')
    if (!attempts.has(key)) {
      if (attempts.size >= 10000) return next(new ApiError(503, 'Palvelu on varattu.', 'AUTH_BUSY'))
=======
    const key = createHash('sha256')
      .update(req.ip || 'unknown')
      .digest('hex')
    if (!attempts.has(key)) {
      if (attempts.size >= 10000) return next(new ApiError('Palvelu on varattu.', 503, 'AUTH_BUSY'))
>>>>>>> origin/yhdistetty-versio
      attempts.set(key, { count: 0, until: time + windowMs })
    }
    const entry = attempts.get(key)
    entry.count += 1
    if (entry.count > limit) {
      res.set('Retry-After', String(Math.ceil((entry.until - time) / 1000)))
<<<<<<< HEAD
      return next(new ApiError(429, 'Liian monta yritystä. Yritä myöhemmin uudelleen.', 'AUTH_RATE_LIMIT'))
=======
      return next(
        new ApiError('Liian monta yritystä. Yritä myöhemmin uudelleen.', 429, 'AUTH_RATE_LIMIT'),
      )
>>>>>>> origin/yhdistetty-versio
    }
    next()
  }
}
