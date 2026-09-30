import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api, addFavoriteApi, errorMessage } from '../api.js'
import { useLanguage } from '../context/useLanguage.js'
import { useUser } from '../context/useUser.js'

// Korjattu isompi alkukirjain ja tiedoston nimi
import AddToGroupModal from '../components/AddToGroupModal.jsx'

export default function MovieDetails() {
  const { id } = useParams()
  const { locale, texts } = useLanguage()
  const { user } = useUser()
  const [movie, setMovie] = useState(null)
  const [favoriteStatus, setFavoriteStatus] = useState('')

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

  return (
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
          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <button className="button" onClick={handleAddFavorite}>
                ❤️ {texts.addToFavorites}
              </button>
              {favoriteStatus && <p style={{ marginTop: '8px' }}>{favoriteStatus}</p>}
            </div>

            {/* Nappi ryhmään lisäämiselle */}
            <AddToGroupModal movie={movie} />
          </div>
        )}
      </div>
    </section>
  )
}