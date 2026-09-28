import { Router } from 'express'
import { auth } from '../middleware/auth.js'
import { checkRequest } from '../middleware/checkRequest.js'
import { getUserFavorites, addFavorite, removeFavorite } from '../models/favoriteModel.js'

const router = Router()

router.use(checkRequest)
router.use(auth)

const getAccountId = (req) => {
  return req.user?.id ?? req.user?.account_id ?? req.user?.accountId
}

// POST /api/favorites - Lisää suosikki
router.post('/', async (req, res, next) => {
  try {
    const accountId = getAccountId(req)

    if (!accountId) {
      return res.status(401).json({ error: 'Käyttäjä-ID puuttuu' })
    }

    const { movieId, movieTitle, posterPath } = req.body
    const newFavorite = await addFavorite(accountId, movieId, movieTitle, posterPath)

    res.status(201).json(newFavorite)
  } catch (err) {
    next(err)
  }
})

// GET /api/favorites - Hae suosikit
router.get('/', async (req, res, next) => {
  try {
    const accountId = getAccountId(req)

    if (!accountId) {
      return res.status(401).json({ error: 'Käyttäjä-ID puuttuu' })
    }

    const favorites = await getUserFavorites(accountId)
    res.json(favorites)
  } catch (err) {
    next(err)
  }
})

// DELETE /api/favorites/:movieId - Poista suosikki
router.delete('/:movieId', async (req, res, next) => {
  try {
    const accountId = getAccountId(req)

    if (!accountId) {
      return res.status(401).json({ error: 'Käyttäjä-ID puuttuu' })
    }

    await removeFavorite(accountId, req.params.movieId)
    res.json({ message: 'Suosikki poistettu' })
  } catch (err) {
    next(err)
  }
})

export default router