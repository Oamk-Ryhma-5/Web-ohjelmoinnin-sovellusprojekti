import { Router } from 'express'
import { getGenres, getMovie, getNowPlaying, searchMovies } from '../controllers/MovieController.js'

const router = Router()

router.get('/movies/now-playing', getNowPlaying)
router.get('/movies/:id', getMovie)
router.get('/tv/:id', getMovie)
router.get('/genres', getGenres)
router.get('/search', searchMovies)

export default router