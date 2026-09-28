import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api, addFavoriteApi } from '../api.js'
import { useLanguage } from '../context/useLanguage.js'
import { useUser } from '../context/useUser.js'

export default function MovieDetails() {
  const { id } = useParams()
  const { locale } = useLanguage()
  const { user } = useUser()
  const [movie, setMovie] = useState(null)
  const [favoriteStatus, setFavoriteStatus] = useState('')

  useEffect(() => {
    async function loadMovie() {
      const response = await api.get(`/api/movies/${id}`, {
        params: { language: locale },
      })

      setMovie(response.data)
    }

    loadMovie()
  }, [id, locale])

  const handleAddFavorite = async () => {
    try {
      setFavoriteStatus('Tallennetaan...')
      
      let poster = movie.posterUrl || movie.poster_path || ''
      if (poster.startsWith('https://image.tmdb.org/t/p/')) {
        poster = poster.replace(/^https:\/\/image\.tmdb\.org\/t\/p\/[^\/]+/, '')
      }

      await addFavoriteApi({
        movieId: String(movie.id),
        movieTitle: movie.title,
        posterPath: poster,
      })

      setFavoriteStatus('❤️ Lisätty suosikkeihin!')
    } catch (err) {
      console.error('Suosikkivirhe:', err)
      if (err.response && err.response.status === 409) {
        setFavoriteStatus('Elokuva on jo suosikeissasi!')
      } else {
        setFavoriteStatus('Lisääminen epäonnistui. Kirjaudu uudelleen sisään.')
      }
    }
  }

  if (!movie) {
    return <p>Ladataan...</p>
  }

  return (
    <section className="movie-details">
      {movie.posterUrl && (
        <img
          className="movie-details-poster"
          src={movie.posterUrl}
          alt={movie.title}
        />
      )}

      <div>
        <h1>{movie.title}</h1>

        <p className="movie-meta">
          {movie.year} · {movie.genres.map((genre) => genre.name).join(' · ')}
        </p>

        {movie.rating !== null && (
          <p>★ {movie.rating.toFixed(1)}</p>
        )}

        <p className="movie-description">
          {movie.overview || 'Kuvausta ei ole saatavilla.'}
        </p>

        {user && (
          <div style={{ marginTop: '20px' }}>
            <button className="button" onClick={handleAddFavorite}>
              ❤️ Lisää suosikkeihin
            </button>
            {favoriteStatus && <p style={{ marginTop: '8px' }}>{favoriteStatus}</p>}
          </div>
        )}
      </div>
    </section>
  )
}