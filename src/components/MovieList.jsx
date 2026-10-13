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
        let movieResponseData = { results: [], nextPage: null }
        let genreResponseData = { genres: [] }

        // Tarkistetaan varmasti, onko kyseessä "all"-haku joko propseista tai URL-osoitteesta
        const isAll = type === 'all' || (url && (url.includes('type=all') || url.includes('type%3Dall')))

        if (isAll) {
          // Luodaan erilliset url-osoitteet elokuville ja sarjoille korvaamalla type=all (tai tyhjennetään tyyppi jos tarpeen)
          const movieUrl = url.replace(/type=all/g, 'type=movie').replace(/type%3Dall/g, 'type=movie')
          const tvUrl = url.replace(/type=all/g, 'type=tv').replace(/type%3Dall/g, 'type=tv')

          const [resMovie, resTv, resGenre] = await Promise.all([
            api.get(movieUrl, {
              params: { page, language: locale },
              signal: controller.signal,
              timeout: 60000,
            }),
            api.get(tvUrl, {
              params: { page, language: locale },
              signal: controller.signal,
              timeout: 60000,
            }),
            api.get('/api/genres', {
              params: { type: 'movie', language: locale },
              signal: controller.signal,
            }),
          ])

          const combinedResults = [
            ...(resMovie.data.results || []),
            ...(resTv.data.results || []),
          ]

          movieResponseData = {
            results: combinedResults,
            nextPage: resMovie.data.nextPage || resTv.data.nextPage,
          }
          genreResponseData = resGenre.data
        } else {
          const [movieResponse, genreResponse] = await Promise.all([
            api.get(url, {
              params: { page, language: locale },
              signal: controller.signal,
              timeout: 60000,
            }),
            api.get('/api/genres', {
              params: { type, language: locale },
              signal: controller.signal,
            }),
          ])
          movieResponseData = movieResponse.data
          genreResponseData = genreResponse.data
        }

        if (controller.signal.aborted) return

        setMovies((current) => {
          const allMovies =
            page === 1
              ? movieResponseData.results
              : [...current, ...movieResponseData.results]
          return allMovies.filter(
            (movie, index) => allMovies.findIndex((item) => item.id === movie.id) === index,
          )
        })
        setGenres(genreResponseData.genres || [])
        setNextPage(movieResponseData.nextPage)
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
          <MovieCard key={`${movie.media_type || type}-${movie.id}`} movie={movie} genres={genres} />
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