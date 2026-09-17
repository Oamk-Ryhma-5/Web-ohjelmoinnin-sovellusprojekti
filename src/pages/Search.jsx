import { useState } from 'react';

function Search() {
  const [searchTerm, setSearchTerm] = useState('');
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // Kutsutaan omaa backendia, joka käyttää kakkatahna-avainta
      const response = await fetch(`http://localhost:3001/api/movies/search?q=${encodeURIComponent(searchTerm)}`);
      
      if (!response.ok) {
        throw new Error('Haku epäonnistui');
      }

      const data = await response.json();
      setMovies(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem' }}>
      <h1>Elokuvahaku</h1>
      
      {/* Hakulomake */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
        <input
          type="text"
          placeholder="Etsi elokuvaa (esim. Batman)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1, padding: '0.5rem', fontSize: '1rem' }}
        />
        <button type="submit" style={{ padding: '0.5rem 1rem', fontSize: '1rem', cursor: 'pointer' }}>
          Hae
        </button>
      </form>

      {/* Tilan ilmoitukset */}
      {loading && <p>Ladataan elokuvia...</p>}
      {error && <p style={{ color: 'red' }}>Virhe: {error}</p>}

      {/* Hakutulokset */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
        {movies.map((movie) => (
          <div 
            key={movie.id} 
            style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '1rem', textAlign: 'center' }}
          >
            {movie.poster_path ? (
              <img
                src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`}
                alt={movie.title}
                style={{ borderRadius: '4px', maxWidth: '100%' }}
              />
            ) : (
              <div style={{ height: '250px', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                Ei kuvaa
              </div>
            )}
            <h3 style={{ fontSize: '1.1rem', margin: '0.5rem 0' }}>{movie.title}</h3>
            <p style={{ fontSize: '0.9rem', color: '#666' }}>
              {movie.release_date ? movie.release_date.split('-')[0] : 'Tuntematon vuosi'}
            </p>
          </div>
        ))}
      </div>

      {!loading && movies.length === 0 && searchTerm && (
        <p>Ei hakutuloksia hakusanalla "{searchTerm}".</p>
      )}
    </div>
  );
}

export default Search;