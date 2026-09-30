import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useUser } from '../context/useUser.js';
import { useLanguage } from '../context/useLanguage.js';

export default function GroupDetail() {
  const { id } = useParams();
  const location = useLocation();
  const { user } = useUser();
  const { texts } = useLanguage();

  const [group, setGroup] = useState(location.state?.group || null);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Haetaan ryhmän tiedot
  useEffect(() => {
    if (!group) {
      fetch(`/api/groups/${id}`)
        .then((res) => res.json())
        .then((data) => setGroup(data))
        .catch((err) => console.error('Virhe ryhmän tiedoin hakemisessa:', err));
    }
  }, [id, group]);

  // Haetaan ryhmään lisätyt elokuvat
  useEffect(() => {
    fetch(`/api/groups/${id}/movies`)
      .then((res) => res.json())
      .then((data) => {
        setMovies(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Virhe elokuvien hakemisessa:', err);
        setLoading(false);
      });
  }, [id]);

  // Elokuvan poistaminen ryhmästä
  async function handleDeleteMovie(movieId) {
    try {
      const response = await fetch(`/api/groups/${id}/movies/${movieId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        setMovies((prevMovies) =>
          prevMovies.filter((movie) => String(movie.movie_id) !== String(movieId) && String(movie.id) !== String(movieId))
        );
      } else {
        const errData = await response.json();
        console.error('Elokuvan poisto epäonnistui:', errData);
      }
    } catch (error) {
      console.error('Virhe elokuvaa poistettaessa:', error);
    }
  }

  if (loading) {
    return <div className="container"><p>Ladataan...</p></div>;
  }

  return (
    <div className="container" style={{ padding: '1rem' }}>
      <h1>{group ? group.name : `Ryhmä #${id}`}</h1>

      <section className="group-movies-section" style={{ marginTop: '2rem' }}>
        <h2>{texts?.groupMovies || 'Ryhmän elokuvat'}</h2>

        {movies.length === 0 ? (
          <p>Ryhmään ei ole vielä lisätty elokuvia.</p>
        ) : (
          <div
            className="movies-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: '1.5rem',
              marginTop: '1rem'
            }}
          >
            {movies.map((movie) => {
              // Tarkistetaan julisteen osoite
              const posterUrl = movie.poster_path
                ? movie.poster_path.startsWith('http')
                  ? movie.poster_path
                  : `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                : null;

              const targetMovieId = movie.movie_id || movie.id;

              return (
                <div
                  key={targetMovieId}
                  className="movie-card"
                  style={{
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    background: '#ffffff',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    justify: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  {posterUrl ? (
                    <img
                      src={posterUrl}
                      alt={movie.movie_title || movie.title}
                      style={{
                        width: '100%',
                        height: '225px',
                        objectFit: 'cover',
                        borderRadius: '4px'
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '225px',
                        background: '#f0f0f0',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#888',
                        fontSize: '0.85rem'
                      }}
                    >
                      Ei julistetta
                    </div>
                  )}

                  <h3
                    style={{
                      fontSize: '1rem',
                      margin: '0.75rem 0 0.5rem 0',
                      textAlign: 'center',
                      wordBreak: 'break-word'
                    }}
                  >
                    {movie.movie_title || movie.title}
                  </h3>

                  <button
                    onClick={() => handleDeleteMovie(targetMovieId)}
                    style={{
                      marginTop: 'auto',
                      background: '#ff4d4d',
                      color: 'white',
                      border: 'none',
                      padding: '0.4rem 0.8rem',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      width: '100%'
                    }}
                  >
                    {texts?.delete || 'Poista'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}