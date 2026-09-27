import { selectSessionUser } from '../models/Session.js'
import { readSessionHash } from '../helper/session.js'
import { ApiError } from '../helper/ApiError.js'

export async function auth(req, _res, next) {
  try {
    const hash = readSessionHash(req)
    const user = hash ? await selectSessionUser(hash) : null
    if (!user) {
      throw new ApiError('Kirjaudu sisään jatkaaksesi.', 401, 'UNAUTHENTICATED')
    }
    req.user = user
    next()
  } catch (error) {
    next(error)
  }
}
