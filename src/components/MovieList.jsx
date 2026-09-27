import { useEffect, useState } from 'react'
import { api, errorMessage } from '../api.js'
import { useLanguage } from '../context/useLanguage.js'
import MovieCard from './MovieCard.jsx'

// Home ja Search käyttävät samaa listaa. Eri haku tai kieli saa uuden key-arvon,
// joten listan sivutus alkaa silloin alusta ilman vanhoja hakutuloksia.
export default function MovieList({ url, type = 'movie' }) {
  const { texts, locale } = useLanguage()
  const [movies, setMovies] = useState([])
  const [genres, setGenres] = useState([])
  const [page, setPage] = useState(1)
  const [nextPage, setNextPage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function loadMovies() {
      setLoading(true)
      setError(null)
      try {
        const [movieResponse, genreResponse] = await Promise.all([
          api.get(url, {
            params: { page, language: locale },
            signal: controller.signal,
            // Nimihaku ja genre yhdessä voivat lukea useita TMDB-sivuja.
            timeout: 60000,
          }),
          api.get('/api/genres', { params: { type, language: locale }, signal: controller.signal }),
        ])
        if (controller.signal.aborted) return
        setMovies((current) => {
          const allMovies =
            page === 1 ? movieResponse.data.results : [...current, ...movieResponse.data.results]
          return allMovies.filter(
            (movie, index) => allMovies.findIndex((item) => item.id === movie.id) === index,
          )
        })
        setGenres(genreResponse.data.genres)
        setNextPage(movieResponse.data.nextPage)
      } catch (error) {
        if (!controller.signal.aborted) setError(error)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadMovies()
    return () => controller.abort()
  }, [url, type, page, locale, retry])

  return (
    <div aria-busy={loading}>
      <div className="movie-grid">
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} genres={genres} />
        ))}
      </div>
      {loading && (
        <p className="status-message" role="status">
          {texts.loading}
        </p>
      )}
      {error && (
        <div className="status-message">
          <p role="alert">{errorMessage(error, texts)}</p>
          <button className="button secondary" onClick={() => setRetry((value) => value + 1)}>
            {texts.retry}
          </button>
        </div>
      )}
      {!loading && !error && movies.length === 0 && !nextPage && (
        <p className="status-message">{texts.noResults}</p>
      )}
      {!loading && !error && movies.length === 0 && nextPage && (
        <p className="status-message">{texts.continueSearch}</p>
      )}
      {!loading && !error && nextPage && (
        <div className="load-more">
          <button className="button secondary" onClick={() => setPage(nextPage)}>
            {texts.more}
          </button>
        </div>
      )}
    </div>
  )
}
