import { Router } from 'express'
import {
  register,
  login,
  logout,
  getCurrentUser,
  changeUsername,
  changePassword,
} from '../controllers/UserController.js'
import { auth } from '../middleware/auth.js'
import { checkRequest } from '../middleware/checkRequest.js'
import { createAuthLimit } from '../middleware/authLimits.js'

const router = Router()
const limit = createAuthLimit()

router.use(checkRequest)
router.post('/register', limit, register)
router.post('/login', limit, login)
router.post('/logout', logout)
router.get('/me', auth, getCurrentUser)
router.patch('/profile', auth, changeUsername)
router.post('/password', auth, limit, changePassword)

export default router
