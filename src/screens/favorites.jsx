import React, { useEffect, useState } from 'react'
import { fetchFavorites, removeFavoriteApi, errorMessage } from '../api'
import { useLanguage } from '../context/useLanguage.js'
import { useUser } from '../context/useUser.js'
import { Link } from 'react-router-dom'

export default function Favorites() {
  const { user } = useUser()
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Haetaan tekstit ja kieli suoraan sovelluksen useLanguage-contextista
  const { texts, lang } = useLanguage()

  useEffect(() => {
    fetchFavorites()
      .then((data) => {
        setFavorites(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(errorMessage(err, texts))
        setLoading(false)
      })
  }, [lang, texts])

  const handleRemove = async (movieId) => {
    try {
      await removeFavoriteApi(movieId)
      setFavorites((prev) => prev.filter((item) => item.movie_id !== movieId))
    } catch (err) {
      alert(errorMessage(err, texts))
    }
  }

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/suosikit/shared/${user.id}`

    await navigator.clipboard.writeText(shareUrl)

    alert('Linkki kopioitu!')
}

  if (loading) return <div>{texts.loading}</div>
  if (error) return <div style={{ color: 'var(--error-text)' }}>{error}</div>

  return (
    <div style={{ padding: '20px' }}>
      <div className="favorites-header">
        <h2>{texts.favoritesTitle}</h2>

        <button
          className="button secondary small"
          onClick={handleShare}
        >
          {texts.shareFavorites}
      </button>
    </div>
      
      {favorites.length === 0 ? (
        <p>{texts.noFavorites}</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
          {favorites.map((movie) => (
            <div className="favorite-card" key={movie.id || movie.movie_id} style={{ border: '1px solid var(--border)', padding: '10px', borderRadius: '8px' }}>
              {movie.poster_path ? (
              <Link to={`/movie/${movie.movie_id}`}>  
                <img 
                  src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`} 
                  alt={movie.movie_title || texts.titleMissing} 
                  style={{ width: '100%', borderRadius: '4px' }}
                />
                </Link>
              ) : (
                <div style={{ height: '270px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--subtle)', borderRadius: '4px' }}>
                  {texts.posterMissing}
                </div>
              )}
              <h3>
                <Link to={`/movie/${movie.movie_id}`}>
                {movie.movie_title || texts.titleMissing}
                </Link>
                </h3>
              <button className="button secondary small" onClick={() => handleRemove(movie.movie_id)}>
                {texts.removeFromFavorites}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
