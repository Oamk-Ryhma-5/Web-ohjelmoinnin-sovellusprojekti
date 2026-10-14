import React, { useEffect, useState } from 'react'
import { fetchSharedFavorites, errorMessage } from '../api'
import { useLanguage } from '../context/useLanguage.js'
import { Link, useParams } from 'react-router-dom'

export default function SharedFavorites() {
  const { accountId } = useParams()
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Haetaan tekstit ja kieli suoraan sovelluksen useLanguage-contextista
  const { texts, lang } = useLanguage()

  useEffect(() => {
    fetchSharedFavorites(accountId)
      .then((data) => {
        setFavorites(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(errorMessage(err, texts))
        setLoading(false)
      })
  }, [accountId, lang, texts])

  if (loading) return <div>{texts.loading}</div>
  if (error) return <div style={{ color: 'var(--error-text)' }}>{error}</div>

  return (
    <div style={{ padding: '20px' }}>
      <h2>{texts.favoritesTitle}</h2>
      
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
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
