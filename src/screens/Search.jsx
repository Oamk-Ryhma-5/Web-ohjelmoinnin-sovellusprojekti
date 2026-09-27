import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api, errorMessage } from '../api.js'
import { useLanguage } from '../context/useLanguage.js'
import MovieList from '../components/MovieList.jsx'

export default function Search() {
  const [parameters] = useSearchParams()
  // Takaisin-painike palauttaa myös aiemmin käytetyn lomakkeen.
  return <SearchForm key={parameters.toString()} parameters={parameters} />
}

function SearchForm({ parameters }) {
  const [, setParameters] = useSearchParams()
  const { texts, language, locale } = useLanguage()
  const [type, setType] = useState(parameters.get('type') === 'tv' ? 'tv' : 'movie')
  const [query, setQuery] = useState(parameters.get('q') || '')
  const [year, setYear] = useState(parameters.get('year') || '')
  const [genre, setGenre] = useState(parameters.get('genre') || '')
  const [genres, setGenres] = useState([])
  const [error, setError] = useState(null)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    async function loadGenres() {
      setGenres([])
      setError(null)
      try {
        const response = await api.get('/api/genres', {
          params: { type, language: locale },
          signal: controller.signal,
        })
        if (!controller.signal.aborted) setGenres(response.data.genres)
      } catch (error) {
        if (!controller.signal.aborted) setError(error)
      }
    }
    loadGenres()
    return () => controller.abort()
  }, [type, locale, retry])

  function search(event) {
    event.preventDefault()
    setParameters({ type, q: query.trim(), year, genre })
  }

  const submittedType = parameters.get('type') === 'tv' ? 'tv' : 'movie'
  const filters = new URLSearchParams({
    type: submittedType,
    query: parameters.get('q') || '',
    year: parameters.get('year') || '',
    genre: parameters.get('genre') || '',
  })
  const hasSearch = Boolean(filters.get('query') || filters.get('year') || filters.get('genre'))

  return (
    <section className="page-section">
      <div className="page-heading">
        <h1>{texts.searchTitle}</h1>
        <p>{texts.searchText}</p>
      </div>
      <form className="search-form panel" onSubmit={search}>
        <div className="form-field">
          <label htmlFor="type">{texts.type}</label>
          <select
            id="type"
            value={type}
            onChange={(event) => {
              setType(event.target.value)
              setGenre('')
            }}
          >
            <option value="movie">{texts.movies}</option>
            <option value="tv">{texts.series}</option>
          </select>
        </div>
        <div className="form-field search-name">
          <label htmlFor="title">{texts.name}</label>
          <input
            id="title"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            maxLength={200}
            placeholder={texts.searchPlaceholder}
          />
        </div>
        <div className="form-field">
          <label htmlFor="year">{type === 'tv' ? texts.firstYear : texts.year}</label>
          <input
            id="year"
            type="number"
            min="1800"
            max={new Date().getFullYear() + 5}
            step="1"
            value={year}
            onChange={(event) => setYear(event.target.value)}
            placeholder={texts.anyYear}
          />
        </div>
        <div className="form-field">
          <label htmlFor="genre">{texts.genre}</label>
          <select id="genre" value={genre} onChange={(event) => setGenre(event.target.value)}>
            <option value="">{texts.anyGenre}</option>
            {genres.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
        <button className="button search-submit" type="submit">
          {texts.searchButton}
        </button>
      </form>
      {error && (
        <div className="form-notice">
          <p role="alert">{errorMessage(error, texts)}</p>
          <button className="text-link" onClick={() => setRetry((value) => value + 1)}>
            {texts.retry}
          </button>
        </div>
      )}
      <div className="section-heading">
        <h2>{texts.results}</h2>
      </div>
      {hasSearch ? (
        <MovieList
          key={`${language}-${filters}`}
          url={`/api/search?${filters}`}
          type={submittedType}
        />
      ) : (
        <p className="status-message panel">{texts.startSearch}</p>
      )}
    </section>
  )
}
