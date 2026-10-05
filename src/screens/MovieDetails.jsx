import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api, addFavoriteApi, fetchMovieReviews, errorMessage } from '../api.js'
import { useLanguage } from '../context/useLanguage.js'
import { useUser } from '../context/useUser.js'

import ReviewForm from '../components/ReviewForm.jsx'

import AddToGroupModel from '../components/AddToGroupModel.jsx'

export default function MovieDetails() {
  const { id } = useParams()
  const { locale, texts } = useLanguage()
  const { user } = useUser()
  const [movie, setMovie] = useState(null)
  const [favoriteStatus, setFavoriteStatus] = useState('')
  const [reviews, setReviews] = useState([])
  const [reviewReload, setReviewReload] = useState(0)

  useEffect(() => {
    async function loadMovie() {
      try {
        const response = await api.get(`/api/movies/${id}`, {
          params: { language: locale },
        })
        setMovie(response.data)
      } catch (err) {
        console.error('Virhe elokuvan latauksessa:', err)
      }
    }

    loadMovie()
  }, [id, locale])


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

      await addFavoriteApi({
        movieId: String(movie.id),
        movieTitle: movie.title,
        posterPath: poster,
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

  const visibleReviews = user
  ? reviews.filter(
      (review) => Number(review.account_id) !== Number(user.id)
    )
  : reviews

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

        {/* Näytetään toiminnot (Suosikki & Ryhmään lisääminen) kirjautuneelle käyttäjälle */}
        {user && (
          <div className="movie-actions">
            <div>
              <button className="button" onClick={handleAddFavorite}>
                ❤️ {texts.addToFavorites}
              </button>
              {favoriteStatus && <p style={{ marginTop: '8px' }}>{favoriteStatus}</p>}
            </div>

            {/* Nappi ryhmään lisäämiselle */}
            <AddToGroupModel movie={movie} />
          </div>
        )}
      </div>
    </section>


    <section className="page-section">
      <div className="section-heading">
        <h2>{texts.reviews}</h2>
      </div>

      {reviews.length === 0 ? (
        <p className="status-message">Ei vielä arvosteluja.</p>
      ) : (
        visibleReviews.map((review) => (
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
        ))
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