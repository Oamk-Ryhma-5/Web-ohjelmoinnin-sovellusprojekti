import {
  insertUser,
  selectUserByEmail,
  signInUser,
  updatePassword,
  updateUsername,
} from '../models/User.js'
import { deleteSession } from '../models/Session.js'
import { readEmail, readPassword, readUsername } from '../helper/validation.js'
import { hashPassword, verifyPassword } from '../helper/password.js'
import {
  cookieName,
  cookieOptions,
  createSession,
  publicUser,
  readSessionHash,
  sendSession,
} from '../helper/session.js'
import { ApiError } from '../helper/ApiError.js'

export async function register(req, res, next) {
  try {
    const username = readUsername(req.body?.username)
    const email = readEmail(req.body?.email)
    const password = readPassword(req.body?.password, true)
    const passwordHash = await hashPassword(password)
    const session = createSession()
    const user = await insertUser(username, email, passwordHash, session, readSessionHash(req))
    sendSession(res, user, session, 201)
  } catch (error) {
    next(error)
  }
}

export async function login(req, res, next) {
  try {
    const email = readEmail(req.body?.email)
    const password = readPassword(req.body?.password)
    const user = await selectUserByEmail(email)
    const valid = await verifyPassword(password, user?.password_hash)
    if (!valid) {
      throw new ApiError('Sähköposti tai salasana on väärin.', 401, 'INVALID_CREDENTIALS')
    }
    const session = createSession()
    const signedIn = await signInUser(user.id, user.password_hash, session, readSessionHash(req))
    sendSession(res, signedIn, session)
  } catch (error) {
    next(error)
  }
}

export function getCurrentUser(req, res) {
  res.json({ user: publicUser(req.user) })
}

export async function logout(req, res, next) {
  try {
    await deleteSession(readSessionHash(req))
    res.clearCookie(cookieName, cookieOptions())
    res.sendStatus(204)
  } catch (error) {
    next(error)
  }
}

export async function changeUsername(req, res, next) {
  try {
    const username = readUsername(req.body?.username)
    const user = await updateUsername(req.user.id, username)
    res.json({ user: publicUser(user) })
  } catch (error) {
    next(error)
  }
}

export async function changePassword(req, res, next) {
  try {
    const currentPassword = readPassword(req.body?.currentPassword)
    const password = readPassword(req.body?.password, true)
    if (!(await verifyPassword(currentPassword, req.user.password_hash))) {
      throw new ApiError('Nykyinen salasana on väärin.', 400, 'WRONG_PASSWORD')
    }
    if (currentPassword === password) {
      throw new ApiError('Valitse uusi salasana.', 400, 'SAME_PASSWORD')
    }
    const hash = await hashPassword(password)
    const session = createSession()
    const user = await updatePassword(req.user.id, req.user.password_hash, hash, session)
    sendSession(res, user, session)
  } catch (error) {
    next(error)
  }
}
