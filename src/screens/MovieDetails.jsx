import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api.js'
import { useLanguage } from '../context/useLanguage.js'

export default function MovieDetails() {
  const { id } = useParams()
  const { locale } = useLanguage()
  const [movie, setMovie] = useState(null)

  useEffect(() => {
    async function loadMovie() {
      const response = await api.get(`/api/movies/${id}`, {
        params: { language: locale },
      })

      setMovie(response.data)
    }

    loadMovie()
  }, [id, locale])

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
      </div>
    </section>
  )
}