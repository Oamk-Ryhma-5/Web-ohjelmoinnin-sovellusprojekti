import { Router } from 'express'
import { getGenres, getNowPlaying, searchMovies } from '../controllers/MovieController.js'

const router = Router()

// Haku ja teatterilista ovat avoimia myös ilman kirjautumista.
router.get('/movies/now-playing', getNowPlaying)
router.get('/genres', getGenres)
router.get('/search', searchMovies)

export default router
