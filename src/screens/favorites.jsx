import React, { useEffect, useState } from 'react';
import { fetchFavorites, removeFavoriteApi } from '../api';

export default function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFavorites()
      .then((data) => {
        setFavorites(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Suosikkien hakeminen epäonnistui. Oletko kirjautunut sisään?');
        setLoading(false);
      });
  }, []);

  const handleRemove = async (movieId) => {
    try {
      await removeFavoriteApi(movieId);
      setFavorites(favorites.filter((item) => item.movie_id !== movieId));
    } catch {
      alert('Poisto epäonnistui.');
    }
  };

  if (loading) return <div>Ladataan suosikkeja...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Omat suosikit</h2>
      {favorites.length === 0 ? (
        <p>Ei vielä tallennettuja suosikkeja.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
          {favorites.map((movie) => (
            <div key={movie.id} style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '8px' }}>
              {movie.poster_path && (
                <img 
                  src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`} 
                  alt={movie.movie_title} 
                  style={{ width: '100%', borderRadius: '4px' }}
                />
              )}
              <h3>{movie.movie_title}</h3>
              <button onClick={() => handleRemove(movie.movie_id)}>Poista suosikeista</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}