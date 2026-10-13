import { useEffect, useState } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { api, addFavoriteApi, fetchMovieReviews, errorMessage } from '../api.js'
import { useLanguage } from '../context/useLanguage.js'
import { useUser } from '../context/useUser.js'

import ReviewForm from '../components/ReviewForm.jsx'
import AddToGroupModel from '../components/AddToGroupModel.jsx'

export default function MovieDetails() {
  const { id } = useParams()
  const { pathname } = useLocation()
  const { locale, texts } = useLanguage()
  const { user } = useUser()
  const [movie, setMovie] = useState(null)
  const [favoriteStatus, setFavoriteStatus] = useState('')
  const [reviews, setReviews] = useState([])
  const [reviewReload, setReviewReload] = useState(0)

  const [visibleCount, setVisibleCount] = useState(3)

  useEffect(() => {
    async function loadMovie() {
      try {
        const isTv = pathname.startsWith('/tv')
        const endpoint = isTv ? `/api/tv/${id}` : `/api/movies/${id}`
        const response = await api.get(endpoint, {
          params: { language: locale },
        })
        setMovie(response.data)
      } catch (err) {
        console.error('Virhe tiedelatauksessa:', err)
      }
    }

    loadMovie()
  }, [id, pathname, locale])

  useEffect(() => {
    async function loadReviews() {
      try {
        const data = await fetchMovieReviews(id)
        setReviews(data)
      } catch (err) {
        console.error('Arvostelujen lataus epäonnistui:', err)
      }
    }

    loadReviews()
  }, [id, reviewReload])

  const handleAddFavorite = async () => {
    try {
      setFavoriteStatus(texts.loading)

      let poster = movie.posterUrl || movie.poster_path || ''
      if (poster.startsWith('https://image.tmdb.org/t/p/')) {
        poster = poster.replace(/^https:\/\/image\.tmdb\.org\/t\/p\/[^\/]+/, '')
      }

      const detectedType = pathname.startsWith('/tv') ? 'tv' : 'movie'

      await addFavoriteApi({
        movieId: String(movie.id),
        movieTitle: movie.title,
        posterPath: poster,
        type: detectedType,
      })

      setFavoriteStatus(`❤️ ${texts.inFavorites}`)
    } catch (err) {
      console.error('Suosikkivirhe:', err)
      setFavoriteStatus(errorMessage(err, texts))
    }
  }

  if (!movie) {
    return <p>{texts.loading}</p>
  }

  const filteredReviews = user
    ? reviews.filter(
        (review) => Number(review.account_id) !== Number(user.id)
      )
    : reviews

  const visibleReviews = filteredReviews.slice(0, visibleCount)

  return (
    <>
      <section className="movie-details">
        {movie.posterUrl ? (
          <img
            className="movie-details-poster"
            src={movie.posterUrl}
            alt={movie.title || texts.titleMissing}
          />
        ) : (
          <div className="movie-details-poster-placeholder">
            {texts.posterMissing}
          </div>
        )}

        <div>
          <h1>{movie.title || texts.titleMissing}</h1>

          {movie.genres && (
            <p className="movie-meta">
              {movie.year} · {movie.genres.map((genre) => genre.name).join(' · ')}
            </p>
          )}

          {movie.rating !== null && movie.rating !== undefined && (
            <p>★ {movie.rating.toFixed(1)}</p>
          )}

          <p className="movie-description">
            {movie.overview || texts.descriptionMissing}
          </p>

          {user && (
            <div className="movie-actions">
              <div>
                <button className="button" onClick={handleAddFavorite}>
                  ❤️ {texts.addToFavorites}
                </button>
                {favoriteStatus && <p style={{ marginTop: '8px' }}>{favoriteStatus}</p>}
              </div>

              <AddToGroupModel movie={movie} />
            </div>
          )}
        </div>
      </section>

      <section className="page-section">
        <div className="section-heading">
          <h2>{texts.reviews}</h2>
        </div>

        {filteredReviews.length === 0 ? (
          <p className="status-message">Ei vielä arvosteluja.</p>
        ) : (
          <>
            {visibleReviews.map((review) => (
              <article className="panel" key={review.id}>
                <p>
                  <strong>{review.username}</strong>
                </p>

                <p>
                  <span aria-hidden="true">
                    {'★'.repeat(review.stars)}
                    {'☆'.repeat(5 - review.stars)}
                  </span>{' '}
                  {review.stars}/5
                </p>

                <p>{review.review_text}</p>

                <small>
                  {new Date(review.created_at).toLocaleDateString(locale)}
                </small>
              </article>
            ))}

            {visibleCount < filteredReviews.length && (
              <button 
                className="button secondary-button" 
                onClick={() => setVisibleCount((prev) => prev + 3)}
                style={{ marginTop: '16px' }}
              >
                Näytä lisää
              </button>
            )}
          </>
        )}

        {user && (
          <ReviewForm
            movie={movie}
            onSaved={() => setReviewReload((value) => value + 1)}
          />
        )}
      </section>
    </>
  )
}
```[cite: 10]

---

### 2. `favoriteRouter.js` (pidetty vanhat kommentit):
```javascript
import { Router } from 'express'
import { auth } from '../middleware/auth.js'
import { checkRequest } from '../middleware/checkRequest.js'
import { getUserFavorites, addFavorite, removeFavorite } from '../models/favoriteModel.js'

const router = Router()

// Middlewaret: tarkistetaan pyynnön kelvollisuus ja käyttäjän tunnistautuminen
router.use(checkRequest)
router.use(auth)

// Apufunktio käyttäjän ID:n hakemiseen tokenista/pyynnöstä
const getAccountId = (req) => {
  return req.user?.id ?? req.user?.account_id ?? req.user?.accountId
}

// POST /api/favorites - Lisää elokuva tai sarja suosikkeihin
router.post('/', async (req, res, next) => {
  try {
    const accountId = getAccountId(req)

    if (!accountId) {
      return res.status(401).json({ error: 'Käyttäjä-ID puuttuu' })
    }

    const { movieId, movieTitle, posterPath, type } = req.body

    if (!movieId) {
      return res.status(400).json({ error: 'Elokuvan ID (movieId) puuttuu' })
    }

    const mediaType = type === 'tv' ? 'tv' : 'movie'
    const newFavorite = await addFavorite(accountId, movieId, movieTitle, posterPath, mediaType)

    res.status(201).json(newFavorite)
  } catch (err) {
    next(err)
  }
})

// GET /api/favorites - Hae käyttäjän kaikki suosikit
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

// DELETE /api/favorites/:movieId - Poista elokuva tai sarja suosikeista
router.delete('/:movieId', async (req, res, next) => {
  try {
    const accountId = getAccountId(req)

    if (!accountId) {
      return res.status(401).json({ error: 'Käyttäjä-ID puuttuu' })
    }

    const { movieId } = req.params

    if (!movieId || movieId === 'undefined') {
      return res.status(400).json({ error: 'Virheellinen tai puuttuva movieId' })
    }

    const removedFavorite = await removeFavorite(accountId, movieId)

    if (!removedFavorite) {
      return res.status(404).json({ error: 'Suosikkia ei löytynyt käyttäjältä' })
    }

    res.json({ message: 'Suosikki poistettu', removed: removedFavorite })
  } catch (err) {
    next(err)
  }
})

export default router
```[cite: 11]

*(Varmistathan vielä että `favoriteModel.js`-tiedostossasi `addFavorite`-funktio ottaa vastaan ja tallentaa tuon `type`-arvon tietokantaan asti!)*