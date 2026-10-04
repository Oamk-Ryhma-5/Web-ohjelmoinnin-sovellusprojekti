import { Router } from 'express'
import { auth } from '../middleware/auth.js'
import { checkRequest } from '../middleware/checkRequest.js'
import { addReview, getMovieReviews, getUserReview, updateReview, deleteReview } from '../models/reviewModel.js'

const router = Router()

router.use(checkRequest)

const getAccountId = (req) => {
  return req.user?.id ?? req.user?.account_id ?? req.user?.accountId
}

// Hakee tietyn elokuvan kaikki arvostelut
router.get('/movie/:movieId', async (req, res, next) => {
  try {
    const { movieId } = req.params

    if (!movieId || movieId === 'undefined') {
      return res.status(400).json({
        error: 'Virheellinen tai puuttuva movieId'
      })
    }

    const reviews = await getMovieReviews(movieId)

    res.json(reviews)
  } catch (err) {
    next(err)
  }
})

// Hakee kirjautuneen käyttäjän oman arvostelun
router.get('/mine/:movieId', auth, async (req, res, next) => {
  try {
    const accountId = getAccountId(req)

    if (!accountId) {
      return res.status(401).json({
        error: 'Käyttäjä-ID puuttuu'
      })
    }

    const { movieId } = req.params

    if (!movieId || movieId === 'undefined') {
      return res.status(400).json({
        error: 'Virheellinen tai puuttuva movieId'
      })
    }

    const review = await getUserReview(accountId, movieId)

    res.json(review || null)
  } catch (err) {
    next(err)
  }
})

// Lisää uuden arvostelun
router.post('/', auth, async (req, res, next) => {
  try {
    const accountId = getAccountId(req)

    if (!accountId) {
      return res.status(401).json({
        error: 'Käyttäjä-ID puuttuu'
      })
    }

    const { movieId, movieTitle, stars, reviewText } = req.body

    if (!movieId) {
      return res.status(400).json({
        error: 'Elokuvan ID (movieId) puuttuu'
      })
    }

    if (!movieTitle) {
      return res.status(400).json({
        error: 'Elokuvan nimi puuttuu'
      })
    }

    if (
      !Number.isInteger(Number(stars)) ||
      Number(stars) < 1 ||
      Number(stars) > 5
    ) {
      return res.status(400).json({
        error: 'Tähtien määrän tulee olla 1-5'
      })
    }

    if (!reviewText || !reviewText.trim()) {
      return res.status(400).json({
        error: 'Arvosteluteksti puuttuu'
      })
    }

    if (reviewText.length > 2000) {
      return res.status(400).json({
        error: 'Arvosteluteksti on liian pitkä'
      })
    }

    const newReview = await addReview(
      accountId,
      movieId,
      movieTitle,
      stars,
      reviewText.trim()
    )

    res.status(201).json(newReview)
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({
        error: 'Olet jo arvostellut tämän elokuvan'
      })
    }

    next(err)
  }
})

// Muokkaa kirjautuneen käyttäjän omaa arvostelua
router.put('/:movieId', auth, async (req, res, next) => {
  try {
    const accountId = getAccountId(req)

    if (!accountId) {
      return res.status(401).json({
        error: 'Käyttäjä-ID puuttuu'
      })
    }

    const { movieId } = req.params
    const { stars, reviewText } = req.body

    if (!movieId || movieId === 'undefined') {
      return res.status(400).json({
        error: 'Virheellinen tai puuttuva movieId'
      })
    }

    if (
      !Number.isInteger(Number(stars)) ||
      Number(stars) < 1 ||
      Number(stars) > 5
    ) {
      return res.status(400).json({
        error: 'Tähtien määrän tulee olla 1-5'
      })
    }

    if (!reviewText || !reviewText.trim()) {
      return res.status(400).json({
        error: 'Arvosteluteksti puuttuu'
      })
    }

    if (reviewText.length > 2000) {
      return res.status(400).json({
        error: 'Arvosteluteksti on liian pitkä'
      })
    }

    const updatedReview = await updateReview(
      accountId,
      movieId,
      stars,
      reviewText.trim()
    )

    if (!updatedReview) {
      return res.status(404).json({
        error: 'Arvostelua ei löytynyt'
      })
    }

    res.json(updatedReview)
  } catch (err) {
    next(err)
  }
})

// Poistaa kirjautuneen käyttäjän oman arvostelun
router.delete('/:movieId', auth, async (req, res, next) => {
  try {
    const accountId = getAccountId(req)

    if (!accountId) {
      return res.status(401).json({
        error: 'Käyttäjä-ID puuttuu'
      })
    }

    const { movieId } = req.params

    if (!movieId || movieId === 'undefined') {
      return res.status(400).json({
        error: 'Virheellinen tai puuttuva movieId'
      })
    }

    const deletedReview = await deleteReview(accountId, movieId)

    if (!deletedReview) {
      return res.status(404).json({
        error: 'Arvostelua ei löytynyt'
      })
    }

    res.json({
      message: 'Arvostelu poistettu',
      deleted: deletedReview
    })
  } catch (err) {
    next(err)
  }
})

export default router